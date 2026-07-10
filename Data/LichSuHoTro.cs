using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class LichSuHoTro
{
    public int IdLichSu { get; set; }

    public int? IdPhieu { get; set; }

    public int? IdNhanVien { get; set; }

    public string? TrangThaiCu { get; set; }

    public string? TrangThaiMoi { get; set; }

    public string? NoiDungCapNhat { get; set; }

    public DateOnly? NgayCapNhat { get; set; }

    public virtual NhanVien? IdNhanVienNavigation { get; set; }

    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }
}
