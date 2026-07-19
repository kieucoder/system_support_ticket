using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.ViewModels
{
    public class ResetPasswordViewModel
    {
        [Required(ErrorMessage = "Không tìm thấy địa chỉ Email.")]
        [EmailAddress(ErrorMessage = "Địa chỉ Email không đúng định dạng.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Không tìm thấy mã OTP.")]
        public string OtpCode { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [MinLength(6, ErrorMessage = "Mật khẩu mới phải từ 6 ký tự trở lên.")]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu mới.")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu nhập lại không khớp với mật khẩu mới.")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = null!;
    }
}
