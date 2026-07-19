using Microsoft.AspNetCore.Mvc;

namespace SupportTicketSysterm.Controllers
{
    public class DichVuController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
