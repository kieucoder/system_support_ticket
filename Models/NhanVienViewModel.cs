using SupportTicketSysterm.Data;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class NhanVienViewModel
    {
        public int IdNhanVien { get; set; }

        [Required]
        public string HoTen { get; set; } = null!;

        [Required]
        public string SoDienThoai { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        public string? DiaChi { get; set; }

        [Required]
        public string TenDangNhap { get; set; } = null!;

        [Required]
        public string VaiTro { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string MatKhau { get; set; } = null!;

        [Required]
        public string TrangThai { get; set; } = null!;

        public DateOnly? NgayTao { get; set; }

        public virtual ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();

        public virtual ICollection<LichSuHoTro> LichSuHoTros { get; set; } = new List<LichSuHoTro>();

        public virtual ICollection<LienHe> LienHes { get; set; } = new List<LienHe>();

        public virtual ICollection<PhieuHoTro> PhieuHoTros { get; set; } = new List<PhieuHoTro>();
    }
}
