using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SupportTicketSysterm.Controllers;

namespace SupportTicketSysterm.Services
{
    public interface ISignalRService
    {
        Task SendMessageToRoomAsync(string roomName, string method, object data);
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
            await _hubContext.Clients.Group(roomName).SendAsync(method, roomName, data);
        }
    }
}
