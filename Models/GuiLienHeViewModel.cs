using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class GuiLienHeViewModel
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string HoTen { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [RegularExpression(@"^(0[3|5|7|8|9])[0-9]{8}$", ErrorMessage = "Số điện thoại không đúng định dạng Việt Nam")]
        public string SoDienThoai { get; set; } = null!;

        [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng")]
        [StringLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự")]
        public string? Email { get; set; }

        [StringLength(255, ErrorMessage = "Chủ đề không được vượt quá 255 ký tự")]
        public string? ChuDe { get; set; }

        [Required(ErrorMessage = "Nội dung liên hệ là bắt buộc")]
        [MinLength(10, ErrorMessage = "Nội dung liên hệ phải có tối thiểu 10 ký tự")]
        public string NoiDung { get; set; } = null!;
    }
}
