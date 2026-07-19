using System;

namespace SupportTicketSysterm.ViewModels
{
    public class FileDinhKemViewModel
    {
        public int IdFile { get; set; }
        public string TenFile { get; set; } = null!;
        public string DuongDan { get; set; } = null!;
        public string? LoaiFile { get; set; }
        public string? DungLuong { get; set; }
        public string? NgayUpload { get; set; }
        public string? NguoiTai { get; set; }
    }
}
