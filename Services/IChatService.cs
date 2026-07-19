using SupportTicketSysterm.Data;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface IChatService
    {
        Task<LienHe> GetOrCreateAiConversationAsync(int? idKhachHang, int? idLienHeFromSession = null);
        Task<List<TinNhan>> GetConversationMessagesAsync(int idLienHe);
        Task<TinNhan> SaveCustomerMessageAsync(int idLienHe, string content);
        Task<TinNhan> SaveAiMessageAsync(int idLienHe, string content);
        Task<string> GetAiResponseAndProcessActionsAsync(int idLienHe, string userMessage, int? idKhachHang);
    }
}
