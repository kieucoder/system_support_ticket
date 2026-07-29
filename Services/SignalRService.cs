using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SupportTicketSysterm.Controllers;

namespace SupportTicketSysterm.Services
{
    public interface ISignalRService
    {
        Task SendMessageToRoomAsync(string roomName, string method, object data);
        Task SendMessageToUserAsync(int userId, string method, object data);
        Task BroadcastNotificationAsync(string roomName, int? userId, string method, object data);
    }

    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<LiveSupportHub> _hubContext;

        public SignalRService(IHubContext<LiveSupportHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendMessageToRoomAsync(string roomName, string method, object data)
        {
            if (!string.IsNullOrEmpty(roomName))
            {
                await _hubContext.Clients.Group(roomName).SendAsync(method, roomName, data);
            }
        }

        public async Task SendMessageToUserAsync(int userId, string method, object data)
        {
            if (userId > 0)
            {
                await _hubContext.Clients.Group($"User_{userId}").SendAsync(method, $"User_{userId}", data);
            }
        }

        public async Task BroadcastNotificationAsync(string roomName, int? userId, string method, object data)
        {
            if (!string.IsNullOrEmpty(roomName))
            {
                await _hubContext.Clients.Group(roomName).SendAsync(method, roomName, data);
            }
            if (userId.HasValue && userId.Value > 0)
            {
                await _hubContext.Clients.Group($"User_{userId.Value}").SendAsync(method, $"User_{userId.Value}", data);
            }
        }
    }
}
