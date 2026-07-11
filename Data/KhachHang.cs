using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class KhachHang
{
    public int IdKhachHang { get; set; }

    public string? MaKh { get; set; }

    public string HoTen { get; set; } = null!;

    public string SoDienThoai { get; set; } = null!;

    public string? Email { get; set; }

    public string? DiaChi { get; set; }

    public DateOnly? NgaySinh { get; set; }

    public string MatKhau { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public DateOnly? NgayTao { get; set; }

    public virtual ICollection<LienHe> LienHes { get; set; } = new List<LienHe>();

    public virtual ICollection<PhieuHoTro> PhieuHoTros { get; set; } = new List<PhieuHoTro>();

    public virtual ICollection<TaiKhoanOtp> TaiKhoanOtps { get; set; } = new List<TaiKhoanOtp>();
}
