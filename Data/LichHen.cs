using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace SupportTicketSysterm.Data;

public partial class LichHen
{
    // --------------------------------------------------------------------------
    // CÁC CỘT THẬT TRONG CƠ SỞ DỮ LIỆU SQL SERVER
    // --------------------------------------------------------------------------
    public int IdLichHen { get; set; }

    public int? IdPhieu { get; set; }

    public int? IdNhanVien { get; set; }

    public DateOnly? NgayHen { get; set; }

    public TimeOnly? GioBatDau { get; set; }

    public TimeOnly? GioKetThuc { get; set; }

    public string? DiaChiHoTro { get; set; }

    public string? GhiChu { get; set; }

    public string? TrangThai { get; set; }

    // --------------------------------------------------------------------------
    // CÁC THUỘC TÍNH NÂNG CAO HELPDESK ([NotMapped] ĐỂ KHÔNG BỊ LỖI SQL COLUMN NOT FOUND)
    // --------------------------------------------------------------------------

    [NotMapped]
    public int? IdKhachHang
    {
        get => _idKhachHang ?? IdPhieuNavigation?.IdKhachHang;
        set => _idKhachHang = value;
    }
    private int? _idKhachHang;

    [NotMapped]
    public DateTime ThoiGianBatDau
    {
        get
        {
            if (NgayHen.HasValue && GioBatDau.HasValue)
            {
                return NgayHen.Value.ToDateTime(GioBatDau.Value);
            }
            return _thoiGianBatDau;
        }
        set
        {
            _thoiGianBatDau = value;
            NgayHen = DateOnly.FromDateTime(value);
            GioBatDau = TimeOnly.FromDateTime(value);
        }
    }
    private DateTime _thoiGianBatDau = DateTime.Now;

    [NotMapped]
    public DateTime ThoiGianKetThuc
    {
        get
        {
            if (NgayHen.HasValue && GioKetThuc.HasValue)
            {
                return NgayHen.Value.ToDateTime(GioKetThuc.Value);
            }
            return _thoiGianKetThuc;
        }
        set
        {
            _thoiGianKetThuc = value;
            GioKetThuc = TimeOnly.FromDateTime(value);
        }
    }
    private DateTime _thoiGianKetThuc = DateTime.Now.AddHours(1);

    [NotMapped]
    public string HinhThuc
    {
        get => _hinhThuc ?? "TrucTiep";
        set => _hinhThuc = value;
    }
    private string? _hinhThuc;

    [NotMapped]
    public string? DiaDiem
    {
        get => DiaChiHoTro;
        set => DiaChiHoTro = value;
    }

    [NotMapped]
    public string? TrangThaiLich
    {
        get => TrangThai;
        set => TrangThai = value;
    }

    [NotMapped]
    public DateTime? NgayTao { get; set; } = DateTime.Now;

    [NotMapped]
    public DateTime? NgayCapNhat { get; set; }

    [NotMapped]
    public DateTime? NgayXacNhan { get; set; }

    [NotMapped]
    public DateTime? NgayHoanThanh { get; set; }

    [NotMapped]
    public string? LyDoHuy { get; set; }

    [NotMapped]
    public DateTime? NgayHuy { get; set; }

    [NotMapped]
    public string? NguoiHuy { get; set; }

    [NotMapped]
    public string? LyDoDoiLich { get; set; }

    // --------------------------------------------------------------------------
    // NAVIGATIONS
    // --------------------------------------------------------------------------
    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }

    public virtual NhanVien? IdNhanVienNavigation { get; set; }

    [NotMapped]
    public virtual KhachHang? IdKhachHangNavigation
    {
        get => IdPhieuNavigation?.IdKhachHangNavigation;
        set { }
    }
}
