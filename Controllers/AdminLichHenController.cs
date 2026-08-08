using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Services;
using SupportTicketSysterm.ViewModels;

namespace SupportTicketSysterm.Controllers;

/// <summary>
/// Controller Quản lý Lịch hẹn hỗ trợ kỹ thuật dành riêng cho ADMIN / BỘ PHẬN ĐIỀU PHỐI
/// Bao gồm các chức năng nghiệp vụ: 
/// - Xem danh sách (Lọc trạng thái, tìm kiếm, phân trang, thống kê KPI)
/// - Xem chi tiết lịch hẹn
/// - Xác nhận lịch & Phân công KTV (có kiểm tra xung đột lịch làm việc)
/// - Từ chối lịch hẹn (có lý do)
/// - Chỉnh sửa lịch hẹn
/// - Hủy lịch hẹn đã xác nhận (có lý do)
/// - Đánh dấu hoàn thành lịch hẹn
/// </summary>
[Authorize(Roles = "Admin,QuanTriVien,AdminManager,NhanVien,Staff,KyThuat")]
[Route("Admin/LichHen")]
[Route("Admin/QuanLyLichHen")]
[Route("AdminLichHen")]
public class AdminLichHenController : Controller
{
    private readonly TechSupportContext _context;
    private readonly ILichHenService _lichHenService;
    private readonly IAvailabilityService _availabilityService;

    public AdminLichHenController(
        TechSupportContext context,
        ILichHenService lichHenService,
        IAvailabilityService availabilityService)
    {
        _context = context;
        _lichHenService = lichHenService;
        _availabilityService = availabilityService;
    }

