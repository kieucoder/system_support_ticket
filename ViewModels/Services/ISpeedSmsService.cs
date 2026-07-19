using System.Threading.Tasks;

namespace SupportTicketSysterm.ViewModels.Services
{
    public interface ISpeedSmsService
    {
        Task<bool> SendOtpAsync(string phone, string otp);
    }
}
