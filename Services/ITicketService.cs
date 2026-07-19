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
    }
}
