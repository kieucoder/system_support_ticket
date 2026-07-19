using System.Threading.Tasks;

namespace SupportTicketSysterm.ViewModels.Services
{
    public interface ITwilioService
    {
        Task<bool> SendOtpAsync(string phoneNumber, string otp);
    }
}
