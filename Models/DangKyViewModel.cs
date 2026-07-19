using System;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class DangKyViewModel
    {
        [Required(ErrorMessage = "Họ tên không được để trống")]
        public string HoTen { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [RegularExpression(@"^(0[3|5|7|8|9])[0-9]{8}$", ErrorMessage = "Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và đủ 10 số)")]
        public string SoDienThoai { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
        public string Email { get; set; } = null!;

        public string? TenDangNhap { get; set; }

        public string? DiaChi { get; set; }

        public DateTime? NgaySinh { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string MatKhau { get; set; } = null!;

        [Required(ErrorMessage = "Xác nhận mật khẩu không được để trống")]
        [Compare("MatKhau", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string XacNhanMatKhau { get; set; } = null!;

        // OTP
        [Required(ErrorMessage = "Mã OTP không được để trống")]
        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "Mã OTP phải đúng 6 chữ số")]
        public string? OTP { get; set; }

        public bool DaGuiOTP { get; set; }
    }
}
