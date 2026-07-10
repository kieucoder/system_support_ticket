using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class LichHen
{
    public int IdLichHen { get; set; }

    public int? IdNhanVien { get; set; }

    public int? IdPhieu { get; set; }

    public DateOnly? NgayHen { get; set; }

    public TimeOnly? GioBatDau { get; set; }

    public TimeOnly? GioKetThuc { get; set; }

    public string? DiaChiHoTro { get; set; }

    public string? GhiChu { get; set; }

    public string? TrangThai { get; set; }

    public virtual NhanVien? IdNhanVienNavigation { get; set; }

    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }
}
