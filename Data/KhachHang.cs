using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace SupportTicketSysterm.Data;

public partial class KhachHang
{
    public int IdKhachHang { get; set; }

    public string? MaKh { get; set; }

    public string? HoTen { get; set; }

    public string? SoDienThoai { get; set; }

    public string? Email { get; set; }

    [NotMapped]
    public string? TenDangNhap { get; set; }

    public string? DiaChi { get; set; }

    public DateOnly? NgaySinh { get; set; }

    public string? MatKhau { get; set; }

    public string? TrangThai { get; set; }

    public DateOnly? NgayTao { get; set; }

    public virtual ICollection<LienHe> LienHes { get; set; } = new List<LienHe>();

    public virtual ICollection<PhieuHoTro> PhieuHoTros { get; set; } = new List<PhieuHoTro>();

    public virtual ICollection<TaiKhoanOtp> TaiKhoanOtps { get; set; } = new List<TaiKhoanOtp>();
}
