namespace SupportTicketSysterm.Services
{
    public class OtpVerificationResult
    {
        public OtpVerificationStatus Status { get; set; }

        public string Message { get; set; } = string.Empty;

        public bool IsSuccess => Status == OtpVerificationStatus.Success;
    }
}
