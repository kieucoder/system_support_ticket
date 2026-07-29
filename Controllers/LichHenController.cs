using System;
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
using SupportTicketSysterm.Helpers;

namespace SupportTicketSysterm.Controllers;

/// <summary>
/// Controller xử lý chức năng Lịch hẹn dành riêng cho KHÁCH HÀNG.
/// Khách hàng CHỈ được gửi yêu cầu lịch hẹn (Chọn ngày, giờ, hình thức, địa điểm, ghi chú).
/// Không được chọn nhân viên, không được xác nhận hay tự chuyển trạng thái.
/// </summary>
[Authorize(Roles = "KhachHang")]
[Route("LichHen")]
public class LichHenController : Controller
{
    private readonly ILichHenService _lichHenService;
    private readonly TechSupportContext _context;

    public LichHenController(ILichHenService lichHenService, TechSupportContext context)
    {
        _lichHenService = lichHenService;
        _context = context;
    }

    private int? GetCurrentCustomerId()
    {
        var id = HttpContext.Session.GetInt32("IdKhachHang") ?? HttpContext.Session.GetInt32("UserId");
        if (id == null)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int claimId)) id = claimId;
        }
        return id;
    }

    /// <summary>
    /// Trang hiển thị Form tạo yêu cầu Lịch hẹn cho Khách hàng (Hiển thị 2 Cột + AJAX Ticket Cards)
    /// </summary>
    [HttpGet("TaoYeuCau/{idPhieu:int?}")]
    [HttpGet("TaoRequest/{idPhieu:int?}")]
    public async Task<IActionResult> TaoYeuCau(int? idPhieu)
    {
        var idKhachHang = GetCurrentCustomerId();
        if (idKhachHang == null) return RedirectToAction("DangNhap", "Auth");

        // Lấy danh sách tất cả phiếu đủ điều kiện tạo lịch hẹn của Khách hàng
        var phieuList = await _lichHenService.GetEligibleTicketsForCustomerAsync(idKhachHang.Value);

        if (!phieuList.Any())
        {
            var anyUnfinished = await _context.PhieuHoTros
                .AnyAsync(p => p.IdKhachHang == idKhachHang.Value 
                            && p.TrangThai != "DaHoanThanh" 
                            && p.TrangThai != "Hoàn thành" 
                            && p.TrangThai != "DaHuy" 
                            && p.TrangThai != "Đã hủy");

            if (anyUnfinished)
            {
                TempData["ErrorMessage"] = "Các phiếu hỗ trợ của bạn hiện đã được đăng ký lịch hẹn đang chờ/đang xử lý.";
            }
            else
            {
                TempData["ErrorMessage"] = "Bạn chưa có phiếu hỗ trợ nào đang xử lý để đăng ký lịch hẹn.";
            }
            return RedirectToAction("PhieuCuaToi", "Customers");
        }

        int selectedIdPhieu = idPhieu ?? phieuList.First().IdPhieu;
        var selectedPhieu = phieuList.FirstOrDefault(p => p.IdPhieu == selectedIdPhieu) ?? phieuList.First();

        // Lấy danh sách lịch hẹn của các phiếu để kiểm tra trạng thái xác nhận
        var phieuIds = phieuList.Select(p => p.IdPhieu).ToList();
        var apptList = await _context.LichHens
            .Include(l => l.IdNhanVienNavigation)
            .Where(l => l.IdPhieu.HasValue && phieuIds.Contains(l.IdPhieu.Value))
            .ToListAsync();

        var eligibleItems = phieuList.Select(p => {
            var activeAppt = apptList.Where(l => l.IdPhieu == p.IdPhieu).OrderByDescending(l => l.IdLichHen).FirstOrDefault();
            bool isConfirmed = activeAppt != null && (activeAppt.TrangThai == "DaXacNhan" || activeAppt.TrangThai == "Đã xác nhận");
            string ktvName = isConfirmed ? (activeAppt?.IdNhanVienNavigation?.HoTen ?? p.IdNhanVienNavigation?.HoTen ?? "Kỹ thuật viên Viettel") : "Chưa phân công KTV (Chờ Admin xác nhận)";
            string? ktvPhone = isConfirmed ? (activeAppt?.IdNhanVienNavigation?.SoDienThoai ?? p.IdNhanVienNavigation?.SoDienThoai) : null;

            string statusText = LichHenStatusHelper.GetStatusText(p.TrangThai);
            string badgeClass = LichHenStatusHelper.GetStatusBadgeClass(p.TrangThai);
            string iconClass = LichHenStatusHelper.GetStatusIcon(p.TrangThai);

            return new PhieuEligibleItem
            {
                IdPhieu = p.IdPhieu,
                MaPhieu = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}",
                TieuDe = p.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
                TenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
                TrangThaiPhieu = statusText,
                TrangThaiBadgeClass = badgeClass,
                TrangThaiIcon = iconClass,
                NgayTao = p.NgayTao,
                DiaChi = p.IdKhachHangNavigation?.DiaChi ?? "",
                TenNhanVien = ktvName,
                SoDienThoaiNV = ktvPhone,
                IsConfirmed = isConfirmed,
                IsSelected = (p.IdPhieu == selectedIdPhieu)
            };
        }).ToList();

        var selectedItem = eligibleItems.FirstOrDefault(i => i.IdPhieu == selectedIdPhieu) ?? eligibleItems.First();

        var viewModel = new TaoLichHenViewModel
        {
            IdPhieu = selectedPhieu.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(selectedPhieu.MaPhieu) ? selectedPhieu.MaPhieu : $"PHT{selectedPhieu.IdPhieu:D6}",
            TieuDe = selectedPhieu.TieuDe,
            TenKhachHang = selectedPhieu.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            TenNhanVien = selectedItem.TenNhanVien,
            SoDienThoaiNV = selectedItem.SoDienThoaiNV,
            IsConfirmed = selectedItem.IsConfirmed,
            TenDichVu = selectedPhieu.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
            TrangThaiPhieu = selectedItem.TrangThaiPhieu,
            TrangThaiBadgeClass = selectedItem.TrangThaiBadgeClass,
            TrangThaiIcon = selectedItem.TrangThaiIcon,
            NgayHen = DateOnly.FromDateTime(DateTime.Today.AddDays(1)),
            GioBatDau = new TimeOnly(8, 0),
            GioKetThuc = new TimeOnly(10, 0),
            DiaChiHoTro = selectedPhieu.IdKhachHangNavigation?.DiaChi ?? "",
            GhiChu = "",
            TrangThai = selectedItem.IsConfirmed ? "DaXacNhan" : "ChoXacNhan",
            DanhSachPhieuEligible = eligibleItems,
            DanhSachPhieu = eligibleItems.Select(p => new SelectListItem
            {
                Value = p.IdPhieu.ToString(),
                Text = $"{p.MaPhieu} - {p.TieuDe}",
                Selected = (p.IdPhieu == selectedIdPhieu)
            }).ToList()
        };

        return View("~/Views/Ticket/TaoLichHen.cshtml", viewModel);
    }

    /// <summary>
    /// API JSON lấy tóm tắt thông tin phiếu bằng AJAX khi Khách hàng click chọn Card ở Cột Trái
    /// </summary>
    [HttpGet("GetTicketSummary/{idPhieu:int}")]
    public async Task<IActionResult> GetTicketSummary(int idPhieu)
    {
        var idKhachHang = GetCurrentCustomerId();
        if (idKhachHang == null) return Unauthorized(new { success = false, message = "Phiên làm việc hết hạn" });

        var phieu = await _context.PhieuHoTros
            .Include(p => p.IdDichVuNavigation)
            .Include(p => p.IdKhachHangNavigation)
            .Include(p => p.IdNhanVienNavigation)
            .Include(p => p.LichHens)
                .ThenInclude(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(p => p.IdPhieu == idPhieu && p.IdKhachHang == idKhachHang.Value);

        if (phieu == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy phiếu hỗ trợ" });
        }

        var activeAppt = phieu.LichHens.OrderByDescending(l => l.IdLichHen).FirstOrDefault();
        bool isConfirmed = activeAppt != null && (activeAppt.TrangThai == "DaXacNhan" || activeAppt.TrangThai == "Đã xác nhận");
        string ktvName = isConfirmed ? (activeAppt?.IdNhanVienNavigation?.HoTen ?? phieu.IdNhanVienNavigation?.HoTen ?? "Kỹ thuật viên Viettel") : "Chưa phân công KTV (Chờ Admin xác nhận)";
        string? ktvPhone = isConfirmed ? (activeAppt?.IdNhanVienNavigation?.SoDienThoai ?? phieu.IdNhanVienNavigation?.SoDienThoai) : null;

        string statusText = LichHenStatusHelper.GetStatusText(phieu.TrangThai);
        string badgeClass = LichHenStatusHelper.GetStatusBadgeClass(phieu.TrangThai);
        string iconClass = LichHenStatusHelper.GetStatusIcon(phieu.TrangThai);

        string apptStatus = activeAppt?.TrangThai ?? "ChoXacNhan";
        string apptStatusText = LichHenStatusHelper.GetStatusText(apptStatus);
        string apptBadgeClass = LichHenStatusHelper.GetStatusBadgeClass(apptStatus);
        string apptIconClass = LichHenStatusHelper.GetStatusIcon(apptStatus);

        return Json(new
        {
            success = true,
            idPhieu = phieu.IdPhieu,
            maPhieu = !string.IsNullOrEmpty(phieu.MaPhieu) ? phieu.MaPhieu : $"PHT{phieu.IdPhieu:D6}",
            tieuDe = phieu.TieuDe ?? "Phiếu hỗ trợ kỹ thuật",
            tenDichVu = phieu.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
            trangThaiPhieu = statusText,
            trangThaiBadgeClass = badgeClass,
            trangThaiIcon = iconClass,
            trangThaiLich = apptStatus,
            trangThaiLichText = apptStatusText,
            trangThaiLichBadgeClass = apptBadgeClass,
            trangThaiLichIcon = apptIconClass,
            isConfirmed = isConfirmed,
            tenKhachHang = phieu.IdKhachHangNavigation?.HoTen ?? "Khách hàng",
            tenNhanVien = ktvName,
            soDienThoaiNV = ktvPhone,
            diaChiHoTro = phieu.IdKhachHangNavigation?.DiaChi ?? "",
            ngayTao = phieu.NgayTao?.ToString("dd/MM/yyyy") ?? ""
        });
    }

    /// <summary>
    /// Xử lý Submit form yêu cầu Lịch hẹn từ Khách hàng dạng AJAX SPA (Trả về JSON, không chuyển trang)
    /// </summary>
    [HttpPost("TaoYeuCau/{idPhieu:int?}")]
    [HttpPost("TaoRequest/{idPhieu:int?}")]
    [HttpPost("TaoLichHen/{idPhieu:int?}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> TaoYeuCau([FromForm] TaoLichHenViewModel model)
    {
        var idKhachHang = GetCurrentCustomerId();
        if (idKhachHang == null)
        {
            return Unauthorized(new { success = false, message = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." });
        }

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(msg => !string.IsNullOrEmpty(msg))
                .ToList();

            return Json(new { success = false, message = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.", errors = errors });
        }

        try
        {
            var dto = new CreateLichHenRequestDto
            {
                IdPhieu = model.IdPhieu,
                ThoiGianBatDau = model.NgayHen.ToDateTime(model.GioBatDau),
                ThoiGianKetThuc = model.NgayHen.ToDateTime(model.GioKetThuc),
                HinhThuc = "TrucTiep",
                DiaDiem = model.DiaChiHoTro,
                GhiChu = model.GhiChu
            };

            var lichHen = await _lichHenService.CreateAppointmentRequestAsync(dto, idKhachHang.Value);

            // Nạp lại chi tiết bản ghi thật vừa lưu trực tiếp từ SQL Server
            var dbLichHen = await _context.LichHens
                .AsNoTracking()
                .Include(l => l.IdPhieuNavigation)
                    .ThenInclude(p => p.IdDichVuNavigation)
                .Include(l => l.IdPhieuNavigation)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .Include(l => l.IdNhanVienNavigation)
                .FirstOrDefaultAsync(l => l.IdLichHen == lichHen.IdLichHen);

            var resultData = new
            {
                idLichHen = dbLichHen?.IdLichHen ?? lichHen.IdLichHen,
                maLichHen = $"LH{(dbLichHen?.IdLichHen ?? lichHen.IdLichHen):D6}",
                idPhieu = dbLichHen?.IdPhieu ?? model.IdPhieu,
                maPhieu = dbLichHen?.IdPhieuNavigation?.MaPhieu ?? $"PHT{(dbLichHen?.IdPhieu ?? model.IdPhieu):D6}",
                tieuDePhieu = dbLichHen?.IdPhieuNavigation?.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
                tenDichVu = dbLichHen?.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
                ngayHen = dbLichHen?.NgayHen?.ToString("dd/MM/yyyy") ?? model.NgayHen.ToString("dd/MM/yyyy"),
                khungGio = $"{dbLichHen?.GioBatDau:hh\\:mm} - {dbLichHen?.GioKetThuc:hh\\:mm}",
                trangThai = dbLichHen?.TrangThai ?? "ChoXacNhan",
                trangThaiText = LichHenStatusHelper.GetStatusText(dbLichHen?.TrangThai ?? "ChoXacNhan"),
                trangThaiBadgeClass = LichHenStatusHelper.GetStatusBadgeClass(dbLichHen?.TrangThai ?? "ChoXacNhan"),
                trangThaiIcon = LichHenStatusHelper.GetStatusIcon(dbLichHen?.TrangThai ?? "ChoXacNhan"),
                diaChi = dbLichHen?.DiaChiHoTro ?? model.DiaChiHoTro,
                ghiChu = dbLichHen?.GhiChu ?? model.GhiChu ?? ""
            };

            return Json(new
            {
                success = true,
                message = "Yêu cầu lịch hẹn của bạn đã được gửi thành công. Kỹ thuật viên sẽ xác nhận trong thời gian sớm nhất.",
                idLichHen = resultData.idLichHen,
                data = resultData
            });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// API JSON lấy chi tiết một lịch hẹn từ SQL Server
    /// </summary>
    [HttpGet("GetAppointmentDetail/{idLichHen:int}")]
    public async Task<IActionResult> GetAppointmentDetail(int idLichHen)
    {
        var idKhachHang = GetCurrentCustomerId();
        if (idKhachHang == null) return Unauthorized(new { success = false, message = "Phiên làm việc hết hạn." });

        var dbLichHen = await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == idLichHen && l.IdPhieuNavigation != null && l.IdPhieuNavigation.IdKhachHang == idKhachHang.Value);

        if (dbLichHen == null) return NotFound(new { success = false, message = "Không tìm thấy thông tin lịch hẹn." });

        return Json(new
        {
            success = true,
            data = new
            {
                idLichHen = dbLichHen.IdLichHen,
                maLichHen = $"LH{dbLichHen.IdLichHen:D6}",
                idPhieu = dbLichHen.IdPhieu,
                maPhieu = dbLichHen.IdPhieuNavigation?.MaPhieu ?? $"PHT{dbLichHen.IdPhieu:D6}",
                tieuDePhieu = dbLichHen.IdPhieuNavigation?.TieuDe ?? "Phiếu hỗ trợ kỹ thuật",
                tenDichVu = dbLichHen.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
                ngayHen = dbLichHen.NgayHen?.ToString("dd/MM/yyyy") ?? "",
                khungGio = $"{dbLichHen.GioBatDau:hh\\:mm} - {dbLichHen.GioKetThuc:hh\\:mm}",
                trangThai = dbLichHen.TrangThai ?? "ChoXacNhan",
                trangThaiText = LichHenStatusHelper.GetStatusText(dbLichHen.TrangThai),
                trangThaiBadgeClass = LichHenStatusHelper.GetStatusBadgeClass(dbLichHen.TrangThai),
                trangThaiIcon = LichHenStatusHelper.GetStatusIcon(dbLichHen.TrangThai),
                diaChi = dbLichHen.DiaChiHoTro ?? "",
                ghiChu = dbLichHen.GhiChu ?? ""
            }
        });
    }

    /// <summary>
    /// API JSON lấy danh sách phiếu đủ điều kiện đặt lịch mới nhất từ SQL Server
    /// </summary>
    [HttpGet("GetEligibleTicketsList")]
    public async Task<IActionResult> GetEligibleTicketsList()
    {
        var idKhachHang = GetCurrentCustomerId();
        if (idKhachHang == null) return Unauthorized(new { success = false, message = "Phiên làm việc hết hạn." });

        var phieuList = await _lichHenService.GetEligibleTicketsForCustomerAsync(idKhachHang.Value);
        var phieuIds = phieuList.Select(p => p.IdPhieu).ToList();

        var apptList = await _context.LichHens
            .Include(l => l.IdNhanVienNavigation)
            .Where(l => l.IdPhieu.HasValue && phieuIds.Contains(l.IdPhieu.Value))
            .ToListAsync();

        var items = phieuList.Select(p => {
            var activeAppt = apptList.Where(l => l.IdPhieu == p.IdPhieu).OrderByDescending(l => l.IdLichHen).FirstOrDefault();
            bool isConfirmed = activeAppt != null && (activeAppt.TrangThai == "DaXacNhan" || activeAppt.TrangThai == "Đã xác nhận");
            string ktvName = isConfirmed ? (activeAppt?.IdNhanVienNavigation?.HoTen ?? p.IdNhanVienNavigation?.HoTen ?? "Kỹ thuật viên Viettel") : "Chưa phân công KTV (Chờ Admin xác nhận)";
            string? ktvPhone = isConfirmed ? (activeAppt?.IdNhanVienNavigation?.SoDienThoai ?? p.IdNhanVienNavigation?.SoDienThoai) : null;

            return new
            {
                idPhieu = p.IdPhieu,
                maPhieu = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}",
                tieuDe = p.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
                tenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
                trangThaiPhieu = LichHenStatusHelper.GetStatusText(p.TrangThai),
                trangThaiBadgeClass = LichHenStatusHelper.GetStatusBadgeClass(p.TrangThai),
                trangThaiIcon = LichHenStatusHelper.GetStatusIcon(p.TrangThai),
                ngayTao = p.NgayTao?.ToString("dd/MM/yyyy") ?? "",
                diaChi = p.IdKhachHangNavigation?.DiaChi ?? "",
                tenNhanVien = ktvName,
                soDienThoaiNV = ktvPhone,
                isConfirmed = isConfirmed
            };
        }).ToList();

        return Json(new { success = true, items = items });
    }

    /// <summary>
    /// Danh sách lịch hẹn của Khách hàng
    /// </summary>
    [HttpGet("DanhSach")]
    [HttpGet("LichCuaToi")]
    public async Task<IActionResult> DanhSach()
    {
        var idKhachHang = GetCurrentCustomerId();
        if (idKhachHang == null) return RedirectToAction("DangNhap", "Auth");

        var list = await _lichHenService.GetCustomerAppointmentsAsync(idKhachHang.Value);
        return View(list);
    }

    private static string FormatTrangThaiText(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "Chờ tiếp nhận";
        return status.Trim() switch
        {
            "ChoTiepNhan" => "Chờ tiếp nhận",
            "DangXuLy" => "Đang xử lý",
            "ChoXacNhan" => "Chờ xác nhận",
            "DaXacNhan" => "Đã xác nhận",
            "HoanThanh" or "DaHoanThanh" => "Hoàn thành",
            "DaHuy" => "Đã hủy",
            _ => status
        };
    }

    private static string GetTrangThaiBadgeClass(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "bg-warning text-dark";
        return status.Trim() switch
        {
            "ChoTiepNhan" or "Chờ tiếp nhận" or "ChoXacNhan" or "Chờ xác nhận" => "bg-warning text-dark",
            "DangXuLy" or "Đang xử lý" => "bg-primary text-white",
            "DaXacNhan" or "Đã xác nhận" or "HoanThanh" or "DaHoanThanh" or "Hoàn thành" => "bg-success text-white",
            "DaHuy" or "Đã hủy" => "bg-danger text-white",
            _ => "bg-secondary text-white"
        };
    }

    private static string GetTrangThaiIcon(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "bi-clock-history";
        return status.Trim() switch
        {
            "ChoTiepNhan" or "Chờ tiếp nhận" => "bi-clock-history",
            "DangXuLy" or "Đang xử lý" => "bi-gear-fill",
            "ChoXacNhan" or "Chờ xác nhận" => "bi-hourglass-split",
            "DaXacNhan" or "Đã xác nhận" or "HoanThanh" or "DaHoanThanh" or "Hoàn thành" => "bi-check-circle-fill",
            "DaHuy" or "Đã hủy" => "bi-x-circle-fill",
            _ => "bi-info-circle"
        };
    }

    private async Task<IActionResult> RebindViewModelAndReturnAsync(int idKhachHang, TaoLichHenViewModel model)
    {
        var phieuList = await _lichHenService.GetEligibleTicketsForCustomerAsync(idKhachHang);

        model.DanhSachPhieuEligible = phieuList.Select(p => new PhieuEligibleItem
        {
            IdPhieu = p.IdPhieu,
            MaPhieu = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}",
            TieuDe = p.TieuDe ?? "Yêu cầu hỗ trợ kỹ thuật",
            TenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật Viettel",
            TrangThaiPhieu = FormatTrangThaiText(p.TrangThai),
            TrangThaiBadgeClass = GetTrangThaiBadgeClass(p.TrangThai),
            TrangThaiIcon = GetTrangThaiIcon(p.TrangThai),
            NgayTao = p.NgayTao,
            DiaChi = p.IdKhachHangNavigation?.DiaChi ?? "",
            TenNhanVien = p.IdNhanVienNavigation?.HoTen ?? "Chưa phân công KTV",
            IsSelected = (p.IdPhieu == model.IdPhieu)
        }).ToList();

        model.DanhSachPhieu = model.DanhSachPhieuEligible.Select(p => new SelectListItem
        {
            Value = p.IdPhieu.ToString(),
            Text = $"{p.MaPhieu} - {p.TieuDe}",
            Selected = (p.IdPhieu == model.IdPhieu)
        }).ToList();

        return View("~/Views/Ticket/TaoLichHen.cshtml", model);
    }
}
