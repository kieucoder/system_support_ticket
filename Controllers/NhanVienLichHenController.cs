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
/// Controller Quản lý Lịch Hẹn dành riêng cho NHÂN VIÊN KỸ THUẬT (Role: NhanVien, Staff, KyThuat)
/// URL chính: /NhanVien/LichHen/Index
/// </summary>
[Authorize(Roles = "NhanVien,Staff,KyThuat,Admin,QuanTriVien")]
[Route("NhanVien/LichHen")]
[Route("NhanVienLichHen")]
public class NhanVienLichHenController : Controller
{
    private readonly ILichHenNhanVienService _lichHenNhanVienService;

    public NhanVienLichHenController(ILichHenNhanVienService lichHenNhanVienService)
    {
        _lichHenNhanVienService = lichHenNhanVienService;
    }

    private int GetCurrentNhanVienId()
    {
        var id = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId");
        if (id == null || id.Value == 0)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("UserId")?.Value;
            if (int.TryParse(claim, out int claimId)) id = claimId;
        }
        return id ?? 0;
    }

    /// <summary>
    /// 1. DANH SÁCH LỊCH HẸN CỦA CHÍNH NHÂN VIÊN (Index - GET)
    /// </summary>
    [HttpGet("")]
    [HttpGet("Index")]
    public async Task<IActionResult> Index([FromQuery] NhanVienLichHenFilterInput filter)
    {
        int nhanVienId = GetCurrentNhanVienId();
        if (nhanVienId <= 0)
        {
            TempData["ErrorMessage"] = "Không xác định được thông tin nhân viên. Vui lòng đăng nhập lại.";
            return RedirectToAction("DangNhap", "Auth");
        }

        var viewModel = await _lichHenNhanVienService.GetListViewModelAsync(nhanVienId, filter);
        return View("~/Views/NhanVien/LichHen/Index.cshtml", viewModel);
    }

    /// <summary>
    /// 2. XEM CHI TIẾT LỊCH HẸN (GetDetail / ChiTiet - GET JSON)
    /// </summary>
    [HttpGet("GetDetail/{id:int}")]
    [HttpGet("ChiTiet/{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        int nhanVienId = GetCurrentNhanVienId();
        try
        {
            var detail = await _lichHenNhanVienService.GetDetailAsync(id, nhanVienId);
            return Json(new { success = true, data = detail });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// 3. YÊU CẦU ĐỔI LỊCH HẸN (YeuCauDoiLich - POST)
    /// </summary>
    [HttpPost("YeuCauDoiLich")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> YeuCauDoiLich(YeuCauDoiLichInputDto input)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        int nhanVienId = GetCurrentNhanVienId();

        if (!ModelState.IsValid)
        {
            string errStr = "Vui lòng điền đầy đủ các trường yêu cầu đổi lịch.";
            if (isAjax) return Json(new { success = false, message = errStr });
            TempData["ErrorMessage"] = errStr;
            return RedirectToAction("Index");
        }

        var result = await _lichHenNhanVienService.YeuCauDoiLichAsync(input, nhanVienId);
        if (isAjax)
        {
            return Json(new { success = result.Success, message = result.Message });
        }

        if (result.Success) TempData["SuccessMessage"] = result.Message;
        else TempData["ErrorMessage"] = result.Message;

        return RedirectToAction("Index");
    }

    /// <summary>
    /// 4. HỦY LỊCH HẸN (HuyLichHen - POST)
    /// </summary>
    [HttpPost("HuyLichHen")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> HuyLichHen(HuyLichNhanVienInputDto input)
    {
        bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
        int nhanVienId = GetCurrentNhanVienId();

        if (!ModelState.IsValid)
        {
            string errStr = "Vui lòng nhập lý do hủy lịch hẹn.";
            if (isAjax) return Json(new { success = false, message = errStr });
            TempData["ErrorMessage"] = errStr;
            return RedirectToAction("Index");
        }

        var result = await _lichHenNhanVienService.HuyLichAsync(input.LichHenId, nhanVienId, input.LyDo);
        if (isAjax)
        {
            return Json(new { success = result.Success, message = result.Message });
        }

        if (result.Success) TempData["SuccessMessage"] = result.Message;
        else TempData["ErrorMessage"] = result.Message;

        return RedirectToAction("Index");
    }

    /// <summary>
    /// 5. LỊCH SỬ THAY ĐỔI LỊCH HẸN (LichSu - GET)
    /// </summary>
    [HttpGet("LichSu/{id:int}")]
    public async Task<IActionResult> LichSu(int id)
    {
        int nhanVienId = GetCurrentNhanVienId();
        var logs = await _lichHenNhanVienService.GetLichSuAsync(id, nhanVienId);
        return Json(new { success = true, logs = logs });
    }
}
