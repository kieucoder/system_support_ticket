using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    public class ChatMessageViewModel
    {
        public int IdTinNhan { get; set; }
        public int IdLienHe { get; set; }
        public string LoaiNguoiGui { get; set; } // "KhachHang", "NhanVien", "AI"
        public string NoiDung { get; set; }
        public DateTime ThoiGian { get; set; }
        public string TrangThai { get; set; }
        public List<ChatFileAttachmentViewModel> Files { get; set; } = new List<ChatFileAttachmentViewModel>();
    }

    public class ChatFileAttachmentViewModel
    {
        public int IdFile { get; set; }
        public string TenFile { get; set; }
        public string DuongDan { get; set; }
        public string LoaiFile { get; set; }
    }
}
