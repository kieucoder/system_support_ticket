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
        private const int MaxAttempts = 5;
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

        public async Task<bool> SaveOtpAsync(string email, string otpCode, string? ipAddress)
        {
            try
            {
                await DeleteExpiredOtpAsync();

                // Invalidate previous OTP for this email
                await InvalidatePreviousOtpAsync(email);

                var otpVerification = new XacThucOtp
                {
                    Email = email.Trim(),
                    MaOtp = otpCode.Trim(),
                    ThoiGianTao = DateTime.UtcNow,
                    ThoiGianHetHan = DateTime.UtcNow.AddMinutes(ExpiryMinutes),
                    SoLanThu = 0,
                    DaSuDung = false,

                    NguoiTao = "Registration"
                };

                _context.XacThucOtps.Add(otpVerification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Đã lưu OTP cho email {Email}, hết hạn lúc {ExpiredAt}", email, otpVerification.ThoiGianHetHan);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lưu OTP cho email {Email}", email);
                return false;
            }
        }

        public async Task<OtpVerificationResult> VerifyOtpAsync(string email, string otpCode)
        {
            try
            {
                var otpRecord = await _context.XacThucOtps
                    .Where(o => o.Email == email && !o.DaSuDung)
                    .OrderByDescending(o => o.ThoiGianTao)
                    .FirstOrDefaultAsync();

                if (otpRecord == null)
                {
                    _logger.LogWarning("Không tìm thấy OTP còn hiệu lực cho email {Email}", email);
                    return new OtpVerificationResult
                    {
                        Status = OtpVerificationStatus.NotFound,
                        Message = "Vui lòng yêu cầu gửi lại mã OTP mới."
                    };
                }

                // Check if expired
                if (DateTime.UtcNow > otpRecord.ThoiGianHetHan)
                {
                    otpRecord.DaSuDung = true;
                    await _context.SaveChangesAsync();
                    _logger.LogWarning("OTP hết hạn cho email {Email}", email);
                    return new OtpVerificationResult
                    {
                        Status = OtpVerificationStatus.Expired,
                        Message = "Mã OTP đã hết hạn."
                    };
                }

                // Check attempt count (lockout check)
                if (otpRecord.SoLanThu >= MaxAttempts)
                {
                    otpRecord.DaSuDung = true;
                    await _context.SaveChangesAsync();
                    _logger.LogWarning("OTP bị khóa cho email {Email} do vượt quá số lần thử", email);
                    return new OtpVerificationResult
                    {
                        Status = OtpVerificationStatus.Locked,
                        Message = "Mã OTP đã bị khóa do nhập sai quá nhiều lần. Vui lòng gửi lại OTP."
                    };
                }

                // Verify OTP code
                if (otpCode.Trim() != otpRecord.MaOtp)
                {
                    otpRecord.SoLanThu++;

                    if (otpRecord.SoLanThu >= MaxAttempts)
                    {
                        otpRecord.DaSuDung = true;
                    }

                    await _context.SaveChangesAsync();
                    _logger.LogWarning("OTP xác thực thất bại cho email {Email}. Lần sai thứ {Attempt}", email, otpRecord.SoLanThu);

                    if (otpRecord.SoLanThu >= MaxAttempts)
                    {
                        return new OtpVerificationResult
                        {
                            Status = OtpVerificationStatus.Locked,
                            Message = "Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng gửi lại OTP."
                        };
                    }

                    return new OtpVerificationResult
                    {
                        Status = OtpVerificationStatus.Invalid,
                        Message = $"Mã OTP không chính xác. Bạn còn {MaxAttempts - otpRecord.SoLanThu} lần nhập."
                    };
                }

                // OTP is valid
                otpRecord.DaSuDung = true;
                await _context.SaveChangesAsync();

                _logger.LogInformation("OTP xác thực thành công cho email {Email}", email);
                return new OtpVerificationResult
                {
                    Status = OtpVerificationStatus.Success,
                    Message = "Xác thực OTP thành công."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xác thực OTP cho email {Email}", email);
                return new OtpVerificationResult
                {
                    Status = OtpVerificationStatus.Error,
                    Message = "Lỗi hệ thống khi xác thực OTP."
                };
            }
        }

        public async Task<bool> DeleteExpiredOtpAsync()
        {
            try
            {
                var expiredOtps = await _context.XacThucOtps
                    .Where(o => o.ThoiGianHetHan < DateTime.UtcNow)
                    .ToListAsync();

                if (expiredOtps.Any())
                {
                    _context.XacThucOtps.RemoveRange(expiredOtps);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Đã dọn {Count} OTP hết hạn", expiredOtps.Count);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi dọn OTP hết hạn");
                return false;
            }
        }

        public async Task<bool> InvalidatePreviousOtpAsync(string email)
        {
            try
            {
                var previousOtps = await _context.XacThucOtps
                    .Where(o => o.Email == email && !o.DaSuDung)
                    .ToListAsync();

                if (previousOtps.Any())
                {
                    foreach (var otp in previousOtps)
                    {
                        otp.DaSuDung = true;
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Đã vô hiệu hóa {Count} OTP cũ của {Email}", previousOtps.Count, email);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi vô hiệu hóa OTP cũ của {Email}", email);
                return false;
            }
        }

        public async Task<(bool Allowed, int RemainingSeconds)> CanResendOtpAsync(string email, int cooldownSeconds = 60)
        {
            var latestOtp = await _context.XacThucOtps
                .Where(o => o.Email == email)
                .OrderByDescending(o => o.ThoiGianTao)
                .FirstOrDefaultAsync();

            if (latestOtp == null)
            {
                return (true, 0);
            }

            var elapsed = (int)(DateTime.UtcNow - latestOtp.ThoiGianTao).TotalSeconds;
            var remaining = cooldownSeconds - elapsed;
            return remaining > 0 ? (false, remaining) : (true, 0);
        }

        public async Task<bool> IsHourlyLimitExceededAsync(string email)
        {
            var oneHourAgo = DateTime.UtcNow.AddHours(-1);
            var count = await _context.XacThucOtps
                .CountAsync(o => o.Email == email && o.ThoiGianTao >= oneHourAgo);
            
            return count >= 5;
        }
    }
}
