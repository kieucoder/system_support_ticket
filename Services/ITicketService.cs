using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public interface ITicketService
    {
        Task<string> TaoMaPhieuAsync();
        Task<NhanVien?> SelectTechnicianWithLowestTicketsAsync();
        Task<(bool Success, int TicketId, string? ErrorMessage, PhieuHoTro? Phieu)> CreateTicketAsync(PhieuViewModel model, int idKhachHang);
        Task<bool> CanUserAccessTicketAsync(int idPhieu, int userId, string role);
        Task<PhieuHoTro?> GetTicketDetailForUserAsync(int idPhieu, int userId, string role);
        Task<System.Collections.Generic.List<PhieuHoTro>> GetTicketsForUserAsync(int userId, string role);
    }
}
