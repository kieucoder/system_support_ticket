using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using SupportTicketSysterm.Services;

namespace SupportTicketSysterm.Controllers
{
    public class ChatHub : Hub
    {
        private readonly ILiveSupportService _liveSupportService;

        public ChatHub(ILiveSupportService liveSupportService)
        {
            _liveSupportService = liveSupportService;
        }

        // ==========================================
        // 1. JOIN ROOM & PERMISSION VALIDATION
        // ==========================================
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

            // Clean ticketId format if passed like Ticket_15 or Ticket_PH000125
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

            // Join both specific Ticket_{IdPhieu} and raw ticketId string for compatibility
            string groupName = $"Ticket_{ticket.IdPhieu}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            if (!string.Equals(ticketId, groupName, StringComparison.OrdinalIgnoreCase))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, ticketId);
            }
            if (!string.IsNullOrEmpty(ticket.MaPhieu) && !string.Equals(ticketId, ticket.MaPhieu, StringComparison.OrdinalIgnoreCase))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, ticket.MaPhieu);
            }
            
            // Notify other users in the group that this user has joined/is online
            await Clients.Group(groupName).SendAsync("UserOnline", ticket.IdPhieu.ToString(), role);
        }

        // ==========================================
        // 2. LEAVE ROOM
        // ==========================================
        public async Task LeaveRoom(string ticketId)
        {
            var httpContext = Context.GetHttpContext();
            var (_, role) = GetUserConnectionInfo(httpContext);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ticketId);
            await Clients.Group(ticketId).SendAsync("UserOffline", ticketId, role);
        }

        // ==========================================
        // 3. BROADCAST SEND MESSAGE REALTIME
        // ==========================================
        public async Task SendMessage(string ticketId, object messageData)
        {
            if (string.IsNullOrEmpty(ticketId)) return;
            string ticketGroup = ticketId.StartsWith("Ticket_", StringComparison.OrdinalIgnoreCase) ? ticketId : $"Ticket_{ticketId}";
            await Clients.Group(ticketGroup).SendAsync("ReceiveMessage", ticketId, messageData);
            if (!string.Equals(ticketGroup, ticketId, StringComparison.OrdinalIgnoreCase))
            {
                await Clients.Group(ticketId).SendAsync("ReceiveMessage", ticketId, messageData);
            }
        }

        // ==========================================
        // 4. TYPING SIGNAL
        // ==========================================
        public async Task Typing(string ticketId, string senderRole, bool isTyping)
        {
            await Clients.Group(ticketId).SendAsync("Typing", ticketId, senderRole, isTyping);
        }

        // ==========================================
        // 5. UPDATE SEEN / READ MESSAGE STATUS
        // ==========================================
        public async Task ReadMessage(string ticketId, string role)
        {
            // Trigger DB update
            await _liveSupportService.MarkAsReadAsync(ticketId, role);
            // Notify other users to update seen indicator
            await Clients.Group(ticketId).SendAsync("UpdateSeen", ticketId, role);
        }

        // ==========================================
        // PRIVATE HELPERS
        // ==========================================
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
