using System;

namespace SupportTicketSysterm.Models
{
    public class NotificationViewModel
    {
        public string Type { get; set; } = string.Empty;       // TicketCreated, TicketAssigned, TicketStatusChanged, AppointmentCreated, AppointmentUpdated, AppointmentCancelled, ChatMessage, RatingRequest, System
        public string Icon { get; set; } = "bi-bell-fill";      // Icon class (bi bi-ticket-perforated, bi-calendar-event...)
        public string Title { get; set; } = string.Empty;      // Tiêu đề ngắn gọn
        public string Content { get; set; } = string.Empty;    // Nội dung chi tiết
        public string Url { get; set; } = string.Empty;        // Đường dẫn điều hướng (/Ticket/ChiTietPhieu/{id}, /LichHen/ChiTiet/{id}...)
        public DateTime CreatedAt { get; set; }                 // Thời gian tạo
        public string BadgeClass { get; set; } = "bg-danger";   // Color badge (bg-danger, bg-warning, bg-info, bg-success...)
        public string Source { get; set; } = "System";          // System, Employee, AI, Customer
        public int? ReferenceId { get; set; }                    // IdPhieu, IdLichHen...
        
        // Friendly time display helper
        public string TimeAgo
        {
            get
            {
                var ts = DateTime.Now - CreatedAt;
                if (ts.TotalMinutes < 1) return "Vừa xong";
                if (ts.TotalMinutes < 60) return $"{(int)ts.TotalMinutes} phút trước";
                if (ts.TotalHours < 24) return $"{(int)ts.TotalHours} giờ trước";
                if (ts.TotalDays < 7) return $"{(int)ts.TotalDays} ngày trước";
                return CreatedAt.ToString("dd/MM/yyyy HH:mm");
            }
        }
    }
}
