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

            // Verify if the user owns or is assigned to this ticket
            var ticket = await _liveSupportService.GetTicketByCodeAsync(ticketId);
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
                // Staff can join if assigned or if they are admin
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
                throw new HubException("Bạn không có quyền truy cập vào phòng chat này.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, ticketId);
            
            // Notify other users in the group that this user has joined/is online
            await Clients.Group(ticketId).SendAsync("UserOnline", ticketId, role);
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
            // Simply broadcast the message data (containing content, files, time) to the room
            await Clients.Group(ticketId).SendAsync("ReceiveMessage", ticketId, messageData);
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
