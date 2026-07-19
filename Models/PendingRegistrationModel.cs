namespace SupportTicketSysterm.Models
{
    public class PendingRegistrationModel
    {
        public string HoTen { get; set; } = string.Empty;

        public string SoDienThoai { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string TenDangNhap { get; set; } = string.Empty;

        public string? DiaChi { get; set; }

        public DateTime? NgaySinh { get; set; }

        public string PasswordHash { get; set; } = string.Empty;

        public DateTime OtpSentAtUtc { get; set; }

        public DateTime OtpExpiresAtUtc { get; set; }
    }
}
