using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task<List<PhieuHoTro>> GetTicketsForCustomerAsync(int idKhachHang);
        Task<List<LichHen>> GetAppointmentsForCustomerAsync(int idKhachHang);
        Task<List<TinNhan>> GetStaffMessagesForCustomerAsync(int idKhachHang);
        Task<List<DanhGium>> GetRatingsForCustomerAsync(int idKhachHang);
    }
}
