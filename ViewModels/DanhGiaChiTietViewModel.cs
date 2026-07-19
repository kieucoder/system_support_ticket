using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    public class DanhGiaChiTietViewModel
    {
        public int IdDanhGia { get; set; }
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = null!;
        public string TieuDePhieu { get; set; } = null!;
        public string HoTenKhachHang { get; set; } = null!;
        public string HoTenNhanVien { get; set; } = null!;
        public string TenDanhMuc { get; set; } = null!;
        public string TenDichVu { get; set; } = null!;
        public int ChatLuongDichVu { get; set; }
        public int ThaiDoNhanVien { get; set; }
        public int TocDoXuLy { get; set; }
        public double DiemTrungBinh { get; set; }
        public string? NhanXet { get; set; }
        public DateTime NgayDanhGia { get; set; }
        public bool IsResponded { get; set; }
        public string? PhanHoiNhanVien { get; set; }
        public DateTime? NgayPhanHoi { get; set; }
        public string? HoTenNhanVienPhanHoi { get; set; }
        public List<FileDinhKemViewModel> FileDinhKems { get; set; } = new();
    }
}
