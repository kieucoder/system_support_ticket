using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models
{
    public class AiIntentResult
    {
        public string Intent { get; set; } = "General"; // CreateTicket, Support, UpgradeService, BookingAppointment, General
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = "";
        public int? ServiceId { get; set; }
        public string ServiceName { get; set; } = "";
        public int? Priority { get; set; } = 2; // 1: Low, 2: Medium, 3: High, 4: Urgent
        public double Confidence { get; set; } = 0.9;
        
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        
        public string CustomerName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Address { get; set; } = "";

        public string RequestedDate { get; set; } = ""; // yyyy-MM-dd
        public string RequestedTime { get; set; } = ""; // HH:mm
        public List<string> SuggestedSlots { get; set; } = new List<string>();
    }

    public class AiMessageRequestDto
    {
        public int IdLienHe { get; set; }
        public string Message { get; set; } = "";
        public string? Base64File { get; set; }
        public string? FileName { get; set; }
        public string? MimeType { get; set; }
    }

    public class CreateTicketAiDto
    {
        public int? ServiceId { get; set; }
        public int? CategoryId { get; set; }
        public string TieuDe { get; set; } = "";
        public string NoiDung { get; set; } = "";
        public int Priority { get; set; } = 2;
        public string? HoTen { get; set; }
        public string? SoDienThoai { get; set; }
        public string? DiaChi { get; set; }
    }

    public class CreateAppointmentAiDto
    {
        public int? ServiceId { get; set; }
        public int? TicketId { get; set; }
        public string NgayHen { get; set; } = ""; // yyyy-MM-dd
        public string GioHen { get; set; } = ""; // HH:mm
        public string? DiaChi { get; set; }
        public string? GhiChu { get; set; }
    }
}
