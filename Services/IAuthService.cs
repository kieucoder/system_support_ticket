using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string Message)> ForgotPasswordAsync(string email, string? ipAddress);
        Task<(bool Success, string Message)> VerifyForgotPasswordOtpAsync(string email, string otpCode);
        Task<(bool Success, string Message)> ResetPasswordAsync(string email, string otpCode, string newPassword);
    }
}
