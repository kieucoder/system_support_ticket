using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class TinNhan
{
    public int IdTinNhan { get; set; }

    public int? IdLienHe { get; set; }

    public string? LoaiNguoiGui { get; set; }

    public DateTime? ThoiGian { get; set; }

    public string? TinNhan1 { get; set; }

    public string? TrangThai { get; set; }

    public virtual ICollection<FileDinhKem> FileDinhKems { get; set; } = new List<FileDinhKem>();

    public virtual LienHe? IdLienHeNavigation { get; set; }
}
