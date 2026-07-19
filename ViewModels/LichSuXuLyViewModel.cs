using System;

namespace SupportTicketSysterm.ViewModels
{
    public class LichSuXuLyViewModel
    {
        public int IdLichSu { get; set; }
        public string? ThoiGian { get; set; }
        public string? TenNhanVien { get; set; }
        public string? NoiDung { get; set; }
        public string? TrangThaiCu { get; set; }
        public string? TrangThaiMoi { get; set; }
        public string? Icon { get; set; }

        // Backward compatibility properties for views
        public DateOnly? NgayCapNhat { get; set; }
        public string? NoiDungCapNhat { get; set; }
        public NhanVienCompat? IdNhanVienNavigation { get; set; }
    }

    public class NhanVienCompat
    {
        public string? HoTen { get; set; }
    }
}
