using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class TaiKhoanOtp
{
    public int IdOtp { get; set; }

    public int IdKhachHang { get; set; }

    public string Otp { get; set; } = null!;

    public DateTime ThoiGianTao { get; set; }

    public DateTime HanSuDung { get; set; }

    public virtual KhachHang IdKhachHangNavigation { get; set; } = null!;
}
