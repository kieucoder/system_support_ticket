namespace SupportTicketSysterm.Gemini
{
    public class GeminiIntentResult
    {
        public string Intent { get; set; } = "LookupTicket"; // LookupTicket, LookupLatestTicket, GetAssignedEmployee, GetAppointmentInfo, General
        public string? TicketCode { get; set; }
        public double Confidence { get; set; } = 0.99;
    }
}
