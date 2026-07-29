using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using SupportTicketSysterm.Services;

namespace SupportTicketSysterm.Controllers
{
    public class LiveSupportHub : Hub
    {
        private readonly ILiveSupportService _liveSupportService;

        public LiveSupportHub(ILiveSupportService liveSupportService)
        {
            _liveSupportService = liveSupportService;
        }

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var (userId, _) = GetUserConnectionInfo(httpContext);
            if (userId.HasValue)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId.Value}");
            }
            await base.OnConnectedAsync();
        }

        public async Task JoinUserGroup(string userGroupId)
        {
            if (!string.IsNullOrEmpty(userGroupId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userGroupId);
            }
        }

        public async Task JoinRoom(string ticketId)
        {
            var httpContext = Context.GetHttpContext();
            var (userId, role) = GetUserConnectionInfo(httpContext);

            if (userId == null)
            {
                throw new HubException("Bạn cần đăng nhập để tham gia phòng chat.");
            }

            if (string.IsNullOrWhiteSpace(ticketId))
            {
                throw new HubException("Mã hoặc Id phiếu hỗ trợ không hợp lệ.");
            }

            string cleanId = ticketId.StartsWith("Ticket_", StringComparison.OrdinalIgnoreCase)
                ? ticketId.Substring(7)
                : ticketId;

            Data.PhieuHoTro? ticket = null;
            if (int.TryParse(cleanId, out int idPhieu))
            {
                ticket = await _liveSupportService.GetTicketByIdAsync(idPhieu);
            }

            if (ticket == null)
            {
                ticket = await _liveSupportService.GetTicketByCodeAsync(cleanId);
            }

            if (ticket == null)
            {
                throw new HubException("Phiếu hỗ trợ không tồn tại.");
            }

            bool isAuthorized = false;

            if (role == "Admin")
            {
                isAuthorized = true;
            }
            else if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                if (ticket.IdNhanVien == userId)
                {
                    isAuthorized = true;
                }
            }
            else // KhachHang
            {
                if (ticket.IdKhachHang == userId)
                {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized)
            {
                throw new HubException("403 Forbidden: Bạn không có quyền truy cập vào phiếu hỗ trợ này.");
            }

            string groupName = $"Ticket_{ticket.IdPhieu}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            if (!string.Equals(ticketId, groupName, StringComparison.OrdinalIgnoreCase))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, ticketId);
            }

            await Clients.Group(groupName).SendAsync("UserOnline", ticket.IdPhieu.ToString(), role);
        }

        public async Task LeaveRoom(string ticketId)
        {
            var httpContext = Context.GetHttpContext();
            var (_, role) = GetUserConnectionInfo(httpContext);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ticketId);
            await Clients.Group(ticketId).SendAsync("UserOffline", ticketId, role);
        }

        public async Task SendMessage(string ticketId, object messageData)
        {
            await Clients.Group(ticketId).SendAsync("ReceiveMessage", ticketId, messageData);
        }

        public async Task Typing(string ticketId, string senderRole, bool isTyping)
        {
            await Clients.Group(ticketId).SendAsync("Typing", ticketId, senderRole, isTyping);
        }

        public async Task NotifyTicketUpdate(string ticketCode, string updateType, object data)
        {
            if (!string.IsNullOrEmpty(ticketCode))
            {
                await Clients.Group(ticketCode).SendAsync("TicketUpdated", new
                {
                    ticketCode = ticketCode,
                    updateType = updateType,
                    data = data,
                    timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
        }

        public async Task ReadMessage(string ticketId, string role)
        {
            await _liveSupportService.MarkAsReadAsync(ticketId, role);
            await Clients.Group(ticketId).SendAsync("UpdateSeen", ticketId, role);
        }

        private (int? UserId, string Role) GetUserConnectionInfo(HttpContext? httpContext)
        {
            if (httpContext == null) return (null, "");

            var userId = httpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                var userIdStr = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? httpContext.User.FindFirst("UserId")?.Value;
                if (int.TryParse(userIdStr, out int id))
                {
                    userId = id;
                }
            }

            var role = httpContext.Session.GetString("Role");
            if (string.IsNullOrEmpty(role))
            {
                role = httpContext.User.FindFirst(ClaimTypes.Role)?.Value ?? httpContext.User.FindFirst("VaiTro")?.Value ?? "";
            }

            return (userId, role);
        }
    }
}
