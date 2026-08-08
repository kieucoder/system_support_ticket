namespace SupportTicketSysterm.ViewModels
{
    public class ChatMessageRequest
    {
        public string Message { get; set; } = string.Empty;
        public string? ContextTicketCode { get; set; }
    }
}
