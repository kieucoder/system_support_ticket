using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class DoiMatKhauViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")]
        [DataType(DataType.Password)]
        public string MatKhauHienTai { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [MinLength(8, ErrorMessage = "Mật khẩu mới phải từ 8 ký tự trở lên.")]
        [DataType(DataType.Password)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", 
            ErrorMessage = "Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.")]
        public string MatKhauMoi { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu mới.")]
        [Compare("MatKhauMoi", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        [DataType(DataType.Password)]
        public string XacNhanMatKhau { get; set; } = null!;
    }
}
