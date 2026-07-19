using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.ViewModels
{
    public class VerifyOtpViewModel
    {
        [Required(ErrorMessage = "Không tìm thấy địa chỉ Email.")]
        [EmailAddress(ErrorMessage = "Địa chỉ Email không đúng định dạng.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mã OTP.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải có độ dài 6 chữ số.")]
        [RegularExpression(@"^[0-9]+$", ErrorMessage = "Mã OTP chỉ bao gồm các chữ số.")]
        public string OtpCode { get; set; } = null!;
    }
}
