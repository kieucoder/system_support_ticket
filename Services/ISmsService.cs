namespace SupportTicketSysterm.Services
{
    public interface ISmsService
    {
        Task<bool> SendOtpAsync(string phoneNumber, string otp);
    }
}
