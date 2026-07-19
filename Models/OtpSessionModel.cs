using System;

namespace SupportTicketSysterm.Models
{
    public class OtpSessionModel
    {
        public string OTP { get; set; } = string.Empty;
        public string SoDienThoai { get; set; } = string.Empty;
        public DateTime ThoiGianTao { get; set; }
        public int SoLanNhapSai { get; set; }
    }
}
