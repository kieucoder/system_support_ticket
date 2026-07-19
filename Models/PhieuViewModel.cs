using SupportTicketSysterm.Data;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SupportTicketSysterm.Models
{
    public class PhieuViewModel
    {
        public int IdPhieu { get; set; }

        public int? IdKhachHang { get; set; }

        public int? IdNhanVien { get; set; }

        public int? IdDichVu { get; set; }
        public int? IdDanhMuc { get; set; }

        public string HoTen { get; set; } = string.Empty;
        public string? SoDienThoai { get; set; }

        public string? Email { get; set; }

        public string MaPhieu { get; set; } = null!;

        public string? TieuDe { get; set; }

        public int? MucDoUuTien { get; set; }

        public string LoaiYeuCau { get; set; } = null!;

        public string? NoiDung { get; set; }

        public DateOnly? NgayTao { get; set; }

        public DateOnly? NgayCapNhat { get; set; }

        public string CanLichHen { get; set; } = null!;

        public string? TrangThai { get; set; }

        public DateOnly? NgayHen { get; set; }

        public TimeOnly? GioBatDau { get; set; }

        public TimeOnly? GioKetThuc { get; set; }

        public string? DiaChiHen { get; set; }

        public string? GhiChuHen { get; set; }

        public List<IFormFile>? Files { get; set; }

        public virtual DanhGium? DanhGium { get; set; }

        public virtual ICollection<FileDinhKem> FileDinhKems { get; set; } = new List<FileDinhKem>();

        public virtual DichVu? IdDichVuNavigation { get; set; }

        public virtual KhachHang? IdKhachHangNavigation { get; set; }

        public virtual NhanVien? IdNhanVienNavigation { get; set; }

        public virtual ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();

        public virtual ICollection<LichSuHoTro> LichSuHoTros { get; set; } = new List<LichSuHoTro>();
    }




    public class TraCuuPhieuViewModel
    {
        // ==========================
        // Điều kiện tìm kiếm
        // ==========================

        [Display(Name = "Mã phiếu")]
        [Required(ErrorMessage = "Vui lòng nhập mã phiếu.")]
        public string? MaPhieu { get; set; }

        [Display(Name = "Số điện thoại")]
        [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
        public string? SoDienThoai { get; set; }

        [Display(Name = "Email")]
        public string? Email { get; set; }

        [Display(Name = "Từ ngày")]
        public DateOnly? TuNgay { get; set; }

        [Display(Name = "Đến ngày")]
        public DateOnly? DenNgay { get; set; }

        [Display(Name = "Trạng thái")]
        public string? TrangThai { get; set; }

        [Display(Name = "Danh mục")]
        public int? IdDanhMuc { get; set; }

        [Display(Name = "Dịch vụ")]
        public int? IdDichVu { get; set; }

        // ==========================
        // Kết quả tìm kiếm
        // ==========================

        public List<TraCuuPhieuResultViewModel> DanhSachPhieu { get; set; }
            = new List<TraCuuPhieuResultViewModel>();
    }

}
