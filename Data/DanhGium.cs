using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace SupportTicketSysterm.Data;

public partial class DanhGium
{
    public int IdDanhGia { get; set; }

    public int? IdPhieu { get; set; }

    public int? ChatLuongDichVu { get; set; }

    public int? ThaiDoNhanVien { get; set; }

    public int? TocDoXuLy { get; set; }

    [NotMapped]
    public int? KhaNangGiaiQuyet { get; set; } = 5;

    [NotMapped]
    public int? MucDoHaiLong { get; set; } = 5;

    [NotMapped]
    public double DiemTrungBinh
    {
        get
        {
            double q = ChatLuongDichVu ?? 5;
            double a = ThaiDoNhanVien ?? 5;
            double s = TocDoXuLy ?? 5;
            double sol = KhaNangGiaiQuyet ?? 5;
            double sat = MucDoHaiLong ?? 5;
            return Math.Round((q + a + s + sol + sat) / 5.0, 1);
        }
    }

    public string? NhanXet { get; set; }

    public DateTime? NgayDanhGia { get; set; }

    public string? PhanHoiNhanVien { get; set; }

    public DateTime? NgayPhanHoi { get; set; }

    public int? IdNhanVienPhanHoi { get; set; }

    public virtual ICollection<FileDinhKem> FileDinhKems { get; set; } = new List<FileDinhKem>();

    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }

    public virtual NhanVien? IdNhanVienPhanHoiNavigation { get; set; }
}
