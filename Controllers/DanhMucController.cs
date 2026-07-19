using Microsoft.AspNetCore.Mvc;

namespace SupportTicketSysterm.Controllers
{
    public class DanhMucController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
