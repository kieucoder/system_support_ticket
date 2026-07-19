using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync();
        Task<bool> SaveOtpAsync(string email, string otpCode, string? ipAddress);
        Task<OtpVerificationResult> VerifyOtpAsync(string email, string otpCode);
        Task<bool> DeleteExpiredOtpAsync();
        Task<bool> InvalidatePreviousOtpAsync(string email);
        Task<(bool Allowed, int RemainingSeconds)> CanResendOtpAsync(string email, int cooldownSeconds = 60);
        Task<bool> IsHourlyLimitExceededAsync(string email);
    }
}
