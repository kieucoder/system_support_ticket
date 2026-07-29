using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync();
        Task<bool> SaveOtpAsync(int idKhachHang, string otpCode);
        Task<bool> DeletePreviousOtpAsync(int idKhachHang);
        Task<(bool Allowed, int RemainingSeconds)> CanResendOtpAsync(int idKhachHang, int cooldownSeconds = 60);
        Task<bool> IsHourlyLimitExceededAsync(int idKhachHang);
    }
}
