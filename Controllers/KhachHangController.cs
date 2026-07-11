using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace SupportTicketSysterm.Controllers
{
    [Authorize(Roles = "KhachHang")]
    public class KhachHangController : Controller
    {
        public IActionResult TrangChu()
        {
            return View();
        }
    }
}
