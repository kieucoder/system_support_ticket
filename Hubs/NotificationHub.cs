using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;

namespace SupportTicketSysterm.Hubs
{
    public class NotificationHub : Hub
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NotificationHub(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public override async Task OnConnectedAsync()
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            var idKhachHang = session?.GetInt32("IdKhachHang");

            if (idKhachHang.HasValue && idKhachHang.Value > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{idKhachHang.Value}");
            }

            await base.OnConnectedAsync();
        }

        public async Task JoinCustomerGroup(int idKhachHang)
        {
            if (idKhachHang > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{idKhachHang}");
            }
        }
    }
}
