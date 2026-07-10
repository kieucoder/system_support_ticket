using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class FileDinhKem
{
    public int IdFile { get; set; }

    public int? IdPhieu { get; set; }

    public int? IdTinNhan { get; set; }

    public int? IdDanhGia { get; set; }

    public string TenFile { get; set; } = null!;

    public string DuongDan { get; set; } = null!;

    public string? LoaiFile { get; set; }

    public DateTime? NgayUpload { get; set; }

    public virtual DanhGium? IdDanhGiaNavigation { get; set; }

    public virtual PhieuHoTro? IdPhieuNavigation { get; set; }

    public virtual TinNhan? IdTinNhanNavigation { get; set; }
}
