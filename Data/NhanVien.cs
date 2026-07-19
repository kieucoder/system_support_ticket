using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class NhanVien
{
    public int IdNhanVien { get; set; }

    public string HoTen { get; set; } = null!;

    public string SoDienThoai { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? DiaChi { get; set; }

    public string TenDangNhap { get; set; } = null!;

    public string VaiTro { get; set; } = null!;

    public string MatKhau { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public DateOnly? NgayTao { get; set; }

    public string? MaNhanVien { get; set; }

    public string? Avatar { get; set; }



    public virtual ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();

    public virtual ICollection<LichSuHoTro> LichSuHoTros { get; set; } = new List<LichSuHoTro>();

    public virtual ICollection<LienHe> LienHes { get; set; } = new List<LienHe>();

    public virtual ICollection<PhieuHoTro> PhieuHoTros { get; set; } = new List<PhieuHoTro>();
}
