using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    public class TrangDanhGiaPageViewModel
    {
        // Form model for submitting a review
        public DanhGiaPhieuViewModel FormModel { get; set; } = new();

        // Details of currently selected ticket for review
        public DanhGiaPhieuViewModel? CurrentTicket { get; set; }

        // List 1: Pending tickets waiting for rating
        public List<DanhGiaPhieuViewModel> PendingTickets { get; set; } = new();

        // List 2: Rating history
        public List<DanhGiaHistoryItemViewModel> RatingHistory { get; set; } = new();
    }

    public class DanhGiaHistoryItemViewModel
    {
        public int IdDanhGia { get; set; }
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string TieuDe { get; set; } = string.Empty;
        public string TenDanhMuc { get; set; } = string.Empty;
        public string TenDichVu { get; set; } = string.Empty;
        public string TenNhanVien { get; set; } = string.Empty;
        public int ChatLuongDichVu { get; set; }
        public int ThaiDoNhanVien { get; set; }
        public int TocDoXuLy { get; set; }
        public double DiemTrungBinh => Math.Round((ChatLuongDichVu + ThaiDoNhanVien + TocDoXuLy) / 3.0, 1);
        public string? NhanXet { get; set; }
        public DateTime NgayDanhGia { get; set; }
    }
}
