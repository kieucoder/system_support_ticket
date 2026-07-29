using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Repositories.Interfaces
{
    public interface ITicketRepository
    {
        Task<PhieuHoTro?> GetByTicketCodeAsync(string ticketCode);
        Task<PhieuHoTro?> GetLatestTicketByCustomerAsync(int idKhachHang);
        Task<LichHen?> GetAppointmentByTicketIdAsync(int idPhieu);
        Task<List<FileDinhKem>> GetAttachmentsByTicketIdAsync(int idPhieu);
        Task<List<TinNhan>> GetMessagesByTicketIdAsync(int idPhieu, int limit = 20);
        Task<DanhGium?> GetRatingByTicketIdAsync(int idPhieu);
        Task<List<PhieuHoTro>> GetTicketsByEmployeeAsync(int idNhanVien);
        Task<List<PhieuHoTro>> GetAllTicketsAsync();
        Task<PhieuHoTro?> GetTicketByIdForEmployeeAsync(int idPhieu, int idNhanVien);
        Task<PhieuHoTro?> GetTicketByIdAsync(int idPhieu);
    }
}
