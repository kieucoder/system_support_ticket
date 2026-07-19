using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models
{
    public class QuanLyPhieuHoTroViewModel
    {
        public List<PhieuHoTroRowViewModel> DanhSachPhieu { get; set; } = new();
        
        // Stats for KPI
        public int TotalTickets { get; set; }
        public int WaitingTickets { get; set; }
        public int ProcessingTickets { get; set; }
        public int CompletedTickets { get; set; }
        public int CancelledTickets { get; set; }
        public int UrgentTickets { get; set; }
        public int AppointmentTickets { get; set; }
        
        // Filters
        public string Keyword { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public int? ServiceId { get; set; }
        public int? StaffId { get; set; }
        
        // Pagination
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int StartItem { get; set; }
        public int EndItem { get; set; }
        public string Sort { get; set; } = "newest";
    }

    public class PhieuHoTroRowViewModel
    {
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string TieuDe { get; set; } = string.Empty;
        public string HoTenKhachHang { get; set; } = string.Empty;
        public string SoDienThoai { get; set; } = string.Empty;
        public string TenDanhMuc { get; set; } = string.Empty;
        public string TenDichVu { get; set; } = string.Empty;
        public string NhanVienPhuTrach { get; set; } = string.Empty;
        public string LoaiYeuCau { get; set; } = string.Empty;
        public int MucDoUuTien { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public DateOnly? NgayTao { get; set; }
        public DateOnly? NgayHen { get; set; }
        public string ChatLuongDanhGia { get; set; } = string.Empty;
    }
}
