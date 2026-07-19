using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Repositories
{
    public interface ILiveSupportRepository
    {
        Task<PhieuHoTro?> GetTicketByCodeAsync(string maPhieu);
        Task<LienHe?> GetLienHeByTicketIdAsync(int idPhieu);
        Task<LienHe> CreateLienHeAsync(LienHe lienHe);
        Task<List<TinNhan>> GetMessagesByLienHeIdAsync(int idLienHe);
        Task<TinNhan> SaveMessageAsync(TinNhan message);
        Task SaveFileAttachmentAsync(FileDinhKem file);
        Task MarkAsReadAsync(int idLienHe, string readerRole);
        Task<NhanVien?> GetStaffByIdAsync(int idNhanVien);
        Task<KhachHang?> GetCustomerByIdAsync(int idKhachHang);
    }
}
