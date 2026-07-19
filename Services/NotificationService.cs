using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Services
{
    public interface INotificationService
    {
        Task NotifyNewMessageAsync(string maPhieu, string senderRole, string content);
    }

    public class NotificationService : INotificationService
    {
        private readonly TechSupportContext _context;
        private readonly ISignalRService _signalRService;

        public NotificationService(TechSupportContext context, ISignalRService signalRService)
        {
            _context = context;
            _signalRService = signalRService;
        }

        public async Task NotifyNewMessageAsync(string maPhieu, string senderRole, string content)
        {
            var ticket = await _context.PhieuHoTros
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieu == maPhieu);

            if (ticket == null) return;

            var lienHe = await _context.LienHes.FirstOrDefaultAsync(lh => lh.IdPhieu == ticket.IdPhieu);
            if (lienHe == null) return;

            if (senderRole == "Customer")
            {
                lienHe.SoTinChuaDoc = (lienHe.SoTinChuaDoc ?? 0) + 1;
                await _context.SaveChangesAsync();

                await _signalRService.SendMessageToRoomAsync(maPhieu, "Notification", new
                {
                    message = $"Khách hàng gửi tin nhắn mới cho phiếu {maPhieu}",
                    unreadCount = lienHe.SoTinChuaDoc,
                    role = "Staff"
                });
            }
            else if (senderRole == "Staff")
            {
                lienHe.TinChuaDocKhach = (lienHe.TinChuaDocKhach ?? 0) + 1;
                await _context.SaveChangesAsync();

                await _signalRService.SendMessageToRoomAsync(maPhieu, "Notification", new
                {
                    message = $"Kỹ thuật viên phản hồi phiếu {maPhieu}",
                    unreadCount = lienHe.TinChuaDocKhach,
                    role = "Customer"
                });
            }
        }
    }
}
