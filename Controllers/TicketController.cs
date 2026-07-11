using Microsoft.AspNetCore.Mvc;

namespace SupportTicketSysterm.Controllers
{
    public class TicketController : Controller
    {
        public IActionResult GuiPhieu()
        {
            return View();
        }


    }
}
