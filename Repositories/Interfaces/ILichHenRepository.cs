using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Repositories.Interfaces;

/// <summary>
/// Repository truy vấn dữ liệu Lịch hẹn theo chuẩn Repository Pattern
/// </summary>
public interface ILichHenRepository
{
    Task<LichHen?> GetByIdAsync(int idLichHen);
    Task<List<LichHen>> GetAllAppointmentsAsync(LichHenFilterDto? filter = null);
    Task<List<LichHen>> GetAppointmentsByEmployeeAsync(int idNhanVien, LichHenFilterDto? filter = null);
    Task<List<LichHen>> GetCustomerAppointmentsAsync(int idKhachHang);
    Task<List<PhieuHoTro>> GetEligibleTicketsForCustomerAsync(int idKhachHang);
    Task AddAsync(LichHen entity);
    void Update(LichHen entity);
    Task SaveChangesAsync();
}
