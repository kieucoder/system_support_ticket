using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.ViewModels
{
    public class ForgotPasswordViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập địa chỉ Email.")]
        [EmailAddress(ErrorMessage = "Địa chỉ Email không đúng định dạng.")]
        [MaxLength(255, ErrorMessage = "Email không vượt quá 255 ký tự.")]
        public string Email { get; set; } = null!;
    }
}
