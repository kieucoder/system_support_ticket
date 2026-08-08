using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services;

/// <summary>
/// Triển khai Service quản lý lịch hẹn cá nhân của Nhân viên kỹ thuật
/// </summary>
public class LichHenNhanVienService : ILichHenNhanVienService
{
    private readonly TechSupportContext _context;
    private readonly ISignalRService _signalRService;
    private readonly IAvailabilityService _availabilityService;

    public LichHenNhanVienService(
        TechSupportContext context,
        ISignalRService signalRService,
        IAvailabilityService availabilityService)
    {
        _context = context;
        _signalRService = signalRService;
        _availabilityService = availabilityService;
    }

    public async Task<NhanVienLichHenListViewModel> GetListViewModelAsync(int nhanVienId, NhanVienLichHenFilterInput filter)
    {
        filter ??= new NhanVienLichHenFilterInput();
        if (filter.Page < 1) filter.Page = 1;
        if (filter.PageSize < 1) filter.PageSize = 10;

        // BẮT BUỘC chỉ truy vấn lịch hẹn của Nhân viên hiện tại (IdNhanVien = nhanVienId)
        var query = _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Where(l => l.IdNhanVien == nhanVienId)
            .AsQueryable();

        // 1. Thống kê KPI cá nhân
        var myAppts = await query.Select(l => new { l.IdLichHen, l.TrangThai }).ToListAsync();
        int totalMyAppts = myAppts.Count;
        int pendingCount = myAppts.Count(l => MatchStatus(l.TrangThai, "ChoXacNhan") || MatchStatus(l.TrangThai, "ChoDuyet"));
        int confirmedCount = myAppts.Count(l => MatchStatus(l.TrangThai, "DaXacNhan") || MatchStatus(l.TrangThai, "DangThucHien"));
        int cancelledCount = myAppts.Count(l => MatchStatus(l.TrangThai, "DaHuy") || MatchStatus(l.TrangThai, "DaTuChoi"));
        int reschedulePendingCount = myAppts.Count(l => MatchStatus(l.TrangThai, "ChoXacNhanDoi"));

        // 2. Lọc theo Từ khóa
        if (!string.IsNullOrWhiteSpace(filter.TuKhoa))
        {
            string keyword = filter.TuKhoa.Trim().ToLower();
            query = query.Where(l =>
                (l.IdPhieuNavigation != null && (
                    l.IdPhieuNavigation.MaPhieu.ToLower().Contains(keyword) ||
                    l.IdPhieuNavigation.TieuDe.ToLower().Contains(keyword) ||
                    (l.IdPhieuNavigation.IdKhachHangNavigation != null && (
                        l.IdPhieuNavigation.IdKhachHangNavigation.HoTen.ToLower().Contains(keyword) ||
                        l.IdPhieuNavigation.IdKhachHangNavigation.SoDienThoai.Contains(keyword)
                    ))
                )) ||
                (l.DiaChiHoTro != null && l.DiaChiHoTro.ToLower().Contains(keyword))
            );
        }

        // 3. Lọc theo Trạng thái
        if (!string.IsNullOrWhiteSpace(filter.TrangThai) && !filter.TrangThai.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            string st = filter.TrangThai.Trim();
            if (st.Equals("ChoXacNhan", StringComparison.OrdinalIgnoreCase) || st.Equals("ChoDuyet", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "ChoXacNhan" || l.TrangThai == "Chờ xác nhận" || l.TrangThai == "ChoDuyet" || l.TrangThai == "Chờ duyệt");
            }
            else if (st.Equals("DaXacNhan", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "DaXacNhan" || l.TrangThai == "Đã xác nhận");
            }
            else if (st.Equals("DangThucHien", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "DangThucHien" || l.TrangThai == "Đang thực hiện");
            }
            else if (st.Equals("HoanThanh", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "HoanThanh" || l.TrangThai == "Hoàn thành" || l.TrangThai == "DaHoanThanh");
            }
            else if (st.Equals("DaHuy", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "DaHuy" || l.TrangThai == "Đã hủy" || l.TrangThai == "DaTuChoi");
            }
            else if (st.Equals("ChoXacNhanDoi", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "ChoXacNhanDoi" || l.TrangThai == "Chờ xác nhận đổi");
            }
        }

        // 4. Lọc Khoảng ngày
        if (filter.TuNgay.HasValue)
        {
            var tuNgayOnly = DateOnly.FromDateTime(filter.TuNgay.Value);
            query = query.Where(l => l.NgayHen >= tuNgayOnly);
        }

        if (filter.DenNgay.HasValue)
        {
            var denNgayOnly = DateOnly.FromDateTime(filter.DenNgay.Value);
            query = query.Where(l => l.NgayHen <= denNgayOnly);
        }

        query = query.OrderByDescending(l => l.IdLichHen);

        int totalFilteredItems = await query.CountAsync();
        var pagedItems = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var dtoList = pagedItems.Select(l => MapToDto(l)).ToList();

        return new NhanVienLichHenListViewModel
        {
            Items = dtoList,
            Filter = filter,
            TotalItems = totalFilteredItems,
            PageIndex = filter.Page,
            PageSize = filter.PageSize,
            TotalMyAppointments = totalMyAppts,
            PendingCount = pendingCount,
            ConfirmedCount = confirmedCount,
            CancelledCount = cancelledCount,
            ReschedulePendingCount = reschedulePendingCount
        };
    }

