using System;

namespace SupportTicketSysterm.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int? IdKhachHang { get; set; }
        public string Message { get; set; }
        public string Role { get; set; } // "user" (KhachHang) or "model" (AI)
        public DateTime CreatedAt { get; set; }
    }
}
