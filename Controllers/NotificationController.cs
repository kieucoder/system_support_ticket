using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SupportTicketSysterm.Services;

namespace SupportTicketSysterm.Controllers
{
    public class NotificationController : Controller
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // GET: /Notification/Index
        [HttpGet]
        public async Task<IActionResult> Index(string? search = null, string? type = null)
        {
            int? idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (!idKhachHang.HasValue || idKhachHang.Value <= 0)
            {
                // Guest / Not logged in: Redirect to login with returnUrl
                return RedirectToAction("DangNhap", "Auth", new { returnUrl = "/Notification/Index" });
            }

            var notifications = await _notificationService.GetNotificationsAsync(idKhachHang.Value, search, type);
            
            ViewData["SearchKeyword"] = search ?? "";
            ViewData["SelectedType"] = type ?? "All";
            ViewData["TotalCount"] = notifications.Count;

            return View(notifications);
        }

        // GET: /Notification/GetHeaderNotifications
        [HttpGet]
        public async Task<IActionResult> GetHeaderNotifications()
        {
            int? idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (!idKhachHang.HasValue || idKhachHang.Value <= 0)
            {
                return Json(new { success = false, count = 0, items = new object[] { } });
            }

            var topList = await _notificationService.GetTopNotificationsAsync(idKhachHang.Value, 10);
            int totalCount = await _notificationService.GetNotificationCountAsync(idKhachHang.Value);

            return Json(new
            {
                success = true,
                count = totalCount,
                items = topList
            });
        }

        // GET: /Notification/GetNotifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications(string? search = null, string? type = null)
        {
            int? idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (!idKhachHang.HasValue || idKhachHang.Value <= 0)
            {
                return Json(new { success = false, count = 0, items = new object[] { } });
            }

            var notifications = await _notificationService.GetNotificationsAsync(idKhachHang.Value, search, type);

            return Json(new
            {
                success = true,
                count = notifications.Count,
                items = notifications
            });
        }
    }
}
