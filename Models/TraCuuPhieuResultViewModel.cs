namespace SupportTicketSysterm.Models
{
    public class TraCuuPhieuResultViewModel
    {
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string TieuDe { get; set; } = string.Empty;
        public string TenDichVu { get; set; } = string.Empty;
        public string TenDanhMuc { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public int MucDoUuTien { get; set; }
        public string NgayTao { get; set; } = string.Empty;
        public string TenKhachHang { get; set; } = string.Empty;
        public string SoDienThoai { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TenNhanVien { get; set; } = string.Empty;
        public string SoDienThoaiNV { get; set; } = string.Empty;
        public string EmailNV { get; set; } = string.Empty;
        public string VaiTroNV { get; set; } = string.Empty;
        public string MaNhanVien { get; set; } = string.Empty;
    }
}
