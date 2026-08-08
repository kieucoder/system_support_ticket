using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.ViewModels
{
    public class DoiMatKhauViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")]
        [DataType(DataType.Password)]
        public string MatKhauHienTai { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [DataType(DataType.Password)]
        [MinLength(8, ErrorMessage = "Mật khẩu mới phải có ít nhất 8 ký tự.")]
        public string MatKhauMoi { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu mới.")]
        [DataType(DataType.Password)]
        [Compare("MatKhauMoi", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        public string XacNhanMatKhau { get; set; } = null!;
    }
}
