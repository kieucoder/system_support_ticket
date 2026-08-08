using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.Data;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace SupportTicketSysterm.Services
{
    public class AuthService : IAuthService
    {
        private readonly TechSupportContext _context;
        private readonly IOtpService _otpService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;
        private readonly IPasswordHasher<KhachHang> _khachHangPasswordHasher;

        public AuthService(
            TechSupportContext context,
            IOtpService otpService,
            IEmailService emailService,
            ILogger<AuthService> logger,
            IPasswordHasher<KhachHang> khachHangPasswordHasher)
        {
            _context = context;
            _otpService = otpService;
            _emailService = emailService;
            _logger = logger;
            _khachHangPasswordHasher = khachHangPasswordHasher;
        }

        public async Task<(bool Success, string Message)> ForgotPasswordAsync(string email, string? ipAddress)
        {
            try
            {
                var cleanEmail = email.Trim().ToLower();
                var khachHang = await _context.KhachHangs.FirstOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == cleanEmail);

                if (khachHang == null)
                {
                    _logger.LogWarning("Yêu cầu khôi phục mật khẩu thất bại: Email {Email} không tồn tại.", email);
                    return (false, "Email không tồn tại trong hệ thống.");
                }

                // Check limit or cooldown bằng IdKhachHang
                if (await _otpService.IsHourlyLimitExceededAsync(khachHang.IdKhachHang))
                {
                    return (false, "Bạn đã vượt quá giới hạn gửi OTP (tối đa 5 lần một giờ). Vui lòng thử lại sau.");
                }

                var (allowed, remainingSeconds) = await _otpService.CanResendOtpAsync(khachHang.IdKhachHang, 60);
                if (!allowed)
                {
                    return (false, $"Vui lòng chờ {remainingSeconds} giây trước khi gửi lại OTP.");
                }

                // Generate and Save OTP với loại "QuenMatKhau"
                var otp = await _otpService.GenerateOtpAsync();
                var saved = await _otpService.SaveOtpAsync(khachHang.IdKhachHang, otp, "QuenMatKhau");

                if (!saved)
                {
                    return (false, "Lỗi hệ thống khi lưu mã OTP. Vui lòng thử lại.");
                }

                _logger.LogInformation("Đã sinh mã OTP băm thành công cho Quên mật khẩu email {Email} (IdKhachHang={IdKhachHang})",
                    cleanEmail, khachHang.IdKhachHang);

                // Send email via service (5 phút)
                try
                {
                    await _emailService.SendForgotPasswordEmailAsync(cleanEmail, khachHang.HoTen ?? "Khách hàng", otp, "5 phút");
                    _logger.LogInformation("Gửi email chứa OTP thành công tới {Email}", cleanEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi email chứa OTP tới {Email}", cleanEmail);
                    await _otpService.InvalidatePreviousOtpAsync(khachHang.IdKhachHang, "QuenMatKhau");
                    return (false, "Không thể gửi email chứa mã OTP. Vui lòng kiểm tra lại cấu hình SMTP.");
                }

                return (true, "Mã OTP đã được gửi thành công đến Email của bạn.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý ForgotPassword cho email {Email}", email);
                return (false, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
            }
        }

        public async Task<(bool Success, string Message)> VerifyForgotPasswordOtpAsync(string email, string otpCode)
        {
            try
            {
                var cleanEmail = email.Trim().ToLower();
                var cleanOtp = otpCode.Trim();

                var khachHang = await _context.KhachHangs
                    .FirstOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == cleanEmail);

                if (khachHang == null)
                {
                    return (false, "Tài khoản không tồn tại.");
                }

                // Xác thực OTP loại "QuenMatKhau"
                var result = await _otpService.ValidateOtpAsync(khachHang.IdKhachHang, cleanOtp, "QuenMatKhau");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác thực OTP cho email {Email}", email);
                return (false, "Đã xảy ra lỗi hệ thống khi xác thực mã OTP.");
            }
        }

        public async Task<(bool Success, string Message)> ResetPasswordAsync(string email, string otpCode, string newPassword)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var cleanEmail = email.Trim().ToLower();
                var cleanOtp = otpCode.Trim();

                // 1. Load Customer
                var khachHang = await _context.KhachHangs.FirstOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == cleanEmail);
                if (khachHang == null)
                {
                    return (false, "Tài khoản không tồn tại.");
                }

                // 2. Kiểm tra lại OTP đã được xác minh trước đó (DaSuDung = true, loại QuenMatKhau, khớp Hash, trong vòng 15 phút)
                var hashedInput = _otpService.HashOtp(cleanOtp);
                var fifteenMinsAgo = DateTime.Now.AddMinutes(-15);

                var verifiedOtpRecord = await _context.TaiKhoanOtps
                    .Where(o => o.IdKhachHang == khachHang.IdKhachHang
                             && o.LoaiOTP == "QuenMatKhau"
                             && o.MaOTPBam == hashedInput
                             && o.DaSuDung
                             && o.ThoiGianTao >= fifteenMinsAgo)
                    .OrderByDescending(o => o.ThoiGianTao)
                    .FirstOrDefaultAsync();

                if (verifiedOtpRecord == null)
                {
                    return (false, "Xác minh OTP hết hạn hoặc không hợp lệ. Vui lòng thực hiện lại quy trình Quên mật khẩu.");
                }

                // 3. Update Password (ASP.NET Core Identity PasswordHasher)
                khachHang.MatKhau = _khachHangPasswordHasher.HashPassword(khachHang, newPassword);

                // 4. Invalidate all OTPs for this customer
                await _otpService.InvalidatePreviousOtpAsync(khachHang.IdKhachHang, "QuenMatKhau");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Khách hàng {Email} đã khôi phục mật khẩu thành công bằng mã OTP.", cleanEmail);
                return (true, "Đổi mật khẩu thành công!");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi hệ thống khi khôi phục mật khẩu cho {Email}", email);
                return (false, "Đã xảy ra lỗi hệ thống khi đặt lại mật khẩu.");
            }
        }
    }
}
