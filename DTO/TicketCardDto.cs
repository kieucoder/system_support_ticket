using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.DTO
{
    public class TicketCardDto
    {
        public int IdPhieu { get; set; }
        public string TicketCode { get; set; } = "";
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public string Category { get; set; } = "";
        public string Service { get; set; } = "";
        public string Priority { get; set; } = "";
        public string Status { get; set; } = "";
        public string CreatedDate { get; set; } = "";
        public string UpdatedDate { get; set; } = "";

        public CustomerDto? Customer { get; set; }
        public EmployeeDto? Employee { get; set; }
        public AppointmentDto? Appointment { get; set; }
        public List<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();
        public List<MessageDto> Messages { get; set; } = new List<MessageDto>();
        public RatingDto? Rating { get; set; }
    }

    public class LookupTicketRequest
    {
        public string Message { get; set; } = "";
        public string? TicketCode { get; set; }
        public string? ContextTicketCode { get; set; }
    }

    public class LookupTicketResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public string Intent { get; set; } = "LookupTicket";
        public string? ContextTicketCode { get; set; }
        public TicketCardDto? Ticket { get; set; }
    }
}
