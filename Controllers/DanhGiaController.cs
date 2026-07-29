using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportTicketSysterm.Services;
using SupportTicketSysterm.ViewModels;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Controllers
{
    [Authorize(Roles = "Admin,NhanVien,Nhân viên,Nhân viên hỗ trợ")]
    public class DanhGiaController : Controller
    {
        private readonly IDanhGiaService _danhGiaService;

        public DanhGiaController(IDanhGiaService danhGiaService)
        {
            _danhGiaService = danhGiaService;
        }

        private (int UserId, string Role) GetUserInfo()
        {
            var userIdVal = HttpContext.Session.GetInt32("IdNhanVien")
                         ?? HttpContext.Session.GetInt32("UserId")
                         ?? HttpContext.Session.GetInt32("NhanVienId");

            if (!userIdVal.HasValue && User?.Identity?.IsAuthenticated == true)
            {
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(idClaim, out int parsedId)) userIdVal = parsedId;
            }

            var role = HttpContext.Session.GetString("Role")
                    ?? User?.FindFirst(ClaimTypes.Role)?.Value
                    ?? "NhanVien";

            return (userIdVal ?? 0, role);
        }

        [HttpGet]
        [Route("DanhGia/Reply/{id}")]
        [Route("DanhGia/PhanHoiDanhGia/{id}")]
        public async Task<IActionResult> Reply(int id)
        {
            var (userId, role) = GetUserInfo();

            bool canReply = await _danhGiaService.CanUserReplyRatingAsync(id, userId, role);
            if (!canReply)
            {
                return StatusCode(403, "403 Forbidden: Bạn không có quyền phản hồi đánh giá này.");
            }

            var reviewDetails = await _danhGiaService.GetRatingForReplyAsync(id, userId, role);
            if (reviewDetails == null)
            {
                return NotFound();
            }

            var model = new PhanHoiDanhGiaViewModel
            {
                IdDanhGia = reviewDetails.IdDanhGia,
                PhanHoiNhanVien = reviewDetails.PhanHoiNhanVien ?? "",
                IdNhanVienPhanHoi = userId,
                NgayPhanHoi = reviewDetails.NgayPhanHoi,
                ReviewDetails = reviewDetails
            };

            return View("~/Views/Staff/PhanHoiDanhGia.cshtml", model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Route("DanhGia/Reply")]
        [Route("DanhGia/PhanHoiDanhGia")]
        public async Task<IActionResult> Reply(PhanHoiDanhGiaViewModel model)
        {
            var (userId, role) = GetUserInfo();

            if (userId <= 0)
            {
                return Challenge();
            }

            var (success, message, statusCode) = await _danhGiaService.SaveReplyAsync(model.IdDanhGia, model.PhanHoiNhanVien ?? "", userId, role);

            if (!success)
            {
                if (statusCode == 403)
                {
                    return StatusCode(403, message);
                }
                if (statusCode == 404)
                {
                    return NotFound(message);
                }
                TempData["Error"] = message;
                return RedirectToAction("DanhSachDanhGia", "Staff");
            }

            TempData["SuccessMessage"] = message;
            return RedirectToAction("DanhSachDanhGia", "Staff");
        }
    }
}
