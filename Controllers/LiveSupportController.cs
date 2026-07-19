using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Services;
using SupportTicketSysterm.ViewModels;
using SupportTicketSysterm.Data;
using Microsoft.EntityFrameworkCore;

namespace SupportTicketSysterm.Controllers
{
    [Route("LiveSupport")]
    public class LiveSupportController : Controller
    {
        private readonly ILiveSupportService _liveSupportService;
        private readonly IChatPermissionService _chatPermissionService;
        private readonly ISignalRService _signalRService;
        private readonly INotificationService _notificationService;
        private readonly IAppointmentService _appointmentService;
        private readonly IRatingService _ratingService;
        private readonly IGeminiService _geminiService;
        private readonly TechSupportContext _context;

        public LiveSupportController(
            ILiveSupportService liveSupportService,
            IChatPermissionService chatPermissionService,
            ISignalRService signalRService,
            INotificationService notificationService,
            IAppointmentService appointmentService,
            IRatingService ratingService,
            IGeminiService geminiService,
            TechSupportContext context)
        {
            _liveSupportService = liveSupportService;
            _chatPermissionService = chatPermissionService;
            _signalRService = signalRService;
            _notificationService = notificationService;
            _appointmentService = appointmentService;
            _ratingService = ratingService;
            _geminiService = geminiService;
            _context = context;
        }

        // ==========================================
        // 1. INDEX ACTION
        // ==========================================
        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Index(string maPhieu)
        {
            var (userId, role, hoTen) = GetUserSessionInfo();
            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (string.IsNullOrEmpty(maPhieu))
            {
                return BadRequest("Mã phiếu không được để trống.");
            }

            var ticket = await _liveSupportService.GetTicketByCodeAsync(maPhieu);
            if (ticket == null)
            {
                return NotFound("Không tìm thấy phiếu hỗ trợ.");
            }

            // Authorization validation
            bool isAuthorized = false;
            string mappedRole = "";

            if (role == "Admin")
            {
                isAuthorized = true;
                mappedRole = "Staff";
            }
            else if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                mappedRole = "Staff";
                if (ticket.IdNhanVien == userId)
                {
                    isAuthorized = true;
                }
            }
            else // KhachHang
            {
                mappedRole = "Customer";
                if (ticket.IdKhachHang == userId)
                {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized)
            {
                return RedirectToAction("AccessDenied", "Auth");
            }

            var messages = await _liveSupportService.GetMessagesAsync(maPhieu);
            var staff = await _liveSupportService.GetAssignedStaffAsync(maPhieu);

            bool canChat = _chatPermissionService.CanChat(ticket.TrangThai);
            bool alreadyRated = await _context.DanhGia.AnyAsync(dg => dg.IdPhieu == ticket.IdPhieu);

            var viewModel = new LiveSupportViewModel
            {
                Ticket = ticket,
                Staff = staff,
                Customer = ticket.IdKhachHangNavigation,
                Messages = messages,
                CurrentUserRole = mappedRole,
                CurrentUserName = hoTen,
                CanChat = canChat,
                CanUploadFile = canChat,
                CanCreateAppointment = canChat && (mappedRole == "Staff"),
                CanRate = ticket.TrangThai == "Hoàn thành" && mappedRole == "Customer" && !alreadyRated
            };

            await _liveSupportService.MarkAsReadAsync(maPhieu, mappedRole);

            return View("LiveSupport", viewModel);
        }

