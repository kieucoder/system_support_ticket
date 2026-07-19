using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class LienHe
{
    public int IdLienHe { get; set; }

    public int? IdKhachHang { get; set; }

    public int? IdNhanVien { get; set; }

    public int? IdPhieu { get; set; }

    public DateTime? ThoiGianGui { get; set; }

    public int? SoTinChuaDoc { get; set; }

    public int? TinChuaDocKhach { get; set; }

    public string? TieuDe { get; set; }

    public string? NoiDung { get; set; }

    public string? TrangThai { get; set; }

    public DateOnly? NgayTao { get; set; }

    public virtual KhachHang? IdKhachHangNavigation { get; set; }

    public virtual NhanVien? IdNhanVienNavigation { get; set; }

    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }

    public virtual ICollection<TinNhan> TinNhans { get; set; } = new List<TinNhan>();
}
