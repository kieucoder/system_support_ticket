using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.Data;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class OtpService : IOtpService
    {
        private const int ExpiryMinutes = 5;
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
            uint otpVal = (val % 900000) + 100000; // Ensure 6-digit OTP (100000 - 999999)
            return Task.FromResult(otpVal.ToString());
        }

        public async Task<bool> SaveOtpAsync(int idKhachHang, string otpCode)
        {
            try
            {
                // Xóa các OTP cũ của khách hàng này
                await DeletePreviousOtpAsync(idKhachHang);

                var otpVerification = new TaiKhoanOtp
                {
                    IdKhachHang = idKhachHang,
                    Otp = otpCode.Trim(),
                    ThoiGianTao = DateTime.Now,
                    HanSuDung = DateTime.Now.AddMinutes(ExpiryMinutes)
                };

                _context.TaiKhoanOtps.Add(otpVerification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Đã lưu OTP cho khách hàng ID {IdKhachHang}, hết hạn lúc {ExpiredAt}",
                    idKhachHang, otpVerification.HanSuDung);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lưu OTP cho khách hàng ID {IdKhachHang}", idKhachHang);
                return false;
            }
        }

        public async Task<bool> DeletePreviousOtpAsync(int idKhachHang)
        {
            try
            {
                var previousOtps = await _context.TaiKhoanOtps
                    .Where(o => o.IdKhachHang == idKhachHang)
                    .ToListAsync();

                if (previousOtps.Any())
                {
                    _context.TaiKhoanOtps.RemoveRange(previousOtps);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Đã xóa {Count} OTP cũ của khách hàng ID {IdKhachHang}", previousOtps.Count, idKhachHang);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa OTP cũ của khách hàng ID {IdKhachHang}", idKhachHang);
                return false;
            }
        }

        public async Task<(bool Allowed, int RemainingSeconds)> CanResendOtpAsync(int idKhachHang, int cooldownSeconds = 60)
        {
            var latestOtp = await _context.TaiKhoanOtps
                .Where(o => o.IdKhachHang == idKhachHang)
                .OrderByDescending(o => o.ThoiGianTao)
                .FirstOrDefaultAsync();

            if (latestOtp == null)
            {
                return (true, 0);
            }

            var elapsed = (int)(DateTime.Now - latestOtp.ThoiGianTao).TotalSeconds;
            var remaining = cooldownSeconds - elapsed;
            return remaining > 0 ? (false, remaining) : (true, 0);
        }

        public async Task<bool> IsHourlyLimitExceededAsync(int idKhachHang)
        {
            var oneHourAgo = DateTime.Now.AddHours(-1);
            var count = await _context.TaiKhoanOtps
                .CountAsync(o => o.IdKhachHang == idKhachHang && o.ThoiGianTao >= oneHourAgo);
            
            return count >= 5;
        }
    }
}
