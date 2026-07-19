using System.Collections.Generic;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.ViewModels
{
    public class LiveSupportViewModel
    {
        public PhieuHoTro Ticket { get; set; } = null!;
        public NhanVien? Staff { get; set; }
        public KhachHang? Customer { get; set; }
        public List<MessageViewModel> Messages { get; set; } = new List<MessageViewModel>();
        public string CurrentUserRole { get; set; } = ""; // "Customer" or "Staff"
        public string CurrentUserName { get; set; } = "";
        public bool CanChat { get; set; }
        public bool CanUploadFile { get; set; }
        public bool CanCreateAppointment { get; set; }
        public bool CanRate { get; set; }
    }
}
