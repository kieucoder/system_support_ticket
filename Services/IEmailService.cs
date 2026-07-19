using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
        Task SendOtpEmailAsync(string toEmail, string fullName, string otpCode);
        Task SendRegisterSuccessEmailAsync(string toEmail, string fullName, string phoneNumber, string registerDate);
        Task SendForgotPasswordEmailAsync(string toEmail, string fullName, string otpCode, string expiredTime);
    }
}
