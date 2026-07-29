using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class AuthService : IAuthService
    {
        private readonly TechSupportContext _context;
        private readonly IOtpService _otpService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            TechSupportContext context,
            IOtpService otpService,
            IEmailService emailService,
            ILogger<AuthService> logger)
        {
            _context = context;
            _otpService = otpService;
            _emailService = emailService;
            _logger = logger;
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

                // Generate and Save OTP
                var otp = await _otpService.GenerateOtpAsync();
                var saved = await _otpService.SaveOtpAsync(khachHang.IdKhachHang, otp);

                if (!saved)
                {
                    return (false, "Lỗi hệ thống khi lưu mã OTP. Vui lòng thử lại.");
                }

                _logger.LogInformation("Đã sinh mã OTP thành công cho email {Email} (IdKhachHang={IdKhachHang})",
                    cleanEmail, khachHang.IdKhachHang);

                // Send email via service
                try
                {
                    await _emailService.SendForgotPasswordEmailAsync(cleanEmail, khachHang.HoTen ?? "Khách hàng", otp, "5 phút");
                    _logger.LogInformation("Gửi email chứa OTP thành công tới {Email}", cleanEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi email chứa OTP tới {Email}", cleanEmail);
                    await _otpService.DeletePreviousOtpAsync(khachHang.IdKhachHang);
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

                // Tìm KhachHang để lấy IdKhachHang
                var khachHang = await _context.KhachHangs
                    .FirstOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == cleanEmail);

                if (khachHang == null)
                {
                    return (false, "Tài khoản không tồn tại.");
                }

                // Lọc OTP theo IdKhachHang + OTP
                var otpRecord = await _context.TaiKhoanOtps
                    .Where(o => o.IdKhachHang == khachHang.IdKhachHang
                             && o.Otp == cleanOtp
                             && o.HanSuDung > DateTime.Now)
                    .OrderByDescending(o => o.ThoiGianTao)
                    .FirstOrDefaultAsync();

                if (otpRecord == null)
                {
                    return (false, "Mã OTP không chính xác.");
                }

                return (true, "Xác minh OTP thành công.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác thực OTP cho email {Email}", email);
                return (false, "Đã xảy ra lỗi hệ thống khi xác thực.");
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

                // 2. Verify OTP lại
                var otpRecord = await _context.TaiKhoanOtps
                    .Where(o => o.IdKhachHang == khachHang.IdKhachHang
                             && o.Otp == cleanOtp
                             && o.HanSuDung > DateTime.Now)
                    .OrderByDescending(o => o.ThoiGianTao)
                    .FirstOrDefaultAsync();

                if (otpRecord == null)
                {
                    return (false, "Mã OTP không chính xác.");
                }

                // 3. Update Password (BCrypt hash)
                khachHang.MatKhau = BCrypt.Net.BCrypt.HashPassword(newPassword);
                
                // 4. Clean up all OTPs for this customer
                await _otpService.DeletePreviousOtpAsync(khachHang.IdKhachHang);

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
