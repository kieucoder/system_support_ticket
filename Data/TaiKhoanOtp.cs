using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class TaiKhoanOtp
{
    public int IdOtp { get; set; }

    public int IdKhachHang { get; set; }

    public string? MaOTPBam { get; set; }

    public DateTime? ThoiGianTao { get; set; }

    public DateTime? HanSuDung { get; set; }

    public bool DaSuDung { get; set; } = false;

    public int SoLanNhapSai { get; set; } = 0;

    public string? LoaiOTP { get; set; }

    public virtual KhachHang IdKhachHangNavigation { get; set; } = null!;
}
