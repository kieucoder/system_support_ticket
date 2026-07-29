using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Services;

namespace SupportTicketSysterm.Controllers;

/// <summary>
/// Controller Quản lý Lịch hẹn dành riêng cho ADMIN / NHÂN VIÊN KỸ THUẬT.
/// Bao gồm các chức năng nghiệp vụ: Xem toàn bộ lịch, Gọi Availability Service kiểm tra rảnh/trùng lịch,
/// Phân công KTV, Xác nhận, Đổi lịch, Hủy lịch, và Hoàn thành lịch hẹn.
/// </summary>
[Authorize(Roles = "NhanVien,Admin,QuanTriVien,Staff,KyThuat")]
[Route("Staff/LichHen")]
[Route("StaffLichHen")]
public class StaffLichHenController : Controller
{
    private readonly ILichHenService _lichHenService;
    private readonly IAvailabilityService _availabilityService;

    public StaffLichHenController(
        ILichHenService lichHenService,
        IAvailabilityService availabilityService)
    {
        _lichHenService = lichHenService;
        _availabilityService = availabilityService;
    }

    private (int idUser, string role) GetCurrentStaffInfo()
    {
        var id = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId");
        if (id == null)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int claimId)) id = claimId;
        }

        string role = User.FindFirst(ClaimTypes.Role)?.Value ?? "NhanVien";
        return (id ?? 0, role);
    }

    /// <summary>
    /// Danh sách toàn bộ Lịch hẹn (Dành cho Admin & Staff)
    /// </summary>
    [HttpGet("")]
    [HttpGet("DanhSach")]
    public async Task<IActionResult> DanhSach([FromQuery] LichHenFilterDto filter)
    {
        var (userId, userRole) = GetCurrentStaffInfo();

        var appointments = await _lichHenService.GetAppointmentsForUserAsync(userId, userRole, filter);
        ViewBag.Filter = filter;

        return View("~/Views/Staff/QuanLyLichHen.cshtml", appointments);
    }

    /// <summary>
    /// API Gọi Availability Service kiểm tra khả năng làm việc của nhân viên
    /// </summary>
    [HttpPost("KiemTraKhaNang")]
    [HttpPost("CheckAvailability")]
    public async Task<IActionResult> KiemTraKhaNang(int nhanVienId, DateTime start, DateTime end, string hinhThuc = "TrucTiep", int? idLichHen = null)
    {
        try
        {
            var result = await _availabilityService.CheckEmployeeAvailabilityAsync(nhanVienId, start, end, hinhThuc, idLichHen);
            return Json(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// API Gợi ý khung giờ rảnh của nhân viên trong ngày
    /// </summary>
    [HttpGet("GoiYKhungGio")]
    public async Task<IActionResult> GoiYKhungGio(int nhanVienId, DateTime date)
    {
        try
        {
            var slots = await _availabilityService.SuggestAvailableSlotsAsync(nhanVienId, date);
            return Json(new { success = true, slots = slots });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// API Gợi ý danh sách KTV rảnh trong khung giờ
    /// </summary>
    [HttpGet("GoiYNhanVien")]
    public async Task<IActionResult> GoiYNhanVien(DateTime start, DateTime end, string hinhThuc = "TrucTiep")
    {
        try
        {
            var staffList = await _availabilityService.SuggestAvailableEmployeesAsync(start, end, hinhThuc);
            var data = staffList.Select(s => new { s.IdNhanVien, s.HoTen, s.ChucVu, s.SoDienThoai });
            return Json(new { success = true, staff = data });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Action Phân công KTV và Xác nhận lịch hẹn
    /// </summary>
    [HttpPost("PhanCong")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> PhanCong(AssignLichHenDto dto)
    {
        var (userId, userRole) = GetCurrentStaffInfo();

        if (!ModelState.IsValid)
        {
            TempData["ErrorMessage"] = "Dữ liệu phân công không hợp lệ.";
            return RedirectToAction("DanhSach");
        }

        try
        {
            await _lichHenService.AssignAndConfirmAppointmentAsync(dto, userId, userRole);
            TempData["SuccessMessage"] = "Phân công nhân viên và xác nhận lịch hẹn thành công!";
        }
        catch (Exception ex)
        {
            TempData["ErrorMessage"] = "Lỗi phân công: " + ex.Message;
        }

        return RedirectToAction("DanhSach");
    }

    /// <summary>
    /// Action Đổi lịch hẹn (Hủy lịch cũ -> Tạo lịch mới ChoXacNhan)
    /// </summary>
    [HttpPost("DoiLich")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DoiLich(RescheduleLichHenDto dto)
    {
        var (userId, userRole) = GetCurrentStaffInfo();

        if (!ModelState.IsValid)
        {
            TempData["ErrorMessage"] = "Dữ liệu đổi lịch không hợp lệ.";
            return RedirectToAction("DanhSach");
        }

        try
        {
            var newAppt = await _lichHenService.RescheduleAppointmentAsync(dto, userId, userRole);
            TempData["SuccessMessage"] = $"Đổi lịch hẹn thành công! Đã tạo lịch hẹn mới #{newAppt.IdLichHen} trạng thái Chờ xác nhận.";
        }
        catch (Exception ex)
        {
            TempData["ErrorMessage"] = "Lỗi đổi lịch: " + ex.Message;
        }

        return RedirectToAction("DanhSach");
    }

    /// <summary>
    /// Action Hủy lịch hẹn
    /// </summary>
    [HttpPost("HuyLich")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> HuyLich(CancelLichHenDto dto)
    {
        var (userId, userRole) = GetCurrentStaffInfo();

        if (!ModelState.IsValid)
        {
            TempData["ErrorMessage"] = "Vui lòng nhập lý do hủy lịch.";
            return RedirectToAction("DanhSach");
        }

        try
        {
            await _lichHenService.CancelAppointmentAsync(dto, userId, userRole);
            TempData["SuccessMessage"] = "Hủy lịch hẹn thành công!";
        }
        catch (Exception ex)
        {
            TempData["ErrorMessage"] = "Lỗi hủy lịch: " + ex.Message;
        }

        return RedirectToAction("DanhSach");
    }

    /// <summary>
    /// Action Hoàn thành lịch hẹn
    /// </summary>
    [HttpPost("HoanThanh")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> HoanThanh(int idLichHen)
    {
        var (userId, userRole) = GetCurrentStaffInfo();

        try
        {
            await _lichHenService.CompleteAppointmentAsync(idLichHen, userId, userRole);
            TempData["SuccessMessage"] = "Cập nhật hoàn thành lịch hẹn thành công!";
        }
        catch (Exception ex)
        {
            TempData["ErrorMessage"] = "Lỗi hoàn thành lịch: " + ex.Message;
        }

        return RedirectToAction("DanhSach");
    }

    /// <summary>
    /// Action xem chi tiết lịch hẹn (Kiểm tra 403 Forbidden nếu không thuộc quyền quản lý)
    /// </summary>
    [HttpGet("ChiTiet/{id:int}")]
    [HttpGet("Details/{id:int}")]
    public async Task<IActionResult> ChiTiet(int id)
    {
        var (userId, userRole) = GetCurrentStaffInfo();
        try
        {
            var appointment = await _lichHenService.GetByIdForUserAsync(id, userId, userRole);
            if (appointment == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy lịch hẹn." });
            }
            return Json(new { success = true, data = appointment });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
        }
    }
}
