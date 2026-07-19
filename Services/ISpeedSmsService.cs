using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface ISpeedSmsService
    {
        Task<bool> SendOtpAsync(string phone, string otp);
    }
}
