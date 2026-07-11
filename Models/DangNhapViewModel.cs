using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class DangNhapViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập email hoặc số điện thoại")]
        [StringLength(100, ErrorMessage = "Email hoặc số điện thoại không được vượt quá 100 ký tự")]
        [Display(Name = "Email hoặc Số điện thoại")]
        public string TenDangNhap { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu")]
        [StringLength(100, ErrorMessage = "Mật khẩu không được vượt quá 100 ký tự")]
        [DataType(DataType.Password)]
        [Display(Name = "Mật khẩu")]
        public string MatKhau { get; set; } = null!;

        [Display(Name = "Ghi nhớ đăng nhập")]
        public bool RememberMe { get; set; }
    }
}
