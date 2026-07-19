using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class PhanCongNhanVienViewModel
    {
        [Required]
        public int IdPhieu { get; set; }

        public string MaPhieu { get; set; } = string.Empty;

        public string TieuDe { get; set; } = string.Empty;

        public string KhachHang { get; set; } = string.Empty;

        public string DichVu { get; set; } = string.Empty;

        public string TrangThaiHienTai { get; set; } = string.Empty;

        public string NhanVienHienTai { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn nhân viên phụ trách")]
        public int IdNhanVien { get; set; }
    }
}
