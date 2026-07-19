using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class NhapOtpViewModel
    {
        public string HoTen { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string MaskedPhoneNumber =>
            PhoneNumber.Length < 4
                ? PhoneNumber
                : $"{PhoneNumber[..3]}***{PhoneNumber[^3..]}";

        public string MaskedEmail =>
            string.IsNullOrEmpty(Email) || !Email.Contains('@')
                ? Email
                : $"{Email[..3]}***{Email[Email.IndexOf('@')..]}";

        [Required(ErrorMessage = "Vui lòng nhập mã OTP.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã OTP phải gồm đúng 6 chữ số.")]
        public string Otp { get; set; } = string.Empty;

        public int ExpirySeconds { get; set; }

        public int ResendCooldownSeconds { get; set; }
    }
}
