using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models
{
    public class MessageViewModel
    {
        public int IdTinNhan { get; set; }
        public int IdLienHe { get; set; }
        public string LoaiNguoiGui { get; set; } // "KhachHang" or "NhanVien"
        public string NoiDung { get; set; }
        public DateTime ThoiGian { get; set; }
        public string TrangThai { get; set; } // "Đã gửi", etc.
        public List<FileAttachmentViewModel> Files { get; set; } = new List<FileAttachmentViewModel>();
    }

    public class FileAttachmentViewModel
    {
        public int IdFile { get; set; }
        public string TenFile { get; set; }
        public string DuongDan { get; set; }
        public string LoaiFile { get; set; }
    }
}
