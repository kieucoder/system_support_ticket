using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync();
        string HashOtp(string otp);
        Task<bool> SaveOtpAsync(int idKhachHang, string otpCode, string loaiOtp);
        Task<(bool Success, string Message)> ValidateOtpAsync(int idKhachHang, string inputOtp, string loaiOtp);
        Task<bool> InvalidatePreviousOtpAsync(int idKhachHang, string? loaiOtp = null);
        Task<(bool Allowed, int RemainingSeconds)> CanResendOtpAsync(int idKhachHang, int cooldownSeconds = 60);
        Task<bool> IsHourlyLimitExceededAsync(int idKhachHang);
    }
}
