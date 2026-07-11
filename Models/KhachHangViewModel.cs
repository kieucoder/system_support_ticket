using System;
using System.ComponentModel.DataAnnotations;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Models
{
    public class KhachHangViewModel
    {
        public int IdKhachHang { get; set; }

        public string? MaKh { get; set; }

        [Required(ErrorMessage = "Họ và tên không được để trống.")]
        [StringLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự.")]
        public string HoTen { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại không được để trống.")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
        [RegularExpression(@"^(0[3|5|7|8|9])+([0-9]{8})$", ErrorMessage = "Số điện thoại phải là định dạng Việt Nam hợp lệ (10 chữ số).")]
        public string SoDienThoai { get; set; } = null!;

        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        [StringLength(150, ErrorMessage = "Email không được vượt quá 150 ký tự.")]
        public string? Email { get; set; }

        [StringLength(255, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự.")]
        public string? DiaChi { get; set; }

        public string? TrangThai { get; set; }

        public string? TenDangNhap { get; set; }

        public DateOnly? NgayTao { get; set; }

        public DateOnly? NgaySinh { get; set; }

        public List<PhieuHoTro>? DanhSachPhieu { get; set; }
        public List<LichHen>? DanhSachLichHen { get; set; }

        // --- Computed helpers (safe null-safe) ---

        /// <summary>Tính chữ viết tắt tên (2 chữ cái cuối). Ví dụ: Nguyễn Văn An => VA</summary>
        public string Initials
        {
            get
            {
                if (string.IsNullOrWhiteSpace(HoTen)) return "KH";
                var parts = HoTen.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    return $"{char.ToUpper(parts[parts.Length - 2][0])}{char.ToUpper(parts[parts.Length - 1][0])}";
                }
                return char.ToUpper(parts[0][0]).ToString();
            }
        }

        public int TongSoPhieu => DanhSachPhieu?.Count ?? 0;
        public int SoPhieuChoTiepNhan => DanhSachPhieu?.Count(x => x.TrangThai == "Chờ tiếp nhận") ?? 0;
        public int SoPhieuDangXuLy => DanhSachPhieu?.Count(x => x.TrangThai == "Đang xử lý") ?? 0;
        public int SoPhieuHoanThanh => DanhSachPhieu?.Count(x => x.TrangThai == "Hoàn thành") ?? 0;
    }
}
