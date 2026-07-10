using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class DanhMuc
{
    public int IdDanhMuc { get; set; }

    public string TenDanhMuc { get; set; } = null!;

    public string? MoTa { get; set; }

    public string TrangThai { get; set; } = null!;

    public DateOnly? NgayTao { get; set; }

    public virtual ICollection<DichVu> DichVus { get; set; } = new List<DichVu>();
}
