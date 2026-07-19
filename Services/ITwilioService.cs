using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface ITwilioService
    {
        Task<bool> SendOtpAsync(string phoneNumber, string otp);
    }
}
