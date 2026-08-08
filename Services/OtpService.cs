using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.Data;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class OtpService : IOtpService
    {
        private const int ExpiryMinutes = 5;
        private const int MaxFailedAttempts = 5;
        private readonly TechSupportContext _context;
        private readonly ILogger<OtpService> _logger;

        public OtpService(TechSupportContext context, ILogger<OtpService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public Task<string> GenerateOtpAsync()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            uint val = BitConverter.ToUInt32(bytes, 0);
            uint otpVal = (val % 900000) + 100000; // 6-digit OTP (100000 - 999999)
            return Task.FromResult(otpVal.ToString());
        }

        public string HashOtp(string otp)
        {
            if (string.IsNullOrWhiteSpace(otp)) return string.Empty;
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(otp.Trim() + "_OtpSalt_2026"));
            return Convert.ToHexString(bytes);
        }

        public async Task<bool> SaveOtpAsync(int idKhachHang, string otpCode, string loaiOtp)
        {
            try
            {
                // Vô hiệu hóa các OTP cũ của khách hàng cùng loại này
                await InvalidatePreviousOtpAsync(idKhachHang, loaiOtp);

                var now = DateTime.Now;
                var otpVerification = new TaiKhoanOtp
                {
                    IdKhachHang = idKhachHang,
                    MaOTPBam = HashOtp(otpCode),
                    ThoiGianTao = now,
                    HanSuDung = now.AddMinutes(ExpiryMinutes),
                    DaSuDung = false,
                    SoLanNhapSai = 0,
                    LoaiOTP = loaiOtp
                };

                _context.TaiKhoanOtps.Add(otpVerification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Đã lưu OTP băm cho khách hàng ID {IdKhachHang}, Loại={LoaiOTP}, hết hạn lúc {ExpiredAt}",
                    idKhachHang, loaiOtp, otpVerification.HanSuDung);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lưu OTP cho khách hàng ID {IdKhachHang}, Loại={LoaiOTP}", idKhachHang, loaiOtp);
                return false;
            }
        }

        public async Task<bool> InvalidatePreviousOtpAsync(int idKhachHang, string? loaiOtp = null)
        {
            try
            {
                var query = _context.TaiKhoanOtps.Where(o => o.IdKhachHang == idKhachHang && !o.DaSuDung);
                if (!string.IsNullOrEmpty(loaiOtp))
                {
                    query = query.Where(o => o.LoaiOTP == loaiOtp);
                }

                var previousOtps = await query.ToListAsync();
                if (previousOtps.Any())
                {
                    foreach (var otp in previousOtps)
                    {
                        otp.DaSuDung = true;
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Đã vô hiệu hóa {Count} OTP cũ của khách hàng ID {IdKhachHang}", previousOtps.Count, idKhachHang);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi vô hiệu hóa OTP cũ của khách hàng ID {IdKhachHang}", idKhachHang);
                return false;
            }
        }

        public async Task<(bool Success, string Message)> ValidateOtpAsync(int idKhachHang, string inputOtp, string loaiOtp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(inputOtp))
                {
                    return (false, "Vui lòng nhập đầy đủ mã OTP.");
                }

                var cleanInput = inputOtp.Trim();

                var latestOtp = await _context.TaiKhoanOtps
                    .Where(o => o.IdKhachHang == idKhachHang && o.LoaiOTP == loaiOtp && !o.DaSuDung)
                    .OrderByDescending(o => o.ThoiGianTao)
                    .FirstOrDefaultAsync();

                if (latestOtp == null)
                {
                    return (false, "Mã OTP không tồn tại hoặc đã được sử dụng. Vui lòng chọn Gửi lại mã OTP.");
                }

                var now = DateTime.Now;

                // 1. Kiểm tra thời hạn (5 phút)
                if (latestOtp.HanSuDung.HasValue && latestOtp.HanSuDung.Value < now)
                {
                    latestOtp.DaSuDung = true;
                    await _context.SaveChangesAsync();
                    return (false, "Mã OTP đã hết hạn. Vui lòng chọn Gửi lại mã OTP.");
                }

                // 2. Kiểm tra số lần nhập sai
                if (latestOtp.SoLanNhapSai >= MaxFailedAttempts)
                {
                    latestOtp.DaSuDung = true;
                    await _context.SaveChangesAsync();
                    return (false, "Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần. Vui lòng chọn Gửi lại mã OTP.");
                }

                // 3. Kiểm tra mã OTP bằng băm
                var hashedInput = HashOtp(cleanInput);
                if (latestOtp.MaOTPBam == hashedInput)
                {
                    latestOtp.DaSuDung = true;
                    latestOtp.SoLanNhapSai = 0;
                    await _context.SaveChangesAsync();
                    return (true, "Xác thực mã OTP thành công.");
                }
                else
                {
                    latestOtp.SoLanNhapSai += 1;
                    if (latestOtp.SoLanNhapSai >= MaxFailedAttempts)
                    {
                        latestOtp.DaSuDung = true;
                    }
                    await _context.SaveChangesAsync();

                    if (latestOtp.DaSuDung)
                    {
                        return (false, "Mã OTP không chính xác. Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần.");
                    }

                    return (false, $"Mã OTP không chính xác. Bạn còn {MaxFailedAttempts - latestOtp.SoLanNhapSai} lần thử.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác thực OTP cho khách hàng ID {IdKhachHang}, Loại={LoaiOTP}", idKhachHang, loaiOtp);
                return (false, "Đã xảy ra lỗi hệ thống khi xác thực mã OTP.");
            }
        }

        public async Task<(bool Allowed, int RemainingSeconds)> CanResendOtpAsync(int idKhachHang, int cooldownSeconds = 60)
        {
            var latestOtp = await _context.TaiKhoanOtps
                .Where(o => o.IdKhachHang == idKhachHang)
                .OrderByDescending(o => o.ThoiGianTao)
                .FirstOrDefaultAsync();

            if (latestOtp == null || !latestOtp.ThoiGianTao.HasValue)
            {
                return (true, 0);
            }

            var elapsed = (int)(DateTime.Now - latestOtp.ThoiGianTao.Value).TotalSeconds;
            var remaining = cooldownSeconds - elapsed;
            return remaining > 0 ? (false, remaining) : (true, 0);
        }

        public async Task<bool> IsHourlyLimitExceededAsync(int idKhachHang)
        {
            var oneHourAgo = DateTime.Now.AddHours(-1);
            var count = await _context.TaiKhoanOtps
                .CountAsync(o => o.IdKhachHang == idKhachHang && o.ThoiGianTao.HasValue && o.ThoiGianTao.Value >= oneHourAgo);

            return count >= 5;
        }
    }
}
