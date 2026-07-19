using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class PhieuHoTro
{
    public int IdPhieu { get; set; }

    public int? IdKhachHang { get; set; }

    public int? IdNhanVien { get; set; }

    public int? IdDichVu { get; set; }

    public string? MaPhieu { get; set; }

    public string? TieuDe { get; set; }

    public int? MucDoUuTien { get; set; }

    public string? LoaiYeuCau { get; set; }

    public string? NoiDung { get; set; }

    public DateOnly? NgayTao { get; set; }

    public DateOnly? NgayCapNhat { get; set; }

    public string? CanLichHen { get; set; }

    public string? TrangThai { get; set; }

    public virtual DanhGium? DanhGium { get; set; }

    public virtual ICollection<FileDinhKem> FileDinhKems { get; set; } = new List<FileDinhKem>();

    public virtual DichVu? IdDichVuNavigation { get; set; }

    public virtual KhachHang? IdKhachHangNavigation { get; set; }

    public virtual NhanVien? IdNhanVienNavigation { get; set; }

    public virtual ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();

    public virtual ICollection<LichSuHoTro> LichSuHoTros { get; set; } = new List<LichSuHoTro>();
}
