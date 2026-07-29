using System.Threading.Tasks;
using SupportTicketSysterm.DTO;

namespace SupportTicketSysterm.Services.Interfaces
{
    public interface IAIChatService
    {
        Task<LookupTicketResponse> ProcessChatMessageAsync(LookupTicketRequest request, int? idKhachHang);
    }
}
