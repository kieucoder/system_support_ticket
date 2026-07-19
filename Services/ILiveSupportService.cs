using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services
{
    public interface ILiveSupportService
    {
        Task<PhieuHoTro?> GetTicketByCodeAsync(string maPhieu);
        Task<LienHe?> GetOrCreateLienHeAsync(string maPhieu);
        Task<List<MessageViewModel>> GetMessagesAsync(string maPhieu);
        Task<MessageViewModel> SaveMessageAsync(string maPhieu, string content, string senderRole);
        Task<MessageViewModel> UploadAsync(string maPhieu, string fileName, string filePath, string fileType, string senderRole);
        Task MarkAsReadAsync(string maPhieu, string readerRole);
        Task<NhanVien?> GetAssignedStaffAsync(string maPhieu);
    }
}
