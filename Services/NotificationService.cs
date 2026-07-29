using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Hubs;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Repositories.Interfaces;

namespace SupportTicketSysterm.Services
{
    public interface INotificationService
    {
        Task<List<NotificationViewModel>> GetNotificationsAsync(int idKhachHang, string? search = null, string? type = null);
        Task<List<NotificationViewModel>> GetTopNotificationsAsync(int idKhachHang, int limit = 10);
        Task<int> GetNotificationCountAsync(int idKhachHang);
        Task PushRealtimeNotificationAsync(int idKhachHang, NotificationViewModel notification);
        Task NotifyNewMessageAsync(string maPhieu, string senderRole, string content);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repository;
        private readonly TechSupportContext _context;
        private readonly ISignalRService _signalRService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            INotificationRepository repository,
            TechSupportContext context,
            ISignalRService signalRService,
            IHubContext<NotificationHub> hubContext)
        {
            _repository = repository;
            _context = context;
            _signalRService = signalRService;
            _hubContext = hubContext;
        }

        public async Task<List<NotificationViewModel>> GetNotificationsAsync(int idKhachHang, string? search = null, string? type = null)
        {
            var list = new List<NotificationViewModel>();

            if (idKhachHang <= 0) return list;

            // 1. PhieuHoTro Notifications
            var tickets = await _repository.GetTicketsForCustomerAsync(idKhachHang);
            foreach (var t in tickets)
            {
                string maPhieuDisplay = !string.IsNullOrEmpty(t.MaPhieu) ? t.MaPhieu : $"PH{t.IdPhieu:D6}";
                string detailUrl = $"/Ticket/ChiTietPhieu/{t.IdPhieu}";
                DateTime createdTime = t.NgayTao.HasValue ? t.NgayTao.Value.ToDateTime(TimeOnly.MinValue) : DateTime.Now;

                // Ticket Created
                list.Add(new NotificationViewModel
                {
                    Type = "TicketCreated",
                    Icon = "bi-file-earmark-plus-fill",
                    Title = $"📄 Phiếu {maPhieuDisplay} đã được tạo.",
                    Content = $"Tiêu đề: {t.TieuDe}. Trạng thái: {t.TrangThai ?? "Chờ tiếp nhận"}.",
                    Url = detailUrl,
                    CreatedAt = createdTime,
                    BadgeClass = "bg-danger",
                    Source = "Customer",
                    ReferenceId = t.IdPhieu
                });

                // Ticket Assigned
                if (t.IdNhanVien.HasValue && t.IdNhanVienNavigation != null)
                {
                    list.Add(new NotificationViewModel
                    {
                        Type = "TicketAssigned",
                        Icon = "bi-person-check-fill",
                        Title = $"👨‍🔧 Nhân viên đã tiếp nhận phiếu {maPhieuDisplay}.",
                        Content = $"Kỹ thuật viên {t.IdNhanVienNavigation.HoTen} đã được phân công xử lý.",
                        Url = detailUrl,
                        CreatedAt = createdTime.AddMinutes(5),
                        BadgeClass = "bg-primary",
                        Source = "Employee",
                        ReferenceId = t.IdPhieu
                    });
                }

                // Ticket Status Changed
                string statusText = (t.TrangThai ?? "").Trim();
                if (statusText.Equals("Đang xử lý", StringComparison.OrdinalIgnoreCase) || statusText == "1")
                {
                    list.Add(new NotificationViewModel
                    {
                        Type = "TicketStatusChanged",
                        Icon = "bi-gear-wide-connected",
                        Title = $"⚙️ Phiếu {maPhieuDisplay} đang được xử lý.",
                        Content = "Kỹ thuật viên đang tiến hành kiểm tra & khắc phục sự cố.",
                        Url = detailUrl,
                        CreatedAt = createdTime.AddMinutes(10),
                        BadgeClass = "bg-warning",
                        Source = "System",
                        ReferenceId = t.IdPhieu
                    });
                }
                else if (statusText.Equals("Hoàn thành", StringComparison.OrdinalIgnoreCase) || statusText == "3")
                {
                    DateTime completedTime = t.NgayCapNhat.HasValue ? t.NgayCapNhat.Value.ToDateTime(TimeOnly.MinValue) : createdTime.AddHours(2);
                    list.Add(new NotificationViewModel
                    {
                        Type = "TicketStatusChanged",
                        Icon = "bi-patch-check-fill",
                        Title = $"🎉 Phiếu {maPhieuDisplay} đã hoàn thành.",
                        Content = "Sự cố kỹ thuật đã được xử lý xong. Cảm ơn bạn đã sử dụng dịch vụ Viettel!",
                        Url = detailUrl,
                        CreatedAt = completedTime,
                        BadgeClass = "bg-success",
                        Source = "Employee",
                        ReferenceId = t.IdPhieu
                    });

                    // Rating Request
                    list.Add(new NotificationViewModel
                    {
                        Type = "RatingRequest",
                        Icon = "bi-star-fill",
                        Title = $"⭐ Hãy đánh giá chất lượng dịch vụ.",
                        Content = $"Phiếu {maPhieuDisplay} đã hoàn thành. Vui lòng dành 1 phút để đánh giá KTV hỗ trợ!",
                        Url = detailUrl,
                        CreatedAt = completedTime.AddMinutes(2),
                        BadgeClass = "bg-warning text-dark",
                        Source = "System",
                        ReferenceId = t.IdPhieu
                    });
                }
            }

            // 2. LichHen Notifications
            var appointments = await _repository.GetAppointmentsForCustomerAsync(idKhachHang);
            foreach (var a in appointments)
            {
                DateTime apptTime = a.ThoiGianBatDau;
                string apptUrl = a.IdPhieu.HasValue ? $"/Ticket/ChiTietPhieu/{a.IdPhieu}" : "/Ticket/TraCuuPhieu";

                string apptStatus = (a.TrangThai ?? "").Trim();
                bool isCancelled = apptStatus.Equals("Đã hủy", StringComparison.OrdinalIgnoreCase) || apptStatus == "2";
                
                string apptTitle = isCancelled ? "❌ Lịch hẹn đã bị hủy." : "📅 Bạn có lịch hẹn mới.";

                list.Add(new NotificationViewModel
                {
                    Type = isCancelled ? "AppointmentCancelled" : "AppointmentCreated",
                    Icon = isCancelled ? "bi-calendar-x-fill" : "bi-calendar-check-fill",
                    Title = apptTitle,
                    Content = $"Thời gian: {apptTime:HH:mm dd/MM/yyyy}. Địa điểm: {a.DiaChiHoTro ?? "Tại nhà"}.",
                    Url = apptUrl,
                    CreatedAt = a.NgayTao ?? apptTime,
                    BadgeClass = isCancelled ? "bg-secondary" : "bg-info text-dark",
                    Source = "Employee",
                    ReferenceId = a.IdLichHen
                });
            }

            // 3. TinNhan Notifications (Messages from Staff)
            var messages = await _repository.GetStaffMessagesForCustomerAsync(idKhachHang);
            foreach (var m in messages)
            {
                string msgShort = string.IsNullOrEmpty(m.TinNhan1) ? "[Tệp đính kèm]" : 
                    (m.TinNhan1.Length > 60 ? m.TinNhan1.Substring(0, 60) + "..." : m.TinNhan1);

                list.Add(new NotificationViewModel
                {
                    Type = "ChatMessage",
                    Icon = "bi-chat-dots-fill",
                    Title = "💬 Bạn có tin nhắn mới từ kỹ thuật viên.",
                    Content = msgShort,
                    Url = "#openChat",
                    CreatedAt = m.ThoiGian ?? DateTime.Now,
                    BadgeClass = "bg-danger",
                    Source = m.LoaiNguoiGui == "AI" ? "AI" : "Employee",
                    ReferenceId = m.IdTinNhan
                });
            }

            // Apply Search filter if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim().ToLower();
                list = list.Where(n => (n.Title != null && n.Title.ToLower().Contains(keyword)) || 
                                       (n.Content != null && n.Content.ToLower().Contains(keyword)))
                           .ToList();
            }

            // Apply Type filter if provided
            if (!string.IsNullOrWhiteSpace(type) && type != "All" && type != "Tất cả")
            {
                list = list.Where(n => string.Equals(n.Type, type, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            // Order descending by CreatedAt
            return list.OrderByDescending(n => n.CreatedAt).ToList();
        }

        public async Task<List<NotificationViewModel>> GetTopNotificationsAsync(int idKhachHang, int limit = 10)
        {
            var all = await GetNotificationsAsync(idKhachHang);
            return all.Take(limit).ToList();
        }

        public async Task<int> GetNotificationCountAsync(int idKhachHang)
        {
            var all = await GetNotificationsAsync(idKhachHang);
            return all.Count;
        }

        public async Task PushRealtimeNotificationAsync(int idKhachHang, NotificationViewModel notification)
        {
            if (idKhachHang <= 0 || notification == null) return;

            try
            {
                await _hubContext.Clients.Group($"Customer_{idKhachHang}")
                    .SendAsync("ReceiveNotification", notification);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error pushing SignalR notification: {ex.Message}");
            }
        }

        public async Task NotifyNewMessageAsync(string maPhieu, string senderRole, string content)
        {
            // Retain legacy method for backward compatibility
            await Task.CompletedTask;
        }
    }
}