        // ==========================================
        // 2. LOAD CONVERSATION
        // ==========================================
        [HttpGet]
        [Route("LoadConversation")]
        public async Task<IActionResult> LoadConversation(string maPhieu)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            try
            {
                var messages = await _liveSupportService.GetMessagesAsync(maPhieu);
                return Json(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 3. SEND MESSAGE
        // ==========================================
        [HttpPost]
        [Route("SendMessage")]
        public async Task<IActionResult> SendMessage(string maPhieu, string content)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            if (string.IsNullOrEmpty(content))
            {
                return BadRequest("Nội dung tin nhắn trống.");
            }

            string mappedRole = (role == "Admin" || role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") ? "Staff" : "Customer";

            try
            {
                var savedMsg = await _liveSupportService.SaveMessageAsync(maPhieu, content, mappedRole);
                
                // Realtime broadcast via SignalR
                await _signalRService.SendMessageToRoomAsync(maPhieu, "ReceiveMessage", savedMsg);

                // Send notification
                await _notificationService.NotifyNewMessageAsync(maPhieu, mappedRole, content);

                return Json(new { success = true, data = savedMsg });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 4. UPLOAD FILE
        // ==========================================
        [HttpPost]
        [Route("UploadFile")]
        public async Task<IActionResult> UploadFile(string maPhieu, IFormFile file)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            if (file == null || file.Length == 0)
            {
                return BadRequest("Không tìm thấy tệp tải lên.");
            }

            if (file.Length > 20 * 1024 * 1024)
            {
                return BadRequest("Dung lượng tệp vượt quá giới hạn 20MB.");
            }

            string mappedRole = (role == "Admin" || role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") ? "Staff" : "Customer";

            try
            {
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "chat");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var physicalPath = Path.Combine(uploadsDir, uniqueFileName);

                using (var stream = new FileStream(physicalPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativeUrl = $"/uploads/chat/{uniqueFileName}";
                var savedMsg = await _liveSupportService.UploadAsync(maPhieu, file.FileName, relativeUrl, file.ContentType, mappedRole);

                // Realtime broadcast via SignalR
                await _signalRService.SendMessageToRoomAsync(maPhieu, "ReceiveMessage", savedMsg);

                // Send notification
                await _notificationService.NotifyNewMessageAsync(maPhieu, mappedRole, $"[Tệp đính kèm: {file.FileName}]");

                return Json(new { success = true, data = savedMsg });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 5. CREATE APPOINTMENT
        // ==========================================
        [HttpPost]
        [Route("CreateAppointment")]
        public async Task<IActionResult> CreateAppointment(string maPhieu, string date, string timeStart, string timeEnd, string? address, string? note)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            if (role != "Admin" && role != "NhanVien" && role != "Nhân viên" && role != "Nhân viên hỗ trợ")
            {
                return Forbid("Chỉ nhân viên kỹ thuật mới có quyền tạo lịch hẹn.");
            }

            try
            {
                DateOnly ngayHen = DateOnly.Parse(date);
                TimeOnly gioBatDau = TimeOnly.Parse(timeStart);
                TimeOnly gioKetThuc = TimeOnly.Parse(timeEnd);

                var appointment = await _appointmentService.CreateAppointmentAsync(maPhieu, ngayHen, gioBatDau, gioKetThuc, address, note);

                // Create a system message and broadcast
                var messages = await _liveSupportService.GetMessagesAsync(maPhieu);
                var latestMsg = messages[messages.Count - 1]; // The system message created inside appointment service

                await _signalRService.SendMessageToRoomAsync(maPhieu, "ReceiveMessage", latestMsg);

                return Json(new { success = true, data = appointment });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 6. CLOSE CHAT
        // ==========================================
        [HttpPost]
        [Route("CloseChat")]
        public async Task<IActionResult> CloseChat(string maPhieu)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            try
            {
                var ticket = await _liveSupportService.GetTicketByCodeAsync(maPhieu);
                if (ticket == null) return NotFound("Phiếu không tồn tại.");

                ticket.TrangThai = "Hoàn thành";
                ticket.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);
                _context.PhieuHoTros.Update(ticket);
                await _context.SaveChangesAsync();

                // Save system message
                var savedMsg = await _liveSupportService.SaveMessageAsync(maPhieu, "🔒 Cuộc trò chuyện đã kết thúc. Phiếu hỗ trợ đã được chuyển sang trạng thái Hoàn thành.", "Staff");

                // Broadcast state and system message via SignalR
                await _signalRService.SendMessageToRoomAsync(maPhieu, "ReceiveMessage", savedMsg);
                await _signalRService.SendMessageToRoomAsync(maPhieu, "ChatClosed", new { status = "Hoàn thành" });

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 7. RATE TICKET
        // ==========================================
        [HttpPost]
        [Route("RateTicket")]
        public async Task<IActionResult> RateTicket(string maPhieu, int rating, string? comment)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            if (rating < 1 || rating > 5)
            {
                return BadRequest("Điểm đánh giá phải từ 1 đến 5 sao.");
            }

            try
            {
                var rate = await _ratingService.RateTicketAsync(maPhieu, rating, comment);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 8. ASK AI (Gemini AI Support Integration)
        // ==========================================
        [HttpPost]
        [Route("AskAi")]
        public async Task<IActionResult> AskAi(string maPhieu, string content)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null) return Unauthorized();

            if (string.IsNullOrEmpty(content))
            {
                return BadRequest("Nội dung câu hỏi trống.");
            }

            try
            {
                // 1. Save user message and broadcast
                var savedUserMsg = await _liveSupportService.SaveMessageAsync(maPhieu, content, "Customer");
                await _signalRService.SendMessageToRoomAsync(maPhieu, "ReceiveMessage", savedUserMsg);

                // 2. Call Gemini API
                var systemInstruction = "Bạn là Trợ lý AI Hỗ trợ kỹ thuật chuyên nghiệp của Viettel Telecom. Hãy tư vấn giúp khách hàng xử lý sự cố. Trả lời ngắn gọn, trực diện, lịch sự.";
                var aiResponse = await _geminiService.SendPromptAsync(systemInstruction, content);

                // 3. Save AI message and broadcast
                var savedAiMsg = await _liveSupportService.SaveMessageAsync(maPhieu, aiResponse, "AI");
                await _signalRService.SendMessageToRoomAsync(maPhieu, "ReceiveMessage", savedAiMsg);

                return Json(new { success = true, reply = aiResponse });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // PRIVATE HELPERS
        // ==========================================
        private (int? UserId, string Role, string HoTen) GetUserSessionInfo()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("UserId")?.Value;
                if (int.TryParse(userIdStr, out int id))
                {
                    userId = id;
                }
            }

            var role = HttpContext.Session.GetString("Role");
            if (string.IsNullOrEmpty(role))
            {
                role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("VaiTro")?.Value ?? "";
            }

            var hoTen = HttpContext.Session.GetString("HoTen") ?? User.Identity?.Name ?? "";

            return (userId, role, hoTen);
        }
    }
}
