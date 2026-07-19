using System;

namespace SupportTicketSysterm.Models
{
    public class ConversationViewModel
    {
        public int IdLienHe { get; set; }
        public string TieuDe { get; set; }
        public string TenKhachHang { get; set; }
        public string TenNhanVien { get; set; }
        public int? IdPhieu { get; set; }
        public string MaPhieu { get; set; }
        public string TieuDePhieu { get; set; }
        public string TrangThaiPhieu { get; set; }
        public string DichVuPhieu { get; set; }
        public DateTime? ThoiGianGui { get; set; }
        public string TrangThai { get; set; }
        public int SoTinChuaDoc { get; set; } // Unread for staff
        public int TinChuaDocKhach { get; set; } // Unread for customer
        public string LastMessage { get; set; }
    }
}
