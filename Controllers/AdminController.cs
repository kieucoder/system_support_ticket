using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SupportTicketSysterm.Services;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Controllers
{
    public class AdminController : Controller
    {
        private readonly IGeminiService _geminiService;

        public AdminController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpGet]
        [Route("Admin/GeminiDiagnostic")]
        public IActionResult GeminiDiagnostic()
        {
            var vaiTro = HttpContext.Session.GetString("VaiTro");
            // Support "Admin" or "Quản trị viên" roles
            if (string.IsNullOrEmpty(vaiTro) || (vaiTro != "Admin" && vaiTro != "Quản trị viên"))
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            return View();
        }

        [HttpPost]
        [Route("Admin/GeminiDiagnostic/Test")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TestConnection(string testPrompt)
        {
            var vaiTro = HttpContext.Session.GetString("VaiTro");
            if (string.IsNullOrEmpty(vaiTro) || (vaiTro != "Admin" && vaiTro != "Quản trị viên"))
            {
                return Json(new { success = false, message = "Bạn không có quyền thực hiện chức năng này." });
            }

            if (string.IsNullOrWhiteSpace(testPrompt))
            {
                return Json(new { success = false, message = "Vui lòng nhập câu hỏi kiểm thử." });
            }

            var result = await _geminiService.TestConnectionAsync(testPrompt);
            return Json(new { success = result.Success, data = result });
        }
    }
}
