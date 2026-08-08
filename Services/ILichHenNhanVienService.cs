using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services;

/// <summary>
/// Service dành riêng cho Nhân viên Kỹ thuật quản lý lịch hẹn cá nhân
/// </summary>
public interface ILichHenNhanVienService
{
    Task<PagedResult<LichHenNhanVienDto>> GetListAsync(int nhanVienId, NhanVienLichHenFilterInput filter, int page, int pageSize);
    Task<NhanVienLichHenListViewModel> GetListViewModelAsync(int nhanVienId, NhanVienLichHenFilterInput filter);
    Task<LichHenNhanVienDetailDto> GetDetailAsync(int id, int nhanVienId);
    Task<ServiceResult> YeuCauDoiLichAsync(YeuCauDoiLichInputDto dto, int nhanVienId);
    Task<ServiceResult> HuyLichAsync(int id, int nhanVienId, string lyDo);
    Task<List<LichSuLichHenDto>> GetLichSuAsync(int lichHenId, int nhanVienId);
}
