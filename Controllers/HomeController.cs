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
            return RedirectToAction("TrangChu", "Customers");
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [HttpGet]
        [Route("Home/LienHe")]
        public IActionResult LienHe()
        {
            return View(new SupportTicketSysterm.Models.GuiLienHeViewModel());
        }

        [HttpGet]
        [Route("Home/HuongDan")]
        public IActionResult HuongDan()
        {
            return View();
        }



        [HttpGet]
        [Route("Home/GioiThieu")]
        public IActionResult GioiThieu()
        {
            return View();
        }

        [HttpGet]
        [Route("Home/TinTuc")]
        public IActionResult TinTuc()
        {
            return View();
        }

        [HttpGet]
        [Route("Home/ChiTietTin1")]
        public IActionResult ChiTietTin1() => View("~/Views/Home/TinTuc/ChiTietTin1.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin2")]
        public IActionResult ChiTietTin2() => View("~/Views/Home/TinTuc/ChiTietTin2.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin3")]
        public IActionResult ChiTietTin3() => View("~/Views/Home/TinTuc/ChiTietTin3.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin4")]
        public IActionResult ChiTietTin4() => View("~/Views/Home/TinTuc/ChiTietTin4.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin5")]
        public IActionResult ChiTietTin5() => View("~/Views/Home/TinTuc/ChiTietTin5.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin6")]
        public IActionResult ChiTietTin6() => View("~/Views/Home/TinTuc/ChiTietTin6.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin7")]
        public IActionResult ChiTietTin7() => View("~/Views/Home/TinTuc/ChiTietTin7.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin8")]
        public IActionResult ChiTietTin8() => View("~/Views/Home/TinTuc/ChiTietTin8.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin9")]
        public IActionResult ChiTietTin9() => View("~/Views/Home/TinTuc/ChiTietTin9.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin10")]
        public IActionResult ChiTietTin10() => View("~/Views/Home/TinTuc/ChiTietTin10.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin11")]
        public IActionResult ChiTietTin11() => View("~/Views/Home/TinTuc/ChiTietTin11.cshtml");

        [HttpGet]
        [Route("Home/ChiTietTin12")]
        public IActionResult ChiTietTin12() => View("~/Views/Home/TinTuc/ChiTietTin12.cshtml");



        [HttpGet]
        [Route("Home/DieuKhoanSuDung")]
        public IActionResult DieuKhoanSuDung()
        {
            return View();
        }



        [HttpGet]
        [Route("Home/FAQ")]
        public IActionResult FAQ()
        {
            return View();
        }

        [HttpGet]
        [Route("Home/HuongDanTaoPhieu")]
        public IActionResult HuongDanTaoPhieu()
        {
            return View();
        }

        [HttpGet]
        [Route("Home/ThongBaoBaoTri")]
        public IActionResult ThongBaoBaoTri()
        {
            return View();
        }

        [HttpGet]
        [Route("Home/MeoXuLyMang")]
        public IActionResult MeoXuLyMang()
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
