namespace SupportTicketSysterm.ViewModels
{
    public class ChatMessageResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public string Sender { get; set; } = "ai";
        public string? Intent { get; set; }
        public bool RequiresLogin { get; set; } = false;
        public string? ActionUrl { get; set; }
    }
}
