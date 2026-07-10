using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class TaiKhoanOtp
{
    public int IdKhachHang { get; set; }

    public int IdOtp { get; set; }

    public string Otp { get; set; } = null!;

    public DateTime HanSuDung { get; set; }

    public virtual KhachHang IdKhachHangNavigation { get; set; } = null!;
}
