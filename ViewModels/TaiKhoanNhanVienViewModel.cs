using Microsoft.AspNetCore.Http;
using SupportTicketSysterm.Data;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.ViewModels
{
    public class TaiKhoanNhanVienViewModel
    {
        public int IdNhanVien { get; set; }

        public string? MaNhanVien { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập họ tên.")]
        [StringLength(100, ErrorMessage = "Họ tên không vượt quá 100 ký tự.")]
        public string HoTen { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập Email.")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng.")]
        [StringLength(100, ErrorMessage = "Email không vượt quá 100 ký tự.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
        [Phone(ErrorMessage = "Số điện thoại không đúng định dạng.")]
        [StringLength(15, ErrorMessage = "Số điện thoại không vượt quá 15 ký tự.")]
        public string SoDienThoai { get; set; } = null!;

        public string? Avatar { get; set; }

        public string? VaiTro { get; set; }

        // Change Password fields
        [DataType(DataType.Password)]
        public string? MatKhauCu { get; set; }

        [MinLength(6, ErrorMessage = "Mật khẩu mới phải từ 6 ký tự trở lên.")]
        [DataType(DataType.Password)]
        public string? MatKhauMoi { get; set; }

        [Compare("MatKhauMoi", ErrorMessage = "Mật khẩu nhập lại không khớp với mật khẩu mới.")]
        [DataType(DataType.Password)]
        public string? NhapLaiMatKhau { get; set; }

        // Avatar file upload
        public IFormFile? AvatarFile { get; set; }


    }
}
