using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Data;

public partial class DichVu
{
    public int IdDichVu { get; set; }

    public int IdDanhMuc { get; set; }

    public string TenDichVu { get; set; } = null!;

    public string? MoTa { get; set; }

    public string TrangThai { get; set; } = null!;

    public DateOnly? NgayTao { get; set; }

    public virtual DanhMuc IdDanhMucNavigation { get; set; } = null!;

    public virtual ICollection<PhieuHoTro> PhieuHoTros { get; set; } = new List<PhieuHoTro>();
}