    public async Task<PagedResult<LichHenNhanVienDto>> GetListAsync(int nhanVienId, NhanVienLichHenFilterInput filter, int page, int pageSize)
    {
        filter.Page = page;
        filter.PageSize = pageSize;
        var vm = await GetListViewModelAsync(nhanVienId, filter);
        return new PagedResult<LichHenNhanVienDto>
        {
            Items = vm.Items,
            TotalItems = vm.TotalItems,
            PageIndex = vm.PageIndex,
            PageSize = vm.PageSize
        };
    }

    public async Task<LichHenNhanVienDetailDto> GetDetailAsync(int id, int nhanVienId)
    {
        var lichHen = await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null)
            throw new KeyNotFoundException("Không tìm thấy thông tin lịch hẹn.");

        // Ràng buộc bảo mật: Chỉ cho phép Nhân viên phụ trách xem lịch hẹn của mình
        if (lichHen.IdNhanVien != nhanVienId)
            throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền xem thông tin lịch hẹn của nhân viên khác.");

        var historyLogs = await GetLichSuAsync(id, nhanVienId);
        var (title, badgeClass) = GetStatusInfo(lichHen.TrangThai);

        return new LichHenNhanVienDetailDto
        {
            IdLichHen = lichHen.IdLichHen,
            MaLichHen = $"LH-{lichHen.NgayHen:yyyyMMdd}-{lichHen.IdLichHen:D3}",
            NgayHen = lichHen.NgayHen,
            GioBatDau = lichHen.GioBatDau,
            GioKetThuc = lichHen.GioKetThuc,
            DiaDiem = !string.IsNullOrWhiteSpace(lichHen.DiaChiHoTro) ? lichHen.DiaChiHoTro : (lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? ""),
            HinhThuc = lichHen.HinhThuc ?? "TrucTiep",
            TrangThai = lichHen.TrangThai ?? "ChoXacNhan",
            TrangThaiTitle = title,
            TrangThaiBadgeClass = badgeClass,
            GhiChu = lichHen.GhiChu,
            LyDo = lichHen.LyDoHuy ?? lichHen.LyDoDoiLich,
            NgayTao = lichHen.NgayTao,

            IdKhachHang = lichHen.IdPhieuNavigation?.IdKhachHang,
            TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            SoDienThoaiKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.SoDienThoai ?? "",
            EmailKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.Email ?? "",
            DiaChiKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? "",

            IdPhieu = lichHen.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}",
            TieuDePhieu = lichHen.IdPhieuNavigation?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            TrangThaiPhieu = lichHen.IdPhieuNavigation?.TrangThai ?? "Đang xử lý",
            TenDichVu = lichHen.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ Viettel",

