using Microsoft.AspNetCore.Mvc;
using SupportTicketSysterm.Models;
using System.Diagnostics;

namespace SupportTicketSysterm.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? HttpContext.Session.GetString("Role");
                if (role == "Admin" || role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
                {
                    return RedirectToAction("Dashboard", "Staff");
                }
                else if (role == "KhachHang")
                {
                    return RedirectToAction("TrangChu", "KhachHang");
                }
            }
            return RedirectToAction("DangNhap", "Auth");
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
