namespace SupportTicketSysterm.Models
{
    public class DanhSachPhieuViewModel
    {
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string TieuDe { get; set; } = string.Empty;
        public string TenKhachHang { get; set; } = string.Empty;
        public string SoDienThoai { get; set; } = string.Empty;
        public string TenDichVu { get; set; } = string.Empty;
        public string TenDanhMuc { get; set; } = string.Empty;
        public string TenNhanVien { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public int MucDoUuTien { get; set; }
        public DateOnly? NgayTao { get; set; }
        public DateOnly? NgayCapNhat { get; set; }
        public bool CanHen { get; set; }
        public string LoaiYeuCau { get; set; } = string.Empty;
        public string MoTa { get; set; } = string.Empty;
    }
}