            LichSuChanges = historyLogs
        };
    }

    public async Task<ServiceResult> YeuCauDoiLichAsync(YeuCauDoiLichInputDto dto, int nhanVienId)
    {
        var lichHen = await _context.LichHens
            .Include(l => l.IdPhieuNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == dto.LichHenId);

        if (lichHen == null)
            return ServiceResult.Fail("Không tìm thấy thông tin lịch hẹn.");

        // 1. Phân quyền: Phải là KTV phụ trách
        if (lichHen.IdNhanVien != nhanVienId)
            return ServiceResult.Fail("Bạn không có quyền yêu cầu đổi lịch cho hẹn của nhân viên khác.");

        // 2. Ràng buộc thời gian: Không được đổi lịch trong quá khứ
        if (lichHen.NgayHen.HasValue && lichHen.NgayHen.Value < DateOnly.FromDateTime(DateTime.Today))
            return ServiceResult.Fail("Lịch hẹn đã diễn ra trong quá khứ, không thể gửi yêu cầu đổi lịch.");

        if (dto.NgayMoi < DateOnly.FromDateTime(DateTime.Today))
            return ServiceResult.Fail("Ngày mới đề xuất không được nằm trong quá khứ.");

        if (dto.GioBatDauMoi >= dto.GioKetThucMoi)
            return ServiceResult.Fail("Giờ bắt đầu mới phải nhỏ hơn giờ kết thúc mới.");

        // 3. Kiểm tra trùng/xung đột lịch làm việc cá nhân của Nhân viên này
        DateTime startDateTime = dto.NgayMoi.ToDateTime(dto.GioBatDauMoi);
        DateTime endDateTime = dto.NgayMoi.ToDateTime(dto.GioKetThucMoi);

        var availResult = await _availabilityService.CheckEmployeeAvailabilityAsync(
            nhanVienId, startDateTime, endDateTime, lichHen.HinhThuc ?? "TrucTiep", dto.LichHenId);

        string conflictNote = "";
        if (!availResult.IsAvailable)
        {
            conflictNote = $" [Lưu ý: Có cảnh báo trùng lịch làm việc khác: {availResult.Message}]";
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Cập nhật trạng thái lịch hẹn hiện tại thành ChoXacNhanDoi
            string oldStatus = lichHen.TrangThai ?? "DaXacNhan";
            lichHen.TrangThai = "ChoXacNhanDoi";
            lichHen.LyDoDoiLich = dto.LyDo.Trim();
            lichHen.NgayCapNhat = DateTime.Now;

            // Ghi nhật ký xử lý
            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = nhanVienId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "ChoXacNhanDoi",
                NoiDungCapNhat = $"KTV gửi yêu cầu đổi lịch hẹn #{lichHen.IdLichHen} sang ngày {dto.NgayMoi:dd/MM/yyyy} ({dto.GioBatDauMoi:HH:mm}-{dto.GioKetThucMoi:HH:mm}). Lý do: {dto.LyDo.Trim()}",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Gửi thông báo đến Admin
            try
            {
                await _signalRService.BroadcastNotificationAsync(
                    "AdminRoom",
                    null,
                    "ReceiveNotification",
                    new { idPhieu = lichHen.IdPhieu ?? 0, message = $"Nhân viên yêu cầu đổi lịch hẹn #{lichHen.IdLichHen} sang ngày {dto.NgayMoi:dd/MM/yyyy}." });
            }
            catch { }

            return ServiceResult.Ok("Đã gửi yêu cầu đổi lịch hẹn thành công. Vui lòng chờ Admin/Điều phối viên xét duyệt.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return ServiceResult.Fail("Lỗi hệ thống khi gửi yêu cầu đổi lịch: " + ex.Message);
        }
    }

    public async Task<ServiceResult> HuyLichAsync(int id, int nhanVienId, string lyDo)
    {
        if (string.IsNullOrWhiteSpace(lyDo))
            return ServiceResult.Fail("Vui lòng nhập lý do hủy lịch.");

        var lichHen = await _context.LichHens
            .Include(l => l.IdPhieuNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null)
            return ServiceResult.Fail("Không tìm thấy lịch hẹn.");

        // 1. Kiểm tra phân quyền
        if (lichHen.IdNhanVien != nhanVienId)
            return ServiceResult.Fail("Bạn không có quyền hủy lịch hẹn của nhân viên khác.");

        // 2. Ràng buộc thời gian
        if (lichHen.NgayHen.HasValue && lichHen.NgayHen.Value < DateOnly.FromDateTime(DateTime.Today))
            return ServiceResult.Fail("Không thể hủy lịch hẹn đã diễn ra trong quá khứ.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string oldStatus = lichHen.TrangThai ?? "ChoXacNhan";
            lichHen.TrangThai = "DaHuy";
            lichHen.LyDoHuy = lyDo.Trim();
            lichHen.NgayCapNhat = DateTime.Now;

            // Ghi nhật ký
            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = nhanVienId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "DaHuy",
                NoiDungCapNhat = $"KTV hủy lịch hẹn #{id}. Lý do: {lyDo.Trim()}",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return ServiceResult.Ok("Hủy lịch hẹn thành công.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return ServiceResult.Fail("Lỗi hệ thống khi hủy lịch: " + ex.Message);
        }
    }

    public async Task<List<LichSuLichHenDto>> GetLichSuAsync(int lichHenId, int nhanVienId)
    {
        var lichHen = await _context.LichHens.AsNoTracking().FirstOrDefaultAsync(l => l.IdLichHen == lichHenId);
        if (lichHen == null || (lichHen.IdNhanVien != nhanVienId && nhanVienId > 0))
            return new List<LichSuLichHenDto>();

        var logs = await _context.LichSuHoTros
            .AsNoTracking()
            .Include(ls => ls.IdNhanVienNavigation)
            .Where(ls => ls.IdPhieu == lichHen.IdPhieu)
            .OrderByDescending(ls => ls.NgayCapNhat)
            .ToListAsync();

        return logs.Select(ls => new LichSuLichHenDto
        {
            Id = ls.IdLichSu,
            ThoiGian = ls.NgayCapNhat?.ToDateTime(TimeOnly.MinValue) ?? DateTime.Now,
            NguoiThucHien = ls.IdNhanVienNavigation?.HoTen ?? "Hệ thống",
            HanHDong = $"{ls.TrangThaiCu} ➔ {ls.TrangThaiMoi}",
            NoiDung = ls.NoiDungCapNhat ?? ""
        }).ToList();
    }

    private static LichHenNhanVienDto MapToDto(LichHen l)
    {
        var (title, badge) = GetStatusInfo(l.TrangThai);
        string maLH = $"LH-{l.NgayHen:yyyyMMdd}-{l.IdLichHen:D3}";
        string maPhieu = !string.IsNullOrEmpty(l.IdPhieuNavigation?.MaPhieu) ? l.IdPhieuNavigation.MaPhieu : $"PHT{l.IdPhieu:D6}";

        return new LichHenNhanVienDto
        {
            IdLichHen = l.IdLichHen,
            MaLichHen = maLH,
            IdPhieu = l.IdPhieu,
            MaPhieu = maPhieu,
            TieuDePhieu = l.IdPhieuNavigation?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            IdKhachHang = l.IdPhieuNavigation?.IdKhachHang,
            TenKhachHang = l.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            SoDienThoaiKhachHang = l.IdPhieuNavigation?.IdKhachHangNavigation?.SoDienThoai ?? "",
            EmailKhachHang = l.IdPhieuNavigation?.IdKhachHangNavigation?.Email ?? "",
            NgayHen = l.NgayHen,
            GioBatDau = l.GioBatDau,
            GioKetThuc = l.GioKetThuc,
            DiaDiem = !string.IsNullOrWhiteSpace(l.DiaChiHoTro) ? l.DiaChiHoTro : (l.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? ""),
            HinhThuc = l.HinhThuc ?? "TrucTiep",
            TrangThai = l.TrangThai ?? "ChoXacNhan",
            TrangThaiTitle = title,
            TrangThaiBadgeClass = badge,
            GhiChu = l.GhiChu,
            LyDo = l.LyDoHuy ?? l.LyDoDoiLich,
            NgayTao = l.NgayTao
        };
    }

    private static bool MatchStatus(string? status, string target)
    {
        if (string.IsNullOrEmpty(status)) return false;
        if (status.Equals(target, StringComparison.OrdinalIgnoreCase)) return true;

        return target.ToLower() switch
        {
            "choxacnhan" or "choduyet" => status == "Chờ xác nhận" || status == "Chờ duyệt",
            "daxacnhan" => status == "Đã xác nhận",
            "dangthuchien" => status == "Đang thực hiện",
            "hoanthanh" => status == "Hoàn thành" || status == "DaHoanThanh",
            "dahuy" or "datuchoi" => status == "Đã hủy" || status == "Đã từ chối",
            "choxacnhandoi" => status == "Chờ xác nhận đổi" || status == "ChoXacNhanDoi",
            _ => false
        };
    }

    private static (string title, string badgeClass) GetStatusInfo(string? status)
    {
        if (string.IsNullOrEmpty(status)) return ("Chờ duyệt", "bg-warning text-dark");

        return status.Trim() switch
        {
            "ChoXacNhan" or "ChoDuyet" or "Chờ xác nhận" or "Chờ duyệt" => ("Chờ duyệt", "bg-warning text-dark"),
            "DaXacNhan" or "Đã xác nhận" => ("Đã xác nhận", "bg-primary"),
            "DangThucHien" or "Đang thực hiện" => ("Đang thực hiện", "bg-info text-dark"),
            "HoanThanh" or "Hoàn thành" or "DaHoanThanh" => ("Hoàn thành", "bg-success"),
            "DaHuy" or "Đã hủy" => ("Đã hủy", "bg-danger"),
            "DaTuChoi" or "Đã từ chối" => ("Đã từ chối", "bg-secondary"),
            "ChoXacNhanDoi" or "Chờ xác nhận đổi" => ("Chờ xác nhận đổi", "bg-purple text-white"),
            _ => (status, "bg-secondary")
        };
    }
}