    private (int userId, string userRole) GetCurrentAdminInfo()
    {
        var id = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId");
        if (id == null)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int claimId)) id = claimId;
        }

        string role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        return (id ?? 0, role);
    }

    /// <summary>
    /// 1. DANH SÁCH LỊCH HẸN (Index) - Lọc, tìm kiếm, phân trang, KPI
    /// </summary>
    [HttpGet("")]
    [HttpGet("Index")]
    public async Task<IActionResult> Index([FromQuery] AdminLichHenFilterInput filter)
    {
        filter ??= new AdminLichHenFilterInput();
        if (filter.Page < 1) filter.Page = 1;
        if (filter.PageSize < 1) filter.PageSize = 10;

        // Truy vấn gốc
        var query = _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .AsQueryable();

        // 1. Thống kê KPI trước khi lọc từ khóa/trạng thái
        var allAppts = await query.Select(l => new { l.IdLichHen, l.TrangThai }).ToListAsync();
        int totalAppts = allAppts.Count;
        int pendingCount = allAppts.Count(l => MatchStatus(l.TrangThai, "ChoXacNhan"));
        int confirmedCount = allAppts.Count(l => MatchStatus(l.TrangThai, "DaXacNhan") || MatchStatus(l.TrangThai, "DangThucHien"));
        int completedCount = allAppts.Count(l => MatchStatus(l.TrangThai, "HoanThanh"));
        int cancelledCount = allAppts.Count(l => MatchStatus(l.TrangThai, "DaHuy"));

        // 2. Lọc theo Từ khóa tìm kiếm (Mã phiếu, Tiêu đề, Tên KH, SĐT KH, Tên KTV)
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
                (l.IdNhanVienNavigation != null && l.IdNhanVienNavigation.HoTen.ToLower().Contains(keyword)) ||
                (l.DiaChiHoTro != null && l.DiaChiHoTro.ToLower().Contains(keyword))
            );
        }

        // 3. Lọc theo Trạng thái
        if (!string.IsNullOrWhiteSpace(filter.TrangThai))
        {
            string st = filter.TrangThai.Trim();
            if (st.Equals("ChoXacNhan", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.TrangThai == "ChoXacNhan" || l.TrangThai == "Chờ xác nhận");
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
                query = query.Where(l => l.TrangThai == "DaHuy" || l.TrangThai == "Đã hủy");
            }
        }

        // 4. Lọc theo KTV
        if (filter.IdNhanVien.HasValue && filter.IdNhanVien.Value > 0)
        {
            query = query.Where(l => l.IdNhanVien == filter.IdNhanVien.Value);
        }

        // 5. Lọc theo Khoảng ngày
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

        // Sắp xếp theo lựa chọn
        if (filter.SapXep == "CuNhat")
        {
            query = query.OrderBy(l => l.IdLichHen);
        }
        else if (filter.SapXep == "NgayHenTang")
        {
            query = query.OrderBy(l => l.NgayHen).ThenBy(l => l.GioBatDau);
        }
        else if (filter.SapXep == "NgayHenGiam")
        {
            query = query.OrderByDescending(l => l.NgayHen).ThenByDescending(l => l.GioBatDau);
        }
        else
        {
            // Mới nhất (Mặc định)
            query = query.OrderByDescending(l => l.IdLichHen);
        }

        int totalFilteredItems = await query.CountAsync();

        // Phân trang
        var pagedItems = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        // Map sang ItemViewModel
        var itemViewModels = pagedItems.Select(l => MapToItemViewModel(l)).ToList();

        // Danh sách KTV cho dropdown lọc & phân công
        var staffList = await _context.NhanViens
            .AsNoTracking()
            .OrderBy(n => n.HoTen)
            .Select(n => new SelectListItem
            {
                Value = n.IdNhanVien.ToString(),
                Text = $"{n.HoTen} ({(string.IsNullOrEmpty(n.ChucVu) ? "KTV" : n.ChucVu)})",
                Selected = (filter.IdNhanVien.HasValue && filter.IdNhanVien.Value == n.IdNhanVien)
            }).ToListAsync();

        var eligibleTickets = await GetEligibleTicketsForAdminAsync();
        var phieuSelectList = eligibleTickets.Select(p => new SelectListItem
        {
            Value = p.IdPhieu.ToString(),
            Text = $"[{(!string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}")}] {p.TieuDe} - Khách: {(p.IdKhachHangNavigation?.HoTen ?? "N/A")}"
        }).ToList();

        var model = new AdminLichHenListViewModel
        {
            Items = itemViewModels,
            Filter = filter,
            TotalItems = totalFilteredItems,
            PageIndex = filter.Page,
            PageSize = filter.PageSize,
            TotalAppointments = totalAppts,
            PendingCount = pendingCount,
            ConfirmedCount = confirmedCount,
            CompletedCount = completedCount,
            CancelledCount = cancelledCount,
            NhanVienList = staffList,
            PhieuList = phieuSelectList
        };

        return View(model);
    }

    /// <summary>
    /// API lấy thông tin lịch hẹn JSON cho Modal Popup
    /// </summary>
    [HttpGet("GetJson/{id:int}")]
    public async Task<IActionResult> GetJson(int id)
    {
        var lichHen = await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d.IdDanhMucNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.FileDinhKems)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null) return NotFound(new { message = "Không tìm thấy lịch hẹn." });

        var (statusTitle, badgeClass, _) = GetStatusInfo(lichHen.TrangThai);
        var p = lichHen.IdPhieuNavigation;

        return Json(new
        {
            idLichHen = lichHen.IdLichHen,
            idPhieu = lichHen.IdPhieu,
            maPhieu = !string.IsNullOrEmpty(p?.MaPhieu) ? p.MaPhieu : $"PHT{lichHen.IdPhieu:D6}",
            tieuDePhieu = p?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            tenDanhMuc = p?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "Hỗ trợ kỹ thuật",
            tenDichVu = p?.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ Viettel",
            tenKhachHang = p?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            soDienThoaiKhachHang = p?.IdKhachHangNavigation?.SoDienThoai ?? "Chưa cập nhật",
            emailKhachHang = p?.IdKhachHangNavigation?.Email ?? "Chưa cập nhật",
            diaChiKhachHang = p?.IdKhachHangNavigation?.DiaChi ?? "Chưa cập nhật",
            idNhanVien = lichHen.IdNhanVien,
            tenNhanVien = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công KTV",
            soDienThoaiNhanVien = lichHen.IdNhanVienNavigation?.SoDienThoai ?? "Chưa có",
            ngayHen = lichHen.NgayHen?.ToString("yyyy-MM-dd"),
            ngayHenFormatted = lichHen.NgayHen?.ToString("dd/MM/yyyy") ?? "—",
            gioBatDau = lichHen.GioBatDau?.ToString(@"hh\:mm"),
            gioKetThuc = lichHen.GioKetThuc?.ToString(@"hh\:mm"),
            hinhThuc = lichHen.HinhThuc ?? "TrucTiep",
            hinhThucText = (lichHen.HinhThuc == "TrucTuyen") ? "Trực tuyến (Remote)" : "Trực tiếp (Tận nơi)",
            diaDiem = !string.IsNullOrWhiteSpace(lichHen.DiaChiHoTro) ? lichHen.DiaChiHoTro : (p?.IdKhachHangNavigation?.DiaChi ?? "Chưa cập nhật"),
            ghiChu = lichHen.GhiChu ?? "",
            trangThaiCode = lichHen.TrangThai ?? "ChoXacNhan",
            trangThaiTitle = statusTitle,
            ngayTaoFormatted = lichHen.NgayTao?.ToString("dd/MM/yyyy HH:mm") ?? p?.NgayTao?.ToString("dd/MM/yyyy") ?? "—",
            files = p?.FileDinhKems?.Select(f => new { tenFile = f.TenFile, duongDan = f.DuongDan }).ToList() ?? new()
        });
    }

    /// <summary>
    /// 2. XEM CHI TIẾT LỊCH HẸN (Details / ChiTiet)
    /// </summary>
    [HttpGet("Details/{id:int}")]
    [HttpGet("ChiTiet/{id:int}")]
    public async Task<IActionResult> Details(int id)
    {
        var lichHen = await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null)
        {
            TempData["ErrorMessage"] = "Không tìm thấy thông tin lịch hẹn.";
            return RedirectToAction("Index");
        }

        // Lấy nhật ký xử lý của phiếu
        var historyLogs = await _context.LichSuHoTros
            .AsNoTracking()
            .Include(ls => ls.IdNhanVienNavigation)
            .Where(ls => ls.IdPhieu == lichHen.IdPhieu)
            .OrderByDescending(ls => ls.NgayCapNhat)
            .Select(ls => new LichSuHoTroItemViewModel
            {
                IdLichSu = ls.IdLichSu,
                TrangThaiCu = ls.TrangThaiCu ?? "--",
                TrangThaiMoi = ls.TrangThaiMoi ?? "--",
                NoiDungCapNhat = ls.NoiDungCapNhat ?? "",
                NgayCapNhat = ls.NgayCapNhat,
                TenNhanVien = ls.IdNhanVienNavigation != null ? ls.IdNhanVienNavigation.HoTen : "Hệ thống"
            })
            .ToListAsync();

        // Danh sách KTV cho modal phân công
        var staffList = await _context.NhanViens
            .AsNoTracking()
            .OrderBy(n => n.HoTen)
            .Select(n => new SelectListItem
            {
                Value = n.IdNhanVien.ToString(),
                Text = $"{n.HoTen} ({(string.IsNullOrEmpty(n.ChucVu) ? "KTV" : n.ChucVu)})",
                Selected = (lichHen.IdNhanVien.HasValue && lichHen.IdNhanVien.Value == n.IdNhanVien)
            }).ToListAsync();

        var (statusTitle, badgeClass, _) = GetStatusInfo(lichHen.TrangThai);

        var viewModel = new AdminLichHenDetailViewModel
        {
            IdLichHen = lichHen.IdLichHen,
            IdPhieu = lichHen.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}",
            TieuDePhieu = lichHen.IdPhieuNavigation?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            TenDichVu = lichHen.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ Viettel",
            TrangThaiPhieu = lichHen.IdPhieuNavigation?.TrangThai ?? "Đang xử lý",
            NgayTaoPhieu = lichHen.IdPhieuNavigation?.NgayTao?.ToDateTime(TimeOnly.MinValue),

            IdKhachHang = lichHen.IdPhieuNavigation?.IdKhachHang,
            TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            SoDienThoaiKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.SoDienThoai ?? "Chưa cập nhật",
            EmailKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.Email ?? "",
            DiaChiKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? "",

            IdNhanVien = lichHen.IdNhanVien,
            TenNhanVien = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công KTV",
            ChucVuNhanVien = lichHen.IdNhanVienNavigation?.ChucVu ?? "Nhân viên kỹ thuật",
            SoDienThoaiNhanVien = lichHen.IdNhanVienNavigation?.SoDienThoai ?? "Chưa có",

            NgayHen = lichHen.NgayHen,
            GioBatDau = lichHen.GioBatDau,
            GioKetThuc = lichHen.GioKetThuc,
            HinhThuc = lichHen.HinhThuc ?? "TrucTiep",
            DiaDiem = !string.IsNullOrWhiteSpace(lichHen.DiaChiHoTro) ? lichHen.DiaChiHoTro : (lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? ""),
            GhiChu = lichHen.GhiChu,
            TrangThaiCode = lichHen.TrangThai ?? "ChoXacNhan",
            TrangThaiTitle = statusTitle,
            TrangThaiBadgeClass = badgeClass,
            NgayTao = lichHen.NgayTao,
            NgayXacNhan = lichHen.NgayXacNhan,
            NgayHoanThanh = lichHen.NgayHoanThanh,
            LyDoHuy = lichHen.LyDoHuy,
            LyDoDoiLich = lichHen.LyDoDoiLich,

            HistoryLogs = historyLogs,
            NhanVienList = staffList
        };

        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
        {
            return PartialView("_DetailsPartial", viewModel);
        }

        return View(viewModel);
    }

    /// <summary>
    /// 3. XÁC NHẬN VÀ PHÂN CÔNG LỊCH HẸN (Confirm - POST)
    /// </summary>
    [HttpPost("Confirm")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Confirm(AdminConfirmLichHenInput input)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        if (!ModelState.IsValid)
        {
            if (isAjax) return Json(new { success = false, message = "Vui lòng kiểm tra lại thông tin phân công." });
            TempData["ErrorMessage"] = "Vui lòng kiểm tra lại thông tin phân công.";
            return RedirectToAction("Index");
        }

        var (userId, userRole) = GetCurrentAdminInfo();

        try
        {
            var dto = new AssignLichHenDto
            {
                IdLichHen = input.IdLichHen,
                IdNhanVien = input.IdNhanVien
            };

            if (input.NgayHen.HasValue && input.GioBatDau.HasValue && input.GioKetThuc.HasValue)
            {
                dto.ThoiGianBatDau = input.NgayHen.Value.ToDateTime(input.GioBatDau.Value);
                dto.ThoiGianKetThuc = input.NgayHen.Value.ToDateTime(input.GioKetThuc.Value);
            }

            var appt = await _lichHenService.AssignAndConfirmAppointmentAsync(dto, userId, userRole);
            var nvObj = input.IdNhanVien > 0 ? await _context.NhanViens.FindAsync(input.IdNhanVien) : null;
            if (isAjax)
            {
                return Json(new
                {
                    success = true,
                    message = "Xác nhận lịch hẹn và phân công kỹ thuật viên thành công!",
                    idLichHen = input.IdLichHen,
                    trangThaiCode = "DaXacNhan",
                    trangThaiTitle = "Đã xác nhận",
                    tenNhanVien = nvObj?.HoTen ?? "Đã phân công"
                });
            }
            TempData["SuccessMessage"] = "Xác nhận lịch hẹn và phân công kỹ thuật viên thành công!";
        }
        catch (Exception ex)
        {
            if (isAjax) return Json(new { success = false, message = ex.Message });
            TempData["ErrorMessage"] = ex.Message;
        }

        string referer = Request.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(referer) && referer.Contains("/ChiTiet/", StringComparison.OrdinalIgnoreCase))
        {
            return RedirectToAction("Details", new { id = input.IdLichHen });
        }

        return RedirectToAction("Index");
    }

    /// <summary>
    /// 4. TỪ CHỐI LỊCH HẸN (Reject - POST)
    /// </summary>
    [HttpPost("Reject")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reject(AdminRejectLichHenInput input)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        if (!ModelState.IsValid)
        {
            if (isAjax) return Json(new { success = false, message = "Vui lòng nhập lý do từ chối lịch hẹn." });
            TempData["ErrorMessage"] = "Vui lòng nhập lý do từ chối lịch hẹn.";
            return RedirectToAction("Index");
        }

        var (userId, userRole) = GetCurrentAdminInfo();

        try
        {
            var dto = new CancelLichHenDto
            {
                IdLichHen = input.IdLichHen,
                LyDoHuy = input.LyDoHuy
            };

            await _lichHenService.CancelAppointmentAsync(dto, userId, userRole);
            if (isAjax)
            {
                return Json(new
                {
                    success = true,
                    message = "Đã từ chối lịch hẹn thành công.",
                    idLichHen = input.IdLichHen,
                    trangThaiCode = "DaHuy",
                    trangThaiTitle = "Đã hủy"
                });
            }
            TempData["SuccessMessage"] = "Đã từ chối lịch hẹn thành công.";
        }
        catch (Exception ex)
        {
            if (isAjax) return Json(new { success = false, message = ex.Message });
            TempData["ErrorMessage"] = ex.Message;
        }

        string referer = Request.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(referer) && referer.Contains("/ChiTiet/", StringComparison.OrdinalIgnoreCase))
        {
            return RedirectToAction("Details", new { id = input.IdLichHen });
        }

        return RedirectToAction("Index");
    }

    /// <summary>
    /// 5. CHỈNH SỬA LỊCH HẸN (Edit - GET & POST)
    /// </summary>
    [HttpGet("Edit/{id:int}")]
    public async Task<IActionResult> Edit(int id)
    {
        var lichHen = await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null)
        {
            TempData["ErrorMessage"] = "Không tìm thấy lịch hẹn.";
            return RedirectToAction("Index");
        }

        var staffList = await _context.NhanViens
            .AsNoTracking()
            .OrderBy(n => n.HoTen)
            .Select(n => new SelectListItem
            {
                Value = n.IdNhanVien.ToString(),
                Text = $"{n.HoTen} ({(string.IsNullOrEmpty(n.ChucVu) ? "KTV" : n.ChucVu)})",
                Selected = (lichHen.IdNhanVien.HasValue && lichHen.IdNhanVien.Value == n.IdNhanVien)
            }).ToListAsync();

        var model = new AdminEditLichHenViewModel
        {
            IdLichHen = lichHen.IdLichHen,
            IdPhieu = lichHen.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}",
            TieuDePhieu = lichHen.IdPhieuNavigation?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            TenDichVu = lichHen.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ Viettel",
            IdNhanVien = lichHen.IdNhanVien,
            NgayHen = lichHen.NgayHen ?? DateOnly.FromDateTime(DateTime.Today.AddDays(1)),
            GioBatDau = lichHen.GioBatDau ?? new TimeOnly(8, 0),
            GioKetThuc = lichHen.GioKetThuc ?? new TimeOnly(10, 0),
            HinhThuc = lichHen.HinhThuc ?? "TrucTiep",
            DiaDiem = !string.IsNullOrWhiteSpace(lichHen.DiaChiHoTro) ? lichHen.DiaChiHoTro : (lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? ""),
            GhiChu = lichHen.GhiChu,
            NhanVienList = staffList
        };

        return View(model);
    }

    [HttpPost("Edit/{id:int}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, AdminEditLichHenViewModel model)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        if (id != model.IdLichHen)
        {
            if (isAjax) return Json(new { success = false, message = "ID lịch hẹn không khớp." });
            return BadRequest();
        }

        if (model.NgayHen < DateOnly.FromDateTime(DateTime.Today))
        {
            ModelState.AddModelError("NgayHen", "Ngày hẹn không được nhỏ hơn ngày hiện tại.");
        }

        if (model.GioBatDau >= model.GioKetThuc)
        {
            ModelState.AddModelError("GioKetThuc", "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
        }

        if (!model.IdNhanVien.HasValue || model.IdNhanVien.Value <= 0)
        {
            ModelState.AddModelError("IdNhanVien", "Bắt buộc chọn kỹ thuật viên phụ trách.");
        }

        if (!ModelState.IsValid)
        {
            var firstErr = ModelState.Values.SelectMany(v => v.Errors).FirstOrDefault()?.ErrorMessage ?? "Dữ liệu nhập không hợp lệ.";
            if (isAjax) return Json(new { success = false, message = firstErr });

            model.NhanVienList = await _context.NhanViens
                .AsNoTracking()
                .OrderBy(n => n.HoTen)
                .Select(n => new SelectListItem
                {
                    Value = n.IdNhanVien.ToString(),
                    Text = $"{n.HoTen} ({(string.IsNullOrEmpty(n.ChucVu) ? "KTV" : n.ChucVu)})",
                    Selected = (model.IdNhanVien.HasValue && model.IdNhanVien.Value == n.IdNhanVien)
                }).ToListAsync();

            return View(model);
        }

        var (userId, userRole) = GetCurrentAdminInfo();

        var lichHen = await _context.LichHens
            .Include(l => l.IdPhieuNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null)
        {
            if (isAjax) return Json(new { success = false, message = "Không tìm thấy thông tin lịch hẹn." });
            TempData["ErrorMessage"] = "Không tìm thấy lịch hẹn.";
            return RedirectToAction("Index");
        }

        DateTime startDateTime = model.NgayHen.ToDateTime(model.GioBatDau);
        DateTime endDateTime = model.NgayHen.ToDateTime(model.GioKetThuc);

        // Kiểm tra xung đột lịch làm việc
        if (model.IdNhanVien.HasValue && model.IdNhanVien.Value > 0)
        {
            var availResult = await _availabilityService.CheckEmployeeAvailabilityAsync(
                model.IdNhanVien.Value,
                startDateTime,
                endDateTime,
                model.HinhThuc,
                model.IdLichHen);

            if (!availResult.IsAvailable)
            {
                string conflictMsg = "Kỹ thuật viên đã có lịch hẹn trong khoảng thời gian này. Vui lòng chọn nhân viên khác hoặc đổi thời gian.";
                if (isAjax) return Json(new { success = false, message = conflictMsg });

                ModelState.AddModelError("", conflictMsg);
                model.NhanVienList = await _context.NhanViens
                    .AsNoTracking()
                    .OrderBy(n => n.HoTen)
                    .Select(n => new SelectListItem
                    {
                        Value = n.IdNhanVien.ToString(),
                        Text = $"{n.HoTen} ({(string.IsNullOrEmpty(n.ChucVu) ? "KTV" : n.ChucVu)})",
                        Selected = (model.IdNhanVien.HasValue && model.IdNhanVien.Value == n.IdNhanVien)
                    }).ToListAsync();
                return View(model);
            }
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string oldStatus = lichHen.TrangThai ?? "ChoXacNhan";

            lichHen.IdNhanVien = model.IdNhanVien;
            lichHen.NgayHen = model.NgayHen;
            lichHen.GioBatDau = model.GioBatDau;
            lichHen.GioKetThuc = model.GioKetThuc;
            lichHen.HinhThuc = model.HinhThuc;
            lichHen.DiaChiHoTro = model.DiaDiem?.Trim();
            lichHen.GhiChu = model.GhiChu?.Trim();
            lichHen.NgayCapNhat = DateTime.Now;

            // Nếu phân công KTV mới cho phiếu
            if (lichHen.IdPhieuNavigation != null && model.IdNhanVien.HasValue)
            {
                lichHen.IdPhieuNavigation.IdNhanVien = model.IdNhanVien;
                lichHen.IdPhieuNavigation.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);
            }

            // Ghi nhật ký xử lý
            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = userId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = oldStatus,
                NoiDungCapNhat = $"Admin cập nhật thông tin lịch hẹn #{lichHen.IdLichHen} [{model.NgayHen:dd/MM/yyyy} {model.GioBatDau:HH:mm}-{model.GioKetThuc:HH:mm}].",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (isAjax)
            {
                return Json(new { success = true, message = "Cập nhật lịch hẹn thành công." });
            }

            TempData["SuccessMessage"] = "Cập nhật thông tin lịch hẹn thành công!";
            return RedirectToAction("Index");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (isAjax) return Json(new { success = false, message = "Có lỗi xảy ra: " + ex.Message });
            ModelState.AddModelError("", "Có lỗi xảy ra khi lưu lịch hẹn: " + ex.Message);
            model.NhanVienList = await _context.NhanViens
                .AsNoTracking()
                .OrderBy(n => n.HoTen)
                .Select(n => new SelectListItem
                {
                    Value = n.IdNhanVien.ToString(),
                    Text = $"{n.HoTen} ({(string.IsNullOrEmpty(n.ChucVu) ? "KTV" : n.ChucVu)})",
                    Selected = (model.IdNhanVien.HasValue && model.IdNhanVien.Value == n.IdNhanVien)
                }).ToListAsync();
            return View(model);
        }
    }

    /// <summary>
    /// 6. HỦY LỊCH HẸN (Cancel / Huy - POST)
    /// </summary>
    [HttpPost("Cancel")]
    [HttpPost("Huy")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Cancel(AdminRejectLichHenInput input)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        if (!ModelState.IsValid)
        {
            if (isAjax) return Json(new { success = false, message = "Vui lòng nhập lý do hủy lịch hẹn." });
            TempData["ErrorMessage"] = "Vui lòng nhập lý do hủy lịch hẹn.";
            return RedirectToAction("Index");
        }

        var (userId, userRole) = GetCurrentAdminInfo();

        try
        {
            var dto = new CancelLichHenDto
            {
                IdLichHen = input.IdLichHen,
                LyDoHuy = input.LyDoHuy
            };

            await _lichHenService.CancelAppointmentAsync(dto, userId, userRole);
            if (isAjax)
            {
                return Json(new
                {
                    success = true,
                    message = "Hủy lịch hẹn thành công.",
                    idLichHen = input.IdLichHen,
                    trangThaiCode = "DaHuy",
                    trangThaiTitle = "Đã hủy"
                });
            }
            TempData["SuccessMessage"] = "Hủy lịch hẹn đã xác nhận thành công.";
        }
        catch (Exception ex)
        {
            if (isAjax) return Json(new { success = false, message = ex.Message });
            TempData["ErrorMessage"] = ex.Message;
        }

        string referer = Request.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(referer) && referer.Contains("/ChiTiet/", StringComparison.OrdinalIgnoreCase))
        {
            return RedirectToAction("Details", new { id = input.IdLichHen });
        }

        return RedirectToAction("Index");
    }

    /// <summary>
    /// 7. ĐÁNH DẤU HOÀN THÀNH LỊCH HẸN (Complete - POST)
    /// </summary>
    [HttpPost("Complete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Complete([FromForm] int idLichHen)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        var (userId, userRole) = GetCurrentAdminInfo();

        try
        {
            await _lichHenService.CompleteAppointmentAsync(idLichHen, userId, userRole);
            if (isAjax)
            {
                return Json(new
                {
                    success = true,
                    message = "Đánh dấu hoàn thành lịch hẹn thành công!",
                    idLichHen = idLichHen,
                    trangThaiCode = "HoanThanh",
                    trangThaiTitle = "Hoàn thành"
                });
            }
            TempData["SuccessMessage"] = "Đánh dấu hoàn thành lịch hẹn thành công!";
        }
        catch (Exception ex)
        {
            if (isAjax) return Json(new { success = false, message = ex.Message });
            TempData["ErrorMessage"] = ex.Message;
        }

        string refererComp = Request.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(refererComp) && refererComp.Contains("/ChiTiet/", StringComparison.OrdinalIgnoreCase))
        {
            return RedirectToAction("Details", new { id = idLichHen });
        }

        return RedirectToAction("Index");
    }

    /// <summary>
    /// PHÂN CÔNG LẠI NHÂN VIÊN KỸ THUẬT (GET)
    /// </summary>
    [HttpGet("PhanCongLai/{id:int}")]
    public async Task<IActionResult> PhanCongLai(int id)
    {
        var (userId, userRole) = GetCurrentAdminInfo();
        if (!IsAdminRole(userRole))
        {
            return StatusCode(StatusCodes.Status403Forbidden, "403 Forbidden: Bạn không có quyền truy cập chức năng phân công lại.");
        }

        var lichHen = await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == id);

        if (lichHen == null)
        {
            TempData["ErrorMessage"] = "Không tìm thấy thông tin lịch hẹn.";
            return RedirectToAction("Index");
        }

        string st = lichHen.TrangThai ?? "";
        if (st.Equals("HoanThanh", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("Hoàn thành", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("DaHoanThanh", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("DaHuy", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("Đã hủy", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("Huy", StringComparison.OrdinalIgnoreCase))
        {
            TempData["ErrorMessage"] = "Không thể phân công lại lịch hẹn đã hoàn thành hoặc đã hủy.";
            return RedirectToAction("Details", new { id });
        }

        // Lấy danh sách KTV đang hoạt động kèm số lượng lịch đang xử lý từ SQL Server
        var staffSelectList = await GetActiveStaffSelectListAsync(lichHen.IdNhanVien);

        var model = new AdminPhanCongLaiViewModel
        {
            IdLichHen = lichHen.IdLichHen,
            IdPhieu = lichHen.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}",
            TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            TenKtvHienTai = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công",
            IdNhanVienMoi = lichHen.IdNhanVien ?? 0,
            NhanVienList = staffSelectList
        };

        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
        {
            return PartialView("_PhanCongLaiPartial", model);
        }

        return View(model);
    }

    /// <summary>
    /// PHÂN CÔNG LẠI NHÂN VIÊN KỸ THUẬT (POST)
    /// </summary>
    [HttpPost("PhanCongLai/{id:int?}")]
    [HttpPost("PhanCongLai")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> PhanCongLai(AdminPhanCongLaiViewModel input)
    {
        var (userId, userRole) = GetCurrentAdminInfo();
        if (!IsAdminRole(userRole))
        {
            return StatusCode(StatusCodes.Status403Forbidden, "403 Forbidden: Bạn không có quyền phân công lại nhân viên.");
        }

        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

        // Step 3: Đọc dữ liệu LichHen trực tiếp từ SQL Server
        var lichHen = await _context.LichHens
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == input.IdLichHen);

        if (lichHen == null)
        {
            if (isAjax) return Json(new { success = false, message = "Không tìm thấy thông tin lịch hẹn." });
            TempData["ErrorMessage"] = "Không tìm thấy thông tin lịch hẹn.";
            return RedirectToAction("Index");
        }

        // Step 1: Validate nếu IdNhanVienMoi == IdNhanVienHienTai
        int idNhanVienHienTai = lichHen.IdNhanVien ?? 0;
        if (input.IdNhanVienMoi == idNhanVienHienTai && idNhanVienHienTai > 0)
        {
            string msgDuplicate = "Nhân viên được chọn trùng với nhân viên hiện tại.";
            ModelState.AddModelError("IdNhanVienMoi", msgDuplicate);
            if (isAjax) return Json(new { success = false, message = msgDuplicate });

            input.NhanVienList = await GetActiveStaffSelectListAsync(idNhanVienHienTai);
            input.TenKtvHienTai = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công";
            input.MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}";
            input.TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng";
            TempData["ErrorMessage"] = msgDuplicate;
            return View(input);
        }

        // Step 2: Kiểm tra trạng thái lịch hẹn không ở trạng thái Hoàn thành hoặc Đã hủy
        string st = lichHen.TrangThai ?? "";
        if (st.Equals("HoanThanh", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("Hoàn thành", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("DaHoanThanh", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("DaHuy", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("Đã hủy", StringComparison.OrdinalIgnoreCase) ||
            st.Equals("Huy", StringComparison.OrdinalIgnoreCase))
        {
            string msgStatusErr = "Không thể phân công lại lịch hẹn đã hoàn thành hoặc đã hủy.";
            if (isAjax) return Json(new { success = false, message = msgStatusErr });
            TempData["ErrorMessage"] = msgStatusErr;
            return RedirectToAction("Details", new { id = input.IdLichHen });
        }

        if (!ModelState.IsValid)
        {
            if (isAjax) return Json(new { success = false, message = "Vui lòng chọn nhân viên kỹ thuật mới hợp lệ." });
            input.NhanVienList = await GetActiveStaffSelectListAsync(idNhanVienHienTai);
            input.TenKtvHienTai = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công";
            input.MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}";
            input.TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng";
            return View(input);
        }

        var newTech = await _context.NhanViens.FirstOrDefaultAsync(n => n.IdNhanVien == input.IdNhanVienMoi && n.TrangThai == "Hoạt động");
        if (newTech == null)
        {
            string msgTechErr = "Nhân viên được chọn không tồn tại hoặc đã bị khóa.";
            ModelState.AddModelError("IdNhanVienMoi", msgTechErr);
            if (isAjax) return Json(new { success = false, message = msgTechErr });

            input.NhanVienList = await GetActiveStaffSelectListAsync(idNhanVienHienTai);
            input.TenKtvHienTai = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công";
            input.MaPhieu = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}";
            input.TenKhachHang = lichHen.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng";
            TempData["ErrorMessage"] = msgTechErr;
            return View(input);
        }

        string ktvCu = lichHen.IdNhanVienNavigation?.HoTen ?? "Chưa phân công";
        string ktvMoi = newTech.HoTen;

        // Step 4: Cập nhật SQL (Update IdNhanVien của LichHen và PhieuHoTro, không tạo record mới)
        lichHen.IdNhanVien = input.IdNhanVienMoi;
        lichHen.NgayCapNhat = DateTime.Now;
        if (lichHen.IdPhieuNavigation != null)
        {
            lichHen.IdPhieuNavigation.IdNhanVien = input.IdNhanVienMoi;
            lichHen.IdPhieuNavigation.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);
        }

        // Step 5: Cập nhật thông tin log lịch sử hỗ trợ
        var adminStaff = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(n => n.IdNhanVien == userId);
        string adminName = adminStaff?.HoTen ?? "Admin";
        string maPhieuCode = !string.IsNullOrEmpty(lichHen.IdPhieuNavigation?.MaPhieu) ? lichHen.IdPhieuNavigation.MaPhieu : $"PHT{lichHen.IdPhieu:D6}";

        string logText = $"Admin {adminName} đã chuyển lịch {maPhieuCode} từ {ktvCu} sang {ktvMoi}.";
        if (!string.IsNullOrWhiteSpace(input.GhiChu))
        {
            logText += $" Lý do: {input.GhiChu.Trim()}";
        }

        var log = new LichSuHoTro
        {
            IdPhieu = lichHen.IdPhieu,
            IdNhanVien = userId,
            TrangThaiCu = lichHen.TrangThai,
            TrangThaiMoi = lichHen.TrangThai,
            NoiDungCapNhat = logText,
            NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
        };
        _context.LichSuHoTros.Add(log);

        // Step 6: Bắt buộc lưu SQL Server
        await _context.SaveChangesAsync();

        // Step 7: Thông báo thành công và Redirect về /Admin/LichHen/ChiTiet/{id}
        string msgSuccess = "Phân công lại nhân viên thành công.";
        if (isAjax)
        {
            return Json(new
            {
                success = true,
                message = msgSuccess,
                idLichHen = input.IdLichHen,
                tenNhanVien = ktvMoi,
                redirectUrl = Url.Action("Details", "AdminLichHen", new { id = input.IdLichHen })
            });
        }

        TempData["SuccessMessage"] = msgSuccess;
        return RedirectToAction("Details", new { id = input.IdLichHen });
    }

    /// <summary>
    /// Hàm hỗ trợ kiểm tra vai trò Admin
    /// </summary>
    private bool IsAdminRole(string userRole)
    {
        if (User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || User.IsInRole("AdminManager"))
        {
            return true;
        }
        if (!string.IsNullOrEmpty(userRole) &&
            (userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
             userRole.Equals("QuanTriVien", StringComparison.OrdinalIgnoreCase) ||
             userRole.Equals("AdminManager", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }
        return false;
    }

    /// <summary>
    /// Hàm hỗ trợ lấy danh sách KTV đang hoạt động từ SQL Server kèm số lượng lịch hẹn đang xử lý
    /// </summary>
    private async Task<List<SelectListItem>> GetActiveStaffSelectListAsync(int? currentTechId)
    {
        var activeStaff = await _context.NhanViens
            .AsNoTracking()
            .Where(n => n.TrangThai == "Hoạt động" || n.TrangThai == "HoatDong" || n.TrangThai == "Active")
            .ToListAsync();

        var staffListWithCount = new List<(NhanVien Staff, int WorkCount)>();
        foreach (var n in activeStaff)
        {
            int workCount = await _context.LichHens.CountAsync(l =>
                l.IdNhanVien == n.IdNhanVien &&
                l.TrangThai != "Hoàn thành" && l.TrangThai != "DaHoanThanh" && l.TrangThai != "HoanThanh" &&
                l.TrangThai != "Đã hủy" && l.TrangThai != "DaHuy" && l.TrangThai != "Huy");

            staffListWithCount.Add((n, workCount));
        }

        var sortedStaff = staffListWithCount
            .OrderBy(x => x.WorkCount)
            .ThenBy(x => x.Staff.HoTen)
            .ToList();

        var staffSelectList = new List<SelectListItem>();
        foreach (var item in sortedStaff)
        {
            staffSelectList.Add(new SelectListItem
            {
                Value = item.Staff.IdNhanVien.ToString(),
                Text = $"{item.Staff.HoTen}{(string.IsNullOrEmpty(item.Staff.ChucVu) ? "" : " (" + item.Staff.ChucVu + ")")} - Đang xử lý: {item.WorkCount} lịch",
                Selected = (currentTechId.HasValue && currentTechId.Value == item.Staff.IdNhanVien)
            });
        }

        return staffSelectList;
    }

    /// <summary>
    /// 8. AJAX ENDPOINT: Kiểm tra xung đột lịch làm việc KTV
    /// </summary>
    [HttpGet("CheckConflict")]
    public async Task<IActionResult> CheckConflict(
        [FromQuery] int idNhanVien,
        [FromQuery] DateTime start,
        [FromQuery] DateTime end,
        [FromQuery] string hinhThuc = "TrucTiep",
        [FromQuery] int? idLichHen = null)
    {
        if (idNhanVien <= 0 || start >= end)
        {
            return Json(new { isAvailable = false, message = "Dữ liệu thời gian không hợp lệ." });
        }

        var result = await _availabilityService.CheckEmployeeAvailabilityAsync(
            idNhanVien,
            start,
            end,
            hinhThuc,
            idLichHen);

        return Json(new
        {
            isAvailable = result.IsAvailable,
            message = result.Message,
            reasons = result.Reasons
        });
    }

    /// <summary>
    /// 9. XUẤT BÁO CÁO EXCEL (XuatBaoCao / ExportExcel - GET)
    /// </summary>
    [HttpGet("XuatBaoCao")]
    [HttpGet("ExportExcel")]
    public async Task<IActionResult> XuatBaoCao([FromQuery] AdminLichHenFilterInput filter)
    {
        try
        {
            var excelBytes = await _lichHenService.ExportExcelAsync(filter);
            string fileName = $"BaoCao_LichHen_Viettel_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            TempData["ErrorMessage"] = "Có lỗi xảy ra khi xuất báo cáo Excel: " + ex.Message;
            return RedirectToAction("Index");
        }
    }

    /// <summary>
    /// 10. TẠO LỊCH HẸN TRỰC TIẾP DÀNH CHO ADMIN (Create / TaoMoi - GET)
    /// </summary>
    [HttpGet("Create")]
    [HttpGet("TaoMoi")]
    public async Task<IActionResult> Create([FromQuery] int? idPhieu = null)
    {
        var eligibleTickets = await GetEligibleTicketsForAdminAsync();
        var phieuSelectList = eligibleTickets.Select(p => new SelectListItem
        {
            Value = p.IdPhieu.ToString(),
            Text = $"[{(!string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}")}] {p.TieuDe} - Khách: {(p.IdKhachHangNavigation?.HoTen ?? "N/A")}",
            Selected = (idPhieu.HasValue && idPhieu.Value == p.IdPhieu)
        }).ToList();

        var staffSelectList = await GetActiveStaffSelectListAsync(null);

        var selectedPhieu = eligibleTickets.FirstOrDefault(p => idPhieu.HasValue && p.IdPhieu == idPhieu.Value) ?? eligibleTickets.FirstOrDefault();
        string defaultAddress = selectedPhieu?.IdKhachHangNavigation?.DiaChi ?? "";

        var model = new AdminCreateLichHenViewModel
        {
            IdPhieu = selectedPhieu?.IdPhieu ?? 0,
            NgayHen = DateOnly.FromDateTime(DateTime.Today.AddDays(1)),
            GioBatDau = new TimeOnly(8, 0),
            GioKetThuc = new TimeOnly(10, 0),
            HinhThuc = "TrucTiep",
            DiaDiem = defaultAddress,
            PhieuList = phieuSelectList,
            NhanVienList = staffSelectList
        };

        return View(model);
    }

    /// <summary>
    /// 10. TẠO LỊCH HẸN TRỰC TIẾP DÀNH CHO ADMIN (Create / TaoMoi - POST)
    /// </summary>
    [HttpPost("Create")]
    [HttpPost("TaoMoi")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(AdminCreateLichHenViewModel model)
    {
        if (model.NgayHen < DateOnly.FromDateTime(DateTime.Today))
        {
            ModelState.AddModelError("NgayHen", "Ngày hẹn không được chọn trong quá khứ.");
        }

        if (model.GioBatDau >= model.GioKetThuc)
        {
            ModelState.AddModelError("GioKetThuc", "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
        }

        var phieu = await _context.PhieuHoTros
            .Include(p => p.IdKhachHangNavigation)
            .FirstOrDefaultAsync(p => p.IdPhieu == model.IdPhieu);

        if (phieu == null)
        {
            ModelState.AddModelError("IdPhieu", "Không tìm thấy thông tin phiếu hỗ trợ.");
        }

        if (!ModelState.IsValid)
        {
            var firstErr = ModelState.Values.SelectMany(v => v.Errors).FirstOrDefault()?.ErrorMessage ?? "Dữ liệu nhập không hợp lệ.";
            TempData["ErrorMessage"] = firstErr;
            return RedirectToAction("Index");
        }

        var (userId, userRole) = GetCurrentAdminInfo();
        DateTime startDateTime = model.NgayHen.ToDateTime(model.GioBatDau);
        DateTime endDateTime = model.NgayHen.ToDateTime(model.GioKetThuc);

        // Kiểm tra xung đột lịch làm việc nếu chọn KTV
        if (model.IdNhanVien.HasValue && model.IdNhanVien.Value > 0)
        {
            var availResult = await _availabilityService.CheckEmployeeAvailabilityAsync(
                model.IdNhanVien.Value,
                startDateTime,
                endDateTime,
                model.HinhThuc);

            if (!availResult.IsAvailable)
            {
                TempData["ErrorMessage"] = $"Xung đột lịch làm việc KTV: {availResult.Message} ({string.Join("; ", availResult.Reasons)})";
                return RedirectToAction("Index");
            }
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            bool hasKtv = model.IdNhanVien.HasValue && model.IdNhanVien.Value > 0;
            string status = hasKtv ? "DaXacNhan" : "ChoXacNhan";

            var lichHen = new LichHen
            {
                IdPhieu = model.IdPhieu,
                IdNhanVien = hasKtv ? model.IdNhanVien : null,
                NgayHen = model.NgayHen,
                GioBatDau = model.GioBatDau,
                GioKetThuc = model.GioKetThuc,
                HinhThuc = model.HinhThuc,
                DiaChiHoTro = model.DiaDiem?.Trim(),
                GhiChu = model.GhiChu?.Trim(),
                TrangThai = status,
                NgayTao = DateTime.Now,
                NgayXacNhan = hasKtv ? DateTime.Now : null
            };

            _context.LichHens.Add(lichHen);

            // Cập nhật phiếu
            if (phieu != null && hasKtv)
            {
                phieu.IdNhanVien = model.IdNhanVien;
                phieu.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);
            }

            var adminStaff = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(n => n.IdNhanVien == userId);
            string adminName = adminStaff?.HoTen ?? "Admin";
            string maPhieuCode = !string.IsNullOrEmpty(phieu?.MaPhieu) ? phieu.MaPhieu : $"PHT{model.IdPhieu:D6}";

            var log = new LichSuHoTro
            {
                IdPhieu = model.IdPhieu,
                IdNhanVien = userId,
                TrangThaiCu = "Mới tạo",
                TrangThaiMoi = status,
                NoiDungCapNhat = $"Admin {adminName} đã tạo mới lịch hẹn hỗ trợ [{model.NgayHen:dd/MM/yyyy} {model.GioBatDau:HH:mm}-{model.GioKetThuc:HH:mm}] cho phiếu {maPhieuCode}.",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            TempData["SuccessMessage"] = "Tạo mới lịch hẹn hỗ trợ kỹ thuật thành công!";
            return RedirectToAction("Index");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            ModelState.AddModelError("", "Có lỗi xảy ra khi tạo lịch hẹn: " + ex.Message);
            var eligibleTickets = await GetEligibleTicketsForAdminAsync();
            model.PhieuList = eligibleTickets.Select(p => new SelectListItem
            {
                Value = p.IdPhieu.ToString(),
                Text = $"[{(!string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}")}] {p.TieuDe} - Khách: {(p.IdKhachHangNavigation?.HoTen ?? "N/A")}",
                Selected = (model.IdPhieu == p.IdPhieu)
            }).ToList();
            model.NhanVienList = await GetActiveStaffSelectListAsync(model.IdNhanVien);
            return View(model);
        }
    }

    /// <summary>
    /// Helper lấy danh sách các phiếu hỗ trợ chưa hoàn thành/hủy và chưa có lịch hẹn hoạt động
    /// </summary>
    private async Task<List<PhieuHoTro>> GetEligibleTicketsForAdminAsync()
    {
        var activeApptTicketIds = await _context.LichHens
            .Where(l => l.TrangThai != "HoanThanh" && l.TrangThai != "Hoàn thành" && l.TrangThai != "DaHoanThanh" &&
                        l.TrangThai != "DaHuy" && l.TrangThai != "Đã hủy" && l.TrangThai != "Huy")
            .Select(l => l.IdPhieu)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .ToListAsync();

        return await _context.PhieuHoTros
            .AsNoTracking()
            .Include(p => p.IdKhachHangNavigation)
            .Include(p => p.IdDichVuNavigation)
            .Where(p => p.TrangThai != "Hoàn thành" && p.TrangThai != "DaHoanThanh" && p.TrangThai != "HoanThanh" &&
                        p.TrangThai != "Đã hủy" && p.TrangThai != "DaHuy" && p.TrangThai != "Huy")
            .Where(p => !activeApptTicketIds.Contains(p.IdPhieu))
            .OrderByDescending(p => p.IdPhieu)
            .ToListAsync();
    }


    // Helper kiểm tra mã trạng thái
    private static bool MatchStatus(string? status, string target)
    {
        if (string.IsNullOrEmpty(status)) return false;
        if (status.Equals(target, StringComparison.OrdinalIgnoreCase)) return true;

        return target.ToLower() switch
        {
            "choxacnhan" => status == "Chờ xác nhận",
            "daxacnhan" => status == "Đã xác nhận",
            "dangthuchien" => status == "Đang thực hiện",
            "hoanthanh" => status == "Hoàn thành" || status == "DaHoanThanh",
            "dahuy" => status == "Đã hủy",
            _ => false
        };
    }

    // Helper ánh xạ Model sang ViewItem
    private static AdminLichHenItemViewModel MapToItemViewModel(LichHen l)
    {
        var (title, badge, code) = GetStatusInfo(l.TrangThai);
        return new AdminLichHenItemViewModel
        {
            IdLichHen = l.IdLichHen,
            IdPhieu = l.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(l.IdPhieuNavigation?.MaPhieu) ? l.IdPhieuNavigation.MaPhieu : $"PHT{l.IdPhieu:D6}",
            TieuDePhieu = l.IdPhieuNavigation?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            TenKhachHang = l.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            SoDienThoaiKhachHang = l.IdPhieuNavigation?.IdKhachHangNavigation?.SoDienThoai ?? "",
            IdNhanVien = l.IdNhanVien,
            TenNhanVien = l.IdNhanVienNavigation?.HoTen ?? "Chưa phân công KTV",
            NgayHen = l.NgayHen,
            GioBatDau = l.GioBatDau,
            GioKetThuc = l.GioKetThuc,
            HinhThuc = l.HinhThuc ?? "TrucTiep",
            DiaDiem = !string.IsNullOrWhiteSpace(l.DiaChiHoTro) ? l.DiaChiHoTro : (l.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi ?? ""),
            GhiChu = l.GhiChu,
            TrangThaiCode = code,
            TrangThaiTitle = title,
            TrangThaiBadgeClass = badge,
            NgayTao = l.NgayTao,
            LyDoHuy = l.LyDoHuy
        };
    }

    private static (string title, string badgeClass, string code) GetStatusInfo(string? status)
    {
        if (string.IsNullOrEmpty(status)) return ("Chờ xác nhận", "bg-warning text-dark", "ChoXacNhan");

        string st = status.Trim();
        if (st.Equals("ChoXacNhan", StringComparison.OrdinalIgnoreCase) || st.Equals("Chờ xác nhận", StringComparison.OrdinalIgnoreCase))
            return ("Chờ xác nhận", "bg-warning text-dark", "ChoXacNhan");
        if (st.Equals("DaXacNhan", StringComparison.OrdinalIgnoreCase) || st.Equals("Đã xác nhận", StringComparison.OrdinalIgnoreCase))
            return ("Đã xác nhận", "bg-primary", "DaXacNhan");
        if (st.Equals("DangThucHien", StringComparison.OrdinalIgnoreCase) || st.Equals("Đang thực hiện", StringComparison.OrdinalIgnoreCase))
            return ("Đang thực hiện", "bg-info text-dark", "DangThucHien");
        if (st.Equals("HoanThanh", StringComparison.OrdinalIgnoreCase) || st.Equals("Hoàn thành", StringComparison.OrdinalIgnoreCase) || st.Equals("DaHoanThanh", StringComparison.OrdinalIgnoreCase))
            return ("Hoàn thành", "bg-success", "HoanThanh");
        if (st.Equals("DaHuy", StringComparison.OrdinalIgnoreCase) || st.Equals("Đã hủy", StringComparison.OrdinalIgnoreCase) || st.Equals("Huy", StringComparison.OrdinalIgnoreCase))
            return ("Đã hủy", "bg-danger", "DaHuy");

        return (status, "bg-secondary", "ChoXacNhan");
    }
}
