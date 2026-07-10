using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class DanhGium
{
    public int IdDanhGia { get; set; }

    public int? IdPhieu { get; set; }

    public int? ChatLuongDichVu { get; set; }

    public int? ThaiDoNhanVien { get; set; }

    public int? TocDoXuLy { get; set; }

    public string? NhanXet { get; set; }

    public DateTime? NgayDanhGia { get; set; }

    public virtual ICollection<FileDinhKem> FileDinhKems { get; set; } = new List<FileDinhKem>();

    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }
}
