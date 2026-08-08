using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using System.Security.Claims;
using SupportTicketSysterm.Services;
using SupportTicketSysterm.ViewModels;
using ChatViewModel = SupportTicketSysterm.ViewModels.ChatViewModel;
using Microsoft.AspNetCore.SignalR;

namespace SupportTicketSysterm.Controllers
{
    public class ChatController : Controller
    {
        private readonly TechSupportContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ChatController> _logger;
        private readonly IChatService _chatService;
        private readonly ITicketService _ticketService;
        private readonly ILiveSupportService _liveSupportService;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public ChatController(
            TechSupportContext context,
            IWebHostEnvironment env,
            ILogger<ChatController> logger,
            IChatService chatService,
            ITicketService ticketService,
            ILiveSupportService liveSupportService,
            IHubContext<ChatHub> chatHubContext)
        {
            _context = context;
            _env = env;
            _logger = logger;
            _chatService = chatService;
            _ticketService = ticketService;
            _liveSupportService = liveSupportService;
            _chatHubContext = chatHubContext;
        }

        // ==========================================
        // 1. INDEX ACTION (Main Chatbox)
        // ==========================================
        [HttpGet]
        [Route("Chat")]
        [Route("Chat/Index/{id?}")]
        public async Task<IActionResult> Index(int? id)
        {
            // Authenticated Check
            var (userId, role, hoTen) = GetUserSessionInfo();
            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            // Query LienHe list with AsNoTracking
            var query = _context.LienHes
                .AsNoTracking()
                .Include(lh => lh.IdKhachHangNavigation)
                .Include(lh => lh.IdNhanVienNavigation)
                .Include(lh => lh.IdPhieuNavigation)
                    .ThenInclude(p => p!.IdDichVuNavigation)
                        .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(lh => lh.TinNhans)
                .AsQueryable();

            // Role filtering for conversation list
            if (role == "KhachHang")
            {
                query = query.Where(lh => lh.IdKhachHang == userId.Value);
                ViewBag.Tickets = await _context.PhieuHoTros
                    .AsNoTracking()
                    .Where(p => p.IdKhachHang == userId.Value)
                    .ToListAsync();
            }
            else if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                query = query.Where(lh => lh.TrangThai == "Đang chờ" || (lh.TrangThai == "Đang hỗ trợ" && lh.IdNhanVien == userId.Value));
            }
            // Admin role sees all

            var lienHes = await query
                .OrderByDescending(lh => lh.ThoiGianGui)
                .ToListAsync();

            LienHe? activeLh = null;

            if (id.HasValue)
            {
                // First check if id is an IdPhieu
                var ticketById = await _context.PhieuHoTros
                    .AsNoTracking()
                    .Include(p => p.IdKhachHangNavigation)
                    .Include(p => p.IdNhanVienNavigation)
                    .Include(p => p.IdDichVuNavigation)
                        .ThenInclude(d => d!.IdDanhMucNavigation)
                    .FirstOrDefaultAsync(p => p.IdPhieu == id.Value);

                if (ticketById != null)
                {
                    // Strict Authorization check for Ticket
                    bool isAuthorized = false;
                    if (role == "Admin")
                    {
                        isAuthorized = true;
                    }
                    else if (role == "KhachHang")
                    {
                        if (ticketById.IdKhachHang == userId.Value) isAuthorized = true;
                    }
                    else if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
                    {
                        if (ticketById.IdNhanVien == userId.Value) isAuthorized = true;
                    }

                    if (!isAuthorized)
                    {
                        return StatusCode(403); // 403 Forbidden
                    }

                    // Get or create LienHe record bound to this ticket
                    activeLh = lienHes.FirstOrDefault(x => x.IdPhieu == ticketById.IdPhieu);
                    if (activeLh == null)
                    {
                        activeLh = await _context.LienHes
                            .Include(lh => lh.IdKhachHangNavigation)
                            .Include(lh => lh.IdNhanVienNavigation)
                            .Include(lh => lh.IdPhieuNavigation)
                            .FirstOrDefaultAsync(lh => lh.IdPhieu == ticketById.IdPhieu);

                        if (activeLh == null)
                        {
                            activeLh = new LienHe
                            {
                                IdPhieu = ticketById.IdPhieu,
                                IdKhachHang = ticketById.IdKhachHang,
                                IdNhanVien = ticketById.IdNhanVien,
                                TieuDe = $"Hỗ trợ chat trực tuyến - {ticketById.MaPhieu ?? ("PH" + ticketById.IdPhieu)}",
                                ThoiGianGui = DateTime.Now,
                                TrangThai = ticketById.TrangThai ?? "Đang hỗ trợ",
                                NgayTao = DateOnly.FromDateTime(DateTime.Now),
                                SoTinChuaDoc = 0,
                                TinChuaDocKhach = 0
                            };
                            _context.LienHes.Add(activeLh);
                            await _context.SaveChangesAsync();
                            lienHes.Insert(0, activeLh);
                        }
                    }
                }
                else
                {
                    // Otherwise check if id is an IdLienHe
                    activeLh = lienHes.FirstOrDefault(x => x.IdLienHe == id.Value);
                    if (activeLh == null)
                    {
                        var lhById = await _context.LienHes
                            .AsNoTracking()
                            .Include(lh => lh.IdKhachHangNavigation)
                            .Include(lh => lh.IdNhanVienNavigation)
                            .Include(lh => lh.IdPhieuNavigation)
                            .FirstOrDefaultAsync(lh => lh.IdLienHe == id.Value);

                        if (lhById != null)
                        {
                            bool isAuthorized = false;
                            if (role == "Admin") isAuthorized = true;
                            else if (role == "KhachHang" && lhById.IdKhachHang == userId.Value) isAuthorized = true;
                            else if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && (lhById.IdNhanVien == userId.Value || lhById.TrangThai == "Đang chờ")) isAuthorized = true;

                            if (!isAuthorized)
                            {
                                return StatusCode(403); // 403 Forbidden
                            }
                            activeLh = lhById;
                        }
                        else
                        {
                            return NotFound();
                        }
                    }
                }
            }

            var viewModel = new ChatViewModel
            {
                CurrentUserId = userId.Value,
                CurrentUserRole = role,
                SelectedIdLienHe = activeLh?.IdLienHe ?? id
            };

            // Populate Conversations List in ViewModel
            foreach (var lh in lienHes)
            {
                var lastMsg = lh.TinNhans.OrderByDescending(t => t.ThoiGian).FirstOrDefault();
                string lastMsgText = lastMsg != null ? (lastMsg.TinNhan1 ?? "[Tệp đính kèm]") : (lh.NoiDung ?? "");

                viewModel.Conversations.Add(new ConversationViewModel
                {
                    IdLienHe = lh.IdLienHe,
                    TieuDe = lh.TieuDe ?? "Hội thoại hỗ trợ",
                    TenKhachHang = lh.IdKhachHangNavigation?.HoTen ?? "Khách hàng vãng lai",
                    TenNhanVien = lh.IdNhanVienNavigation?.HoTen ?? "Chưa phân công",
                    IdPhieu = lh.IdPhieu,
                    MaPhieu = lh.IdPhieuNavigation?.MaPhieu ?? (lh.IdPhieu.HasValue ? "PH" + lh.IdPhieu.Value : ""),
                    TieuDePhieu = lh.IdPhieuNavigation?.TieuDe ?? "",
                    TenDanhMuc = lh.IdPhieuNavigation?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                    DichVuPhieu = lh.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "",
                    ThoiGianGui = lh.ThoiGianGui,
                    TrangThai = lh.IdPhieuNavigation?.TrangThai ?? lh.TrangThai ?? "Chờ tiếp nhận",
                    SoTinChuaDoc = lh.SoTinChuaDoc ?? 0,
                    TinChuaDocKhach = lh.TinChuaDocKhach ?? 0,
                    LastMessage = lastMsgText
                });
            }

            // Load Active Conversation details & message history
            if (activeLh != null)
            {
                bool updated = false;
                if (role == "KhachHang" && (activeLh.TinChuaDocKhach ?? 0) > 0)
                {
                    activeLh.TinChuaDocKhach = 0;
                    updated = true;
                }
                else if (role != "KhachHang" && (activeLh.SoTinChuaDoc ?? 0) > 0)
                {
                    activeLh.SoTinChuaDoc = 0;
                    updated = true;
                }

                if (updated)
                {
                    _context.LienHes.Update(activeLh);
                    await _context.SaveChangesAsync();
                }

                var lastMsg = activeLh.TinNhans?.OrderByDescending(t => t.ThoiGian).FirstOrDefault();
                viewModel.ActiveConversation = new ConversationViewModel
                {
                    IdLienHe = activeLh.IdLienHe,
                    TieuDe = activeLh.TieuDe,
                    TenKhachHang = activeLh.IdKhachHangNavigation?.HoTen ?? "Khách hàng vãng lai",
                    TenNhanVien = activeLh.IdNhanVienNavigation?.HoTen ?? "Chưa phân công",
                    IdPhieu = activeLh.IdPhieu,
                    MaPhieu = activeLh.IdPhieuNavigation?.MaPhieu ?? (activeLh.IdPhieu.HasValue ? "PH" + activeLh.IdPhieu.Value : ""),
                    TieuDePhieu = activeLh.IdPhieuNavigation?.TieuDe ?? "",
                    TenDanhMuc = activeLh.IdPhieuNavigation?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                    DichVuPhieu = activeLh.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "",
                    ThoiGianGui = activeLh.ThoiGianGui,
                    TrangThai = activeLh.IdPhieuNavigation?.TrangThai ?? activeLh.TrangThai ?? "Chờ tiếp nhận",
                    SoTinChuaDoc = activeLh.SoTinChuaDoc ?? 0,
                    TinChuaDocKhach = activeLh.TinChuaDocKhach ?? 0,
                    LastMessage = lastMsg != null ? (lastMsg.TinNhan1 ?? "[Tệp đính kèm]") : ""
                };

                // Load Messages strictly filtered by WHERE IdPhieu / IdLienHe
                var messages = await _context.TinNhans
                    .AsNoTracking()
                    .Include(m => m.FileDinhKems)
                    .Where(m => m.IdLienHe == activeLh.IdLienHe)
                    .OrderBy(m => m.ThoiGian)
                    .ToListAsync();

                if (!messages.Any())
                {
                    // Initial Welcome Message for new tickets with 0 messages
                    string ticketCode = activeLh.IdPhieuNavigation?.MaPhieu ?? (activeLh.IdPhieu.HasValue ? $"PH{activeLh.IdPhieu.Value:D6}" : "hỗ trợ");
                    viewModel.Messages.Add(new MessageViewModel
                    {
                        IdTinNhan = 0,
                        IdLienHe = activeLh.IdLienHe,
                        LoaiNguoiGui = "AI",
                        NoiDung = $"🤖 Xin chào!\n\nĐây là cuộc trò chuyện của Phiếu {ticketCode}.\n\nBạn có thể trao đổi trực tiếp với nhân viên hỗ trợ tại đây.",
                        ThoiGian = DateTime.Now,
                        TrangThai = "Đã gửi"
                    });
                }
                else
                {
                    foreach (var msg in messages)
                    {
                        var msgVm = new MessageViewModel
                        {
                            IdTinNhan = msg.IdTinNhan,
                            IdLienHe = msg.IdLienHe ?? 0,
                            LoaiNguoiGui = msg.LoaiNguoiGui ?? "KhachHang",
                            NoiDung = msg.TinNhan1 ?? "",
                            ThoiGian = msg.ThoiGian ?? DateTime.Now,
                            TrangThai = msg.TrangThai ?? "Đã gửi"
                        };

                        foreach (var file in msg.FileDinhKems)
                        {
                            msgVm.Files.Add(new FileAttachmentViewModel
                            {
                                IdFile = file.IdFile,
                                TenFile = file.TenFile,
                                DuongDan = file.DuongDan,
                                LoaiFile = file.LoaiFile ?? ""
                            });
                        }

                        viewModel.Messages.Add(msgVm);
                    }
                }
            }

            return View(viewModel);
        }

        // ==========================================
        // 2. CHI TIET ACTION (Load active conversation)
        // ==========================================
        [HttpGet]
        public IActionResult ChiTiet(int idLienHe)
        {
            return RedirectToAction("Index", new { id = idLienHe });
        }

        // ==========================================
        // 3. GUI TIN NHAN ACTION (Post Message Form)
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuiTinNhan(int idLienHe, string? messageText, IFormFile? file, int? idPhieu)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (!idPhieu.HasValue && idLienHe <= 0)
            {
                TempData["Error"] = "Không tìm thấy IdPhieu hoặc cuộc trò chuyện.";
                return RedirectToAction("Index");
            }

            if (string.IsNullOrWhiteSpace(messageText) && file == null)
            {
                TempData["Error"] = "Vui lòng nhập nội dung tin nhắn hoặc đính kèm tệp.";
                return RedirectToAction("Index", new { id = idPhieu.HasValue ? idPhieu.Value : idLienHe });
            }

            LienHe? lh = null;
            if (idPhieu.HasValue)
            {
                lh = await _context.LienHes.Include(l => l.IdPhieuNavigation).FirstOrDefaultAsync(l => l.IdPhieu == idPhieu.Value);
            }
            if (lh == null && idLienHe > 0)
            {
                lh = await _context.LienHes.Include(l => l.IdPhieuNavigation).FirstOrDefaultAsync(l => l.IdLienHe == idLienHe);
            }

            if (lh == null)
            {
                return NotFound();
            }

            // Security Ownership Authorization
            bool isAuthorized = false;
            if (role == "Admin") isAuthorized = true;
            else if (role == "KhachHang" && lh.IdKhachHang == userId.Value) isAuthorized = true;
            else if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && lh.IdNhanVien == userId.Value) isAuthorized = true;

            if (!isAuthorized)
            {
                return StatusCode(403);
            }

            if (lh.IdPhieuNavigation != null)
            {
                var st = lh.IdPhieuNavigation.TrangThai;
                if (st == "Hoàn thành" || st == "Đã hủy")
                {
                    TempData["Error"] = "Phiếu hỗ trợ đã " + (st == "Hoàn thành" ? "hoàn thành" : "bị hủy") + ". Cuộc trò chuyện chỉ ở chế độ xem, không thể gửi tin nhắn mới.";
                    return RedirectToAction("Index", new { id = lh.IdPhieu ?? lh.IdLienHe });
                }
            }

            // Save Message Record
            var msg = new TinNhan
            {
                IdLienHe = lh.IdLienHe,
                LoaiNguoiGui = (role == "KhachHang" ? "KhachHang" : "NhanVien"),
                ThoiGian = DateTime.Now,
                TinNhan1 = messageText?.Trim(),
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(msg);
            await _context.SaveChangesAsync();

            // Handle file upload if present
            if (file != null && file.Length > 0)
            {
                var fileUploadResult = await SaveUploadedFile(msg.IdTinNhan, file);
                if (!fileUploadResult.Success)
                {
                    TempData["Error"] = fileUploadResult.ErrorMessage;
                    _context.TinNhans.Remove(msg);
                    await _context.SaveChangesAsync();
                    return RedirectToAction("Index", new { id = lh.IdPhieu ?? lh.IdLienHe });
                }
            }

            // Update LienHe status
            lh.ThoiGianGui = DateTime.Now;
            if (role == "KhachHang")
            {
                lh.SoTinChuaDoc = (lh.SoTinChuaDoc ?? 0) + 1;
            }
            else
            {
                lh.TinChuaDocKhach = (lh.TinChuaDocKhach ?? 0) + 1;
            }

            _context.LienHes.Update(lh);
            await _context.SaveChangesAsync();

            // Realtime SignalR broadcast to Ticket_{IdPhieu} group
            if (lh.IdPhieu.HasValue)
            {
                string ticketGroup = $"Ticket_{lh.IdPhieu.Value}";
                var msgVm = new MessageViewModel
                {
                    IdTinNhan = msg.IdTinNhan,
                    IdLienHe = lh.IdLienHe,
                    LoaiNguoiGui = msg.LoaiNguoiGui,
                    NoiDung = msg.TinNhan1 ?? "",
                    ThoiGian = msg.ThoiGian ?? DateTime.Now,
                    TrangThai = msg.TrangThai ?? "Đã gửi"
                };
                await _chatHubContext.Clients.Group(ticketGroup).SendAsync("ReceiveMessage", lh.IdPhieu.Value.ToString(), msgVm);
            }

            return RedirectToAction("Index", new { id = lh.IdPhieu ?? lh.IdLienHe });
        }

        // ==========================================
        // 3b. SEND MESSAGE API ACTION (POST SendMessage)
        // ==========================================
        // ==========================================
        // 3b. SEND MESSAGE API ACTION (POST SendMessage)
        // Unified for Ticket Chat (with idPhieu) and AI ChatBox (without idPhieu)
        // ==========================================
        [HttpPost]
        [Route("Chat/SendMessage")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest? jsonRequest, [FromForm] int? idPhieu, [FromForm] string? noiDung, [FromForm] string? message, [FromForm] string? loaiNguoiGui)
        {
            var (userId, role, _) = GetUserSessionInfo();

            // 1. TICKET CHAT ROOM FLOW (If idPhieu is provided)
            if (idPhieu.HasValue && idPhieu.Value > 0)
            {
                if (userId == null)
                {
                    return Unauthorized(new { success = false, message = "Bạn cần đăng nhập để gửi tin nhắn." });
                }

                string ticketMsgText = jsonRequest?.Message ?? noiDung ?? message ?? string.Empty;
                if (string.IsNullOrWhiteSpace(ticketMsgText))
                {
                    return BadRequest(new { success = false, message = "Nội dung tin nhắn không được để trống." });
                }

                var ticket = await _context.PhieuHoTros.AsNoTracking().FirstOrDefaultAsync(p => p.IdPhieu == idPhieu.Value);
                if (ticket == null)
                {
                    return NotFound(new { success = false, message = "Phiếu hỗ trợ không tồn tại." });
                }

                bool isAuthorized = false;
                if (role == "Admin") isAuthorized = true;
                else if (role == "KhachHang" && ticket.IdKhachHang == userId.Value) isAuthorized = true;
                else if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && ticket.IdNhanVien == userId.Value) isAuthorized = true;

                if (!isAuthorized)
                {
                    return StatusCode(403, new { success = false, message = "403 Forbidden: Bạn không có quyền chat trong phiếu hỗ trợ này." });
                }

                if (ticket.TrangThai == "Hoàn thành" || ticket.TrangThai == "Đã hủy")
                {
                    return BadRequest(new { success = false, message = "Phiếu hỗ trợ đã kết thúc, không thể gửi tin nhắn mới." });
                }

                string senderType = string.IsNullOrWhiteSpace(loaiNguoiGui)
                    ? (role == "KhachHang" ? "KhachHang" : "NhanVien")
                    : loaiNguoiGui;

                var savedMsg = await _liveSupportService.SaveMessageByTicketIdAsync(idPhieu.Value, ticketMsgText.Trim(), senderType);

                string roomName = $"Ticket_{idPhieu.Value}";
                await _chatHubContext.Clients.Group(roomName).SendAsync("ReceiveMessage", idPhieu.Value.ToString(), savedMsg);

                return Json(new { success = true, data = savedMsg, message = savedMsg.NoiDung, sender = senderType });
            }

            // 2. AI CHATBOX FLOW (If no idPhieu)
            string userMsg = jsonRequest?.Message ?? message ?? noiDung ?? string.Empty;
            userMsg = userMsg.Trim();

            if (string.IsNullOrWhiteSpace(userMsg))
            {
                return Json(new ChatMessageResponse
                {
                    Success = false,
                    Message = "Nội dung tin nhắn không được để trống.",
                    Sender = "ai"
                });
            }

            try
            {
                int? guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestLienHeId);
                if (guestLienHeId == null && conversation != null)
                {
                    HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
                }

                int lienHeId = conversation?.IdLienHe ?? 0;
                string aiResponse = await _chatService.GetAiResponseAndProcessActionsAsync(lienHeId, userMsg, userId);

                bool requiresLogin = false;
                if (userId == null && (userMsg.ToLower().Contains("phiếu") || userMsg.ToLower().Contains("tải") || userMsg.ToLower().Contains("tài khoản") || userMsg.ToLower().Contains("lịch hẹn")))
                {
                    if (aiResponse.Contains("đăng nhập") || aiResponse.Contains("Đăng nhập"))
                    {
                        requiresLogin = true;
                    }
                }

                return Json(new ChatMessageResponse
                {
                    Success = true,
                    Message = aiResponse,
                    Sender = "ai",
                    RequiresLogin = requiresLogin
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage endpoint");
                return Json(new ChatMessageResponse
                {
                    Success = false,
                    Message = "Xin lỗi, hiện tại tôi chưa thể xử lý yêu cầu này.",
                    Sender = "ai"
                });
            }
        }

        // ==========================================
        // 4. TAO LIEN HE ACTION (New Conversation)
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TaoLienHe(int? idPhieu, string tieuDe, string noiDung)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (role != "KhachHang")
            {
                TempData["Error"] = "Chỉ khách hàng mới có quyền tạo cuộc liên hệ mới.";
                return RedirectToAction("Index");
            }

            if (string.IsNullOrWhiteSpace(tieuDe) || string.IsNullOrWhiteSpace(noiDung))
            {
                TempData["Error"] = "Vui lòng điền đầy đủ tiêu đề và nội dung.";
                return RedirectToAction("Index");
            }

            // Find associated technician if linked to a ticket
            int? idNhanVien = null;
            if (idPhieu.HasValue)
            {
                var ticket = await _context.PhieuHoTros.FindAsync(idPhieu.Value);
                if (ticket != null)
                {
                    idNhanVien = ticket.IdNhanVien;
                }
            }

            var lh = new LienHe
            {
                IdKhachHang = userId.Value,
                IdNhanVien = idNhanVien,
                IdPhieu = idPhieu,
                TieuDe = tieuDe.Trim(),
                NoiDung = noiDung.Trim(),
                ThoiGianGui = DateTime.Now,
                TrangThai = "Đang trao đổi",
                SoTinChuaDoc = 1, // first message is unread for staff
                TinChuaDocKhach = 0
            };

            _context.LienHes.Add(lh);
            await _context.SaveChangesAsync();

            // Create initial message record
            var firstMsg = new TinNhan
            {
                IdLienHe = lh.IdLienHe,
                LoaiNguoiGui = "KhachHang",
                ThoiGian = DateTime.Now,
                TinNhan1 = noiDung.Trim(),
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(firstMsg);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { id = lh.IdLienHe });
        }

        // ==========================================
        // 5. UPLOAD FILE ACTION (Helper)
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadFile(int idLienHe, IFormFile file)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (file == null || file.Length == 0)
            {
                TempData["Error"] = "Vui lòng chọn tệp tin cần gửi.";
                return RedirectToAction("Index", new { id = idLienHe });
            }

            var lh = await _context.LienHes.FindAsync(idLienHe);
            if (lh == null)
            {
                return NotFound();
            }

            // Security Authorization
            bool isAuthorized = false;
            if (role == "Admin") isAuthorized = true;
            else if (role == "KhachHang" && lh.IdKhachHang == userId.Value) isAuthorized = true;
            else if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && lh.IdNhanVien == userId.Value) isAuthorized = true;

            if (!isAuthorized)
            {
                return StatusCode(403);
            }

            // Create placeholder message record for file
            var msg = new TinNhan
            {
                IdLienHe = idLienHe,
                LoaiNguoiGui = (role == "KhachHang" ? "KhachHang" : "NhanVien"),
                ThoiGian = DateTime.Now,
                TinNhan1 = $"[Tệp đính kèm: {file.FileName}]",
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(msg);
            await _context.SaveChangesAsync();

            var uploadResult = await SaveUploadedFile(msg.IdTinNhan, file);
            if (!uploadResult.Success)
            {
                TempData["Error"] = uploadResult.ErrorMessage;
                _context.TinNhans.Remove(msg);
                await _context.SaveChangesAsync();
                return RedirectToAction("Index", new { id = idLienHe });
            }

            // Update LienHe status
            lh.ThoiGianGui = DateTime.Now;
            if (role == "KhachHang")
            {
                lh.SoTinChuaDoc = (lh.SoTinChuaDoc ?? 0) + 1;
            }
            else
            {
                lh.TinChuaDocKhach = (lh.TinChuaDocKhach ?? 0) + 1;
            }

            _context.LienHes.Update(lh);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { id = idLienHe });
        }

        // ==========================================
        // 6. DANH SACH TIN NHAN (Partial View Refresh)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> DanhSachTinNhan(int idLienHe)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Challenge();
            }

            var lh = await _context.LienHes.AsNoTracking().FirstOrDefaultAsync(l => l.IdLienHe == idLienHe || l.IdPhieu == idLienHe);
            if (lh != null)
            {
                bool isAuth = false;
                if (role == "Admin") isAuth = true;
                else if (role == "KhachHang" && lh.IdKhachHang == userId.Value) isAuth = true;
                else if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && lh.IdNhanVien == userId.Value) isAuth = true;

                if (!isAuth)
                {
                    return StatusCode(403);
                }
            }

            var messages = await _context.TinNhans
                .Include(m => m.FileDinhKems)
                .Where(m => m.IdLienHe == idLienHe)
                .OrderBy(m => m.ThoiGian)
                .ToListAsync();

            var listVm = new List<MessageViewModel>();
            foreach (var msg in messages)
            {
                var msgVm = new MessageViewModel
                {
                    IdTinNhan = msg.IdTinNhan,
                    IdLienHe = msg.IdLienHe ?? 0,
                    LoaiNguoiGui = msg.LoaiNguoiGui ?? "KhachHang",
                    NoiDung = msg.TinNhan1 ?? "",
                    ThoiGian = msg.ThoiGian ?? DateTime.Now,
                    TrangThai = msg.TrangThai ?? "Đã gửi"
                };

                foreach (var file in msg.FileDinhKems)
                {
                    msgVm.Files.Add(new FileAttachmentViewModel
                    {
                        IdFile = file.IdFile,
                        TenFile = file.TenFile,
                        DuongDan = file.DuongDan,
                        LoaiFile = file.LoaiFile ?? ""
                    });
                }

                listVm.Add(msgVm);
            }

            ViewData["CurrentUserId"] = userId.Value;
            ViewData["CurrentUserRole"] = role;

            return PartialView("_MessageList", listVm);
        }

        // ==========================================
        // PRIVATE HELPER METHODS
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

        private async Task<(bool Success, string? ErrorMessage)> SaveUploadedFile(int idTinNhan, IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = new[] { ".jpg", ".png", ".pdf", ".docx", ".xlsx" };

            if (!allowedExtensions.Contains(extension))
            {
                return (false, "Định dạng file không được phép. Chỉ cho phép upload .jpg, .png, .pdf, .docx, .xlsx");
            }

            try
            {
                // Create unique filename
                var uniqueName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "chat");

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, uniqueName);
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Save FileDinhKem record
                var fileRecord = new FileDinhKem
                {
                    IdTinNhan = idTinNhan,
                    TenFile = file.FileName,
                    DuongDan = $"/uploads/chat/{uniqueName}",
                    LoaiFile = file.ContentType,
                    NgayUpload = DateTime.Now
                };

                _context.FileDinhKems.Add(fileRecord);
                await _context.SaveChangesAsync();

                return (true, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lưu tệp tin upload chat.");
                return (false, "Lỗi hệ thống khi lưu tệp đính kèm.");
            }
        }

        // ==========================================
        // AI CHAT ACTIONS
        // ==========================================
        // ==========================================
        // CHATBOX MVC ENDPOINTS
        // ==========================================

        [HttpGet]
        public async Task<IActionResult> DanhSachConversation()
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return PartialView("_ConversationList", new List<LienHe>());
            }

            var conversations = await _context.LienHes
                .Include(lh => lh.IdKhachHangNavigation)
                .Include(lh => lh.IdNhanVienNavigation)
                .Include(lh => lh.IdPhieuNavigation)
                .Where(lh => lh.IdKhachHang == userId.Value && lh.TieuDe != "Trò chuyện với AI Hỗ trợ")
                .OrderByDescending(lh => lh.ThoiGianGui)
                .ToListAsync();

            return PartialView("_ConversationList", conversations);
        }

        [HttpGet]
        public async Task<IActionResult> ChiTietConversation(int idLienHe)
        {
            var (userId, _, _) = GetUserSessionInfo();
            var conversation = await _context.LienHes
                .Include(lh => lh.IdKhachHangNavigation)
                .Include(lh => lh.IdNhanVienNavigation)
                .Include(lh => lh.IdPhieuNavigation)
                    .ThenInclude(p => p!.IdNhanVienNavigation)
                .FirstOrDefaultAsync(lh => lh.IdLienHe == idLienHe);

            if (conversation == null)
            {
                return NotFound("Không tìm thấy cuộc hội thoại.");
            }

            return PartialView("_ConversationHeaderInfo", conversation);
        }

        [HttpGet]
        public async Task<IActionResult> LayTinNhan(int idLienHe)
        {
            var (userId, _, _) = GetUserSessionInfo();
            var messages = await _context.TinNhans
                .Include(t => t.FileDinhKems)
                .Where(t => t.IdLienHe == idLienHe)
                .OrderBy(t => t.ThoiGian)
                .ToListAsync();

            // Mark incoming messages as read when customer views them
            var unreadMsg = messages.Where(t => t.LoaiNguoiGui == "Nhân viên" && t.TrangThai != "Đã đọc").ToList();
            if (unreadMsg.Any())
            {
                foreach (var um in unreadMsg)
                {
                    um.TrangThai = "Đã đọc";
                    _context.TinNhans.Update(um);
                }
                var lh = await _context.LienHes.FindAsync(idLienHe);
                if (lh != null)
                {
                    lh.TinChuaDocKhach = 0;
                    _context.LienHes.Update(lh);
                }
                await _context.SaveChangesAsync();
            }

            var listVm = new List<MessageViewModel>();
            foreach (var msg in messages)
            {
                var msgVm = new MessageViewModel
                {
                    IdTinNhan = msg.IdTinNhan,
                    IdLienHe = msg.IdLienHe ?? 0,
                    LoaiNguoiGui = msg.LoaiNguoiGui ?? "KhachHang",
                    NoiDung = msg.TinNhan1 ?? "",
                    ThoiGian = msg.ThoiGian ?? DateTime.Now,
                    TrangThai = msg.TrangThai ?? "Đã gửi"
                };

                foreach (var file in msg.FileDinhKems)
                {
                    msgVm.Files.Add(new FileAttachmentViewModel
                    {
                        IdFile = file.IdFile,
                        TenFile = file.TenFile,
                        DuongDan = file.DuongDan,
                        LoaiFile = file.LoaiFile ?? ""
                    });
                }
                listVm.Add(msgVm);
            }

            ViewData["CurrentUserId"] = userId ?? 0;
            ViewData["CurrentUserRole"] = "KhachHang";

            return PartialView("_MessageList", listVm);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuiTinNhanChatBox(int idLienHe, string messageText)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Challenge();
            }

            if (string.IsNullOrWhiteSpace(messageText))
            {
                return BadRequest("Nội dung tin nhắn không thể bỏ trống.");
            }

            // Save Message
            var msg = new TinNhan
            {
                IdLienHe = idLienHe,
                LoaiNguoiGui = "KhachHang",
                ThoiGian = DateTime.Now,
                TinNhan1 = messageText.Trim(),
                TrangThai = "Đã gửi"
            };
            _context.TinNhans.Add(msg);

            // Update LienHe details
            var lh = await _context.LienHes.FindAsync(idLienHe);
            if (lh != null)
            {
                lh.ThoiGianGui = DateTime.Now;
                lh.SoTinChuaDoc = (lh.SoTinChuaDoc ?? 0) + 1;
                lh.TrangThai = "Đang hỗ trợ";
                _context.LienHes.Update(lh);
            }

            await _context.SaveChangesAsync();

            return RedirectToAction("LayTinNhan", new { idLienHe = idLienHe });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadFileChatBox(int idLienHe, IFormFile file)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Challenge();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có tệp tin nào được chọn.");
            }

            // Save message row
            var msg = new TinNhan
            {
                IdLienHe = idLienHe,
                LoaiNguoiGui = "KhachHang",
                ThoiGian = DateTime.Now,
                TinNhan1 = $"[Tệp đính kèm: {file.FileName}]",
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(msg);
            await _context.SaveChangesAsync();

            var uploadResult = await SaveUploadedFile(msg.IdTinNhan, file);
            if (!uploadResult.Success)
            {
                _context.TinNhans.Remove(msg);
                await _context.SaveChangesAsync();
                return BadRequest(uploadResult.ErrorMessage ?? "Lỗi khi lưu tệp đính kèm.");
            }

            // Update LienHe details
            var lh = await _context.LienHes.FindAsync(idLienHe);
            if (lh != null)
            {
                lh.ThoiGianGui = DateTime.Now;
                lh.SoTinChuaDoc = (lh.SoTinChuaDoc ?? 0) + 1;
                lh.TrangThai = "Đang hỗ trợ";
                _context.LienHes.Update(lh);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction("LayTinNhan", new { idLienHe = idLienHe });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TaoLienHeChatBox(string tieuDe)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Challenge();
            }

            var lh = new LienHe
            {
                IdKhachHang = userId.Value,
                IdNhanVien = null,
                TieuDe = string.IsNullOrWhiteSpace(tieuDe) ? "Yêu cầu liên hệ kỹ thuật" : tieuDe.Trim(),
                ThoiGianGui = DateTime.Now,
                TrangThai = "Đang hỗ trợ",
                SoTinChuaDoc = 1,
                TinChuaDocKhach = 0,
                NgayTao = DateOnly.FromDateTime(DateTime.Now)
            };

            _context.LienHes.Add(lh);
            await _context.SaveChangesAsync();

            var firstMsg = new TinNhan
            {
                IdLienHe = lh.IdLienHe,
                LoaiNguoiGui = "KhachHang",
                ThoiGian = DateTime.Now,
                TinNhan1 = "Tôi cần hỗ trợ sự cố từ bộ phận chăm sóc khách hàng.",
                TrangThai = "Đã gửi"
            };
            _context.TinNhans.Add(firstMsg);
            await _context.SaveChangesAsync();

            return Json(new { success = true, idLienHe = lh.IdLienHe });
        }

        [HttpGet]
        public async Task<IActionResult> LayLichSuChatAI()
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                // Guest flow: retrieve guest history from Session
                var guestHistoryJson = HttpContext.Session.GetString("GuestHistory");
                List<MessageViewModel> guestHistory = new List<MessageViewModel>();
                if (!string.IsNullOrEmpty(guestHistoryJson))
                {
                    guestHistory = System.Text.Json.JsonSerializer.Deserialize<List<MessageViewModel>>(guestHistoryJson) ?? new List<MessageViewModel>();
                }
                else
                {
                    guestHistory.Add(new MessageViewModel
                    {
                        IdTinNhan = 1,
                        IdLienHe = 0,
                        LoaiNguoiGui = "AI",
                        NoiDung = "Xin chào! Tôi là trợ lý ảo hỗ trợ kỹ thuật TechSupport của Viettel Telecom. Tôi có thể giúp gì cho bạn hôm nay?",
                        ThoiGian = DateTime.Now,
                        TrangThai = "Đã gửi"
                    });
                    HttpContext.Session.SetString("GuestHistory", System.Text.Json.JsonSerializer.Serialize(guestHistory));
                }

                ViewData["CurrentUserId"] = 0;
                ViewData["CurrentUserRole"] = "KhachHang";

                return PartialView("_MessageList", guestHistory);
            }
            else
            {
                // Logged in: retrieve from database
                int? guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestLienHeId);

                if (guestLienHeId == null)
                {
                    HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
                }

                return RedirectToAction("LayTinNhan", new { idLienHe = conversation.IdLienHe });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChatAI(string messageText)
        {
            var (userId, _, _) = GetUserSessionInfo();

            if (string.IsNullOrWhiteSpace(messageText))
            {
                return BadRequest("Nội dung tin nhắn không thể bỏ trống.");
            }

            if (userId == null)
            {
                // Guest flow
                var guestHistoryJson = HttpContext.Session.GetString("GuestHistory");
                List<MessageViewModel> guestHistory = new List<MessageViewModel>();
                if (!string.IsNullOrEmpty(guestHistoryJson))
                {
                    guestHistory = System.Text.Json.JsonSerializer.Deserialize<List<MessageViewModel>>(guestHistoryJson) ?? new List<MessageViewModel>();
                }

                // Add customer message
                guestHistory.Add(new MessageViewModel
                {
                    IdTinNhan = guestHistory.Count + 1,
                    IdLienHe = 0,
                    LoaiNguoiGui = "KhachHang",
                    NoiDung = messageText,
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                });

                // Get AI response (without database persistence)
                var aiResponse = await _chatService.GetAiResponseAndProcessActionsAsync(0, messageText, null);

                // Add AI message
                guestHistory.Add(new MessageViewModel
                {
                    IdTinNhan = guestHistory.Count + 1,
                    IdLienHe = 0,
                    LoaiNguoiGui = "AI",
                    NoiDung = aiResponse,
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                });

                HttpContext.Session.SetString("GuestHistory", System.Text.Json.JsonSerializer.Serialize(guestHistory));

                ViewData["CurrentUserId"] = 0;
                ViewData["CurrentUserRole"] = "KhachHang";

                return PartialView("_MessageList", guestHistory);
            }
            else
            {
                // Authenticated customer flow
                int? guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestLienHeId);

                if (guestLienHeId == null)
                {
                    HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
                }

                await _chatService.SaveCustomerMessageAsync(conversation.IdLienHe, messageText);
                await _chatService.GetAiResponseAndProcessActionsAsync(conversation.IdLienHe, messageText, userId);

                return RedirectToAction("LayTinNhan", new { idLienHe = conversation.IdLienHe });
            }
        }

        // ==========================================
        // 6b. OPTIMISTIC UI — SPLIT AI CHAT ENDPOINTS
        // ==========================================

        /// <summary>
        /// Phase 1: Save user message only (fast, no Gemini call).
        /// Returns JSON { success: true } in ~100ms.
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChatAI_SaveUserMessage(string messageText)
        {
            var (userId, _, _) = GetUserSessionInfo();

            if (string.IsNullOrWhiteSpace(messageText))
            {
                return Json(new { success = false, error = "Nội dung tin nhắn không thể bỏ trống." });
            }

            if (userId == null)
            {
                // Guest flow: add user message to Session
                var guestHistoryJson = HttpContext.Session.GetString("GuestHistory");
                List<MessageViewModel> guestHistory = new List<MessageViewModel>();
                if (!string.IsNullOrEmpty(guestHistoryJson))
                {
                    guestHistory = System.Text.Json.JsonSerializer.Deserialize<List<MessageViewModel>>(guestHistoryJson) ?? new List<MessageViewModel>();
                }

                guestHistory.Add(new MessageViewModel
                {
                    IdTinNhan = guestHistory.Count + 1,
                    IdLienHe = 0,
                    LoaiNguoiGui = "KhachHang",
                    NoiDung = messageText,
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                });

                HttpContext.Session.SetString("GuestHistory", System.Text.Json.JsonSerializer.Serialize(guestHistory));

                return Json(new { success = true, timeStamp = DateTime.Now.ToString("HH:mm") });
            }
            else
            {
                // Authenticated: save to DB only (no Gemini call)
                int? guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestLienHeId);

                if (guestLienHeId == null)
                {
                    HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
                }

                await _chatService.SaveCustomerMessageAsync(conversation.IdLienHe, messageText);

                return Json(new { success = true, timeStamp = DateTime.Now.ToString("HH:mm") });
            }
        }



        /// <summary>
        /// Phase 2: Call Gemini and return only the AI response bubble HTML.
        /// This is the slow part (3-10s). Returns PartialView("_SingleAiMessage").
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChatAI_GetAiResponse(string messageText)
        {
            var (userId, _, _) = GetUserSessionInfo();

            if (string.IsNullOrWhiteSpace(messageText))
            {
                return BadRequest("Nội dung tin nhắn không thể bỏ trống.");
            }

            if (userId == null)
            {
                // Guest flow: call Gemini without DB persistence
                var aiResponse = await _chatService.GetAiResponseAndProcessActionsAsync(0, messageText, null);

                // Save AI response to session history
                var guestHistoryJson = HttpContext.Session.GetString("GuestHistory");
                List<MessageViewModel> guestHistory = new List<MessageViewModel>();
                if (!string.IsNullOrEmpty(guestHistoryJson))
                {
                    guestHistory = System.Text.Json.JsonSerializer.Deserialize<List<MessageViewModel>>(guestHistoryJson) ?? new List<MessageViewModel>();
                }

                var aiMsg = new MessageViewModel
                {
                    IdTinNhan = guestHistory.Count + 1,
                    IdLienHe = 0,
                    LoaiNguoiGui = "AI",
                    NoiDung = aiResponse,
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                };
                guestHistory.Add(aiMsg);

                HttpContext.Session.SetString("GuestHistory", System.Text.Json.JsonSerializer.Serialize(guestHistory));

                ViewData["CurrentUserId"] = 0;
                ViewData["CurrentUserRole"] = "KhachHang";

                return PartialView("_SingleAiMessage", aiMsg);
            }
            else
            {
                // Authenticated: call Gemini and save AI response
                int? guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestLienHeId);

                if (guestLienHeId == null)
                {
                    HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
                }

                var aiResponse = await _chatService.GetAiResponseAndProcessActionsAsync(conversation.IdLienHe, messageText, userId);

                ViewData["CurrentUserId"] = userId;
                ViewData["CurrentUserRole"] = "KhachHang";

                var aiMsg = new MessageViewModel
                {
                    IdTinNhan = 0,
                    IdLienHe = conversation.IdLienHe,
                    LoaiNguoiGui = "AI",
                    NoiDung = aiResponse,
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                };

                return PartialView("_SingleAiMessage", aiMsg);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadFileAI(IFormFile file)
        {
            var (userId, _, _) = GetUserSessionInfo();

            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có tệp tin nào được chọn.");
            }

            if (userId == null)
            {
                // Guest flow
                var guestHistoryJson = HttpContext.Session.GetString("GuestHistory");
                List<MessageViewModel> guestHistory = new List<MessageViewModel>();
                if (!string.IsNullOrEmpty(guestHistoryJson))
                {
                    guestHistory = System.Text.Json.JsonSerializer.Deserialize<List<MessageViewModel>>(guestHistoryJson) ?? new List<MessageViewModel>();
                }

                guestHistory.Add(new MessageViewModel
                {
                    IdTinNhan = guestHistory.Count + 1,
                    IdLienHe = 0,
                    LoaiNguoiGui = "KhachHang",
                    NoiDung = $"[Tệp đính kèm: {file.FileName}]",
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                });

                var uploadTempDir = Path.Combine(_env.WebRootPath, "uploads", "chat");
                if (!Directory.Exists(uploadTempDir)) Directory.CreateDirectory(uploadTempDir);
                var filePath = Path.Combine(uploadTempDir, Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName));
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                byte[] fileBytes;
                using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    fileBytes = ms.ToArray();
                }

                guestHistory.Last().Files.Add(new FileAttachmentViewModel
                {
                    IdFile = guestHistory.Count,
                    TenFile = file.FileName,
                    DuongDan = "/uploads/chat/" + Path.GetFileName(filePath),
                    LoaiFile = file.ContentType
                });

                var userMsgText = $"Đã tải lên tệp đính kèm: {file.FileName}";
                var aiResponse = await _chatService.GetAiMultimodalResponseAsync(0, userMsgText, fileBytes, file.ContentType, null);

                guestHistory.Add(new MessageViewModel
                {
                    IdTinNhan = guestHistory.Count + 1,
                    IdLienHe = 0,
                    LoaiNguoiGui = "AI",
                    NoiDung = aiResponse,
                    ThoiGian = DateTime.Now,
                    TrangThai = "Đã gửi"
                });

                HttpContext.Session.SetString("GuestHistory", System.Text.Json.JsonSerializer.Serialize(guestHistory));

                ViewData["CurrentUserId"] = 0;
                ViewData["CurrentUserRole"] = "KhachHang";

                return PartialView("_MessageList", guestHistory);
            }
            else
            {
                // Authenticated Customer Flow
                int? guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestLienHeId);

                if (guestLienHeId == null)
                {
                    HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
                }

                var msg = new TinNhan
                {
                    IdLienHe = conversation.IdLienHe,
                    LoaiNguoiGui = "KhachHang",
                    ThoiGian = DateTime.Now,
                    TinNhan1 = $"[Tệp đính kèm: {file.FileName}]",
                    TrangThai = "Đã gửi"
                };
                _context.TinNhans.Add(msg);
                await _context.SaveChangesAsync();

                var uploadResult = await SaveUploadedFile(msg.IdTinNhan, file);
                if (!uploadResult.Success)
                {
                    _context.TinNhans.Remove(msg);
                    await _context.SaveChangesAsync();
                    return BadRequest(uploadResult.ErrorMessage ?? "Lỗi khi lưu tệp đính kèm.");
                }

                byte[] fileBytes;
                using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    fileBytes = ms.ToArray();
                }

                var userMsgText = $"Đã tải lên tệp đính kèm: {file.FileName}";
                await _chatService.GetAiMultimodalResponseAsync(conversation.IdLienHe, userMsgText, fileBytes, file.ContentType, userId);

                return RedirectToAction("LayTinNhan", new { idLienHe = conversation.IdLienHe });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TaoPhieuTuDong([FromBody] PhieuViewModel model)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập để tạo phiếu hỗ trợ." });
            }

            var result = await _ticketService.CreateTicketAsync(model, userId.Value);
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> TraCuuPhieuChatBox()
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return PartialView("_TicketList", new List<PhieuHoTro>());
            }

            var tickets = await _context.PhieuHoTros
                .Include(p => p.IdDichVuNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Where(p => p.IdKhachHang == userId.Value)
                .OrderByDescending(p => p.NgayTao)
                .ToListAsync();

            return PartialView("_TicketList", tickets);
        }

        // ==========================================
        // 10. API GET SERVICE CARD DATA (SQL SERVER)
        // ==========================================
        [HttpGet]
        [Route("api/service/card-data/{id}")]
        public async Task<IActionResult> GetServiceCardData(int id)
        {
            var service = await _context.DichVus
                .Include(d => d.IdDanhMucNavigation)
                .FirstOrDefaultAsync(d => d.IdDichVu == id);

            if (service == null)
            {
                return Json(new { success = false, message = "Không tìm thấy dịch vụ." });
            }

            return Json(new
            {
                success = true,
                idDichVu = service.IdDichVu,
                idDanhMuc = service.IdDanhMuc,
                tenDichVu = service.TenDichVu,
                tenDanhMuc = service.IdDanhMucNavigation?.TenDanhMuc ?? "Hỗ trợ kỹ thuật",
                moTa = service.MoTa ?? "Dịch vụ hỗ trợ kỹ thuật Viettel Telecom.",
                hinhAnh = string.IsNullOrWhiteSpace(service.HinhAnh) ? "/assets/images/default-service.jpg" : service.HinhAnh,
                thoiGianXuLy = "1 - 2 ngày làm việc"
            });
        }

        // ==========================================
        // 11. API MULTIMODAL CHAT (IMAGES & FILES)
        // ==========================================
        [HttpPost]
        [Route("api/chat/send-multimodal")]
        public async Task<IActionResult> SendMultimodalMessage([FromBody] SupportTicketSysterm.Models.AiMessageRequestDto req)
        {
            var (userId, _, _) = GetUserSessionInfo();
            var guestSessionId = HttpContext.Session.GetInt32("GuestLienHeId");

            var conversation = await _chatService.GetOrCreateAiConversationAsync(userId, guestSessionId);
            if (guestSessionId == null && userId == null)
            {
                HttpContext.Session.SetInt32("GuestLienHeId", conversation.IdLienHe);
            }

            byte[]? fileBytes = null;
            if (!string.IsNullOrWhiteSpace(req.Base64File))
            {
                try
                {
                    var cleanBase64 = req.Base64File.Contains(",") ? req.Base64File.Split(',')[1] : req.Base64File;
                    fileBytes = Convert.FromBase64String(cleanBase64);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to decode base64 file");
                }
            }

            var promptMsg = string.IsNullOrWhiteSpace(req.Message) ? "Hãy phân tích hình ảnh/tệp vừa đính kèm." : req.Message;
            await _chatService.SaveCustomerMessageAsync(conversation.IdLienHe, promptMsg);

            string aiResponse;
            if (fileBytes != null && fileBytes.Length > 0)
            {
                aiResponse = await _chatService.GetAiMultimodalResponseAsync(conversation.IdLienHe, promptMsg, fileBytes, req.MimeType ?? "image/jpeg", userId);
            }
            else
            {
                aiResponse = await _chatService.GetAiResponseAndProcessActionsAsync(conversation.IdLienHe, promptMsg, userId);
            }

            return Json(new { success = true, idLienHe = conversation.IdLienHe, response = aiResponse });
        }

        // ==========================================
        // 12. API CREATE APPOINTMENT (FROM CHAT)
        // ==========================================
        [HttpPost]
        [Route("api/appointment/create-ai")]
        public async Task<IActionResult> CreateAppointmentAi([FromBody] SupportTicketSysterm.Models.CreateAppointmentAiDto req)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập để thực hiện đặt lịch hẹn." });
            }

            try
            {
                if (!DateTime.TryParse(req.NgayHen, out var ngayHenParsed))
                {
                    ngayHenParsed = DateTime.Today.AddDays(1);
                }

                TimeOnly.TryParse(req.GioHen, out var gioBatDau);
                var gioKetThuc = gioBatDau.AddHours(2);

                // Auto find assigned technician or pick available tech
                var availableTech = await _context.NhanViens
                    .Where(n => n.TrangThai == "Hoạt động" || n.TrangThai == "Hoạt Động")
                    .FirstOrDefaultAsync();

                var appt = new LichHen
                {
                    IdPhieu = req.TicketId,
                    IdNhanVien = availableTech?.IdNhanVien,
                    NgayHen = DateOnly.FromDateTime(ngayHenParsed),
                    GioBatDau = gioBatDau,
                    GioKetThuc = gioKetThuc,
                    DiaChiHoTro = string.IsNullOrWhiteSpace(req.DiaChi) ? "Địa chỉ đăng ký của khách hàng" : req.DiaChi,
                    GhiChu = req.GhiChu ?? "Đặt lịch qua Chatbox AI TechSupport",
                    TrangThai = "Đã xác nhận",
                    NgayTao = DateTime.Now
                };

                _context.LichHens.Add(appt);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Đặt lịch hẹn thành công!",
                    idLichHen = appt.IdLichHen,
                    tenKtv = availableTech?.HoTen ?? "Nguyễn Văn A",
                    sdtKtv = availableTech?.SoDienThoai ?? "1900 8119",
                    ngayHen = appt.NgayHen?.ToString("dd/MM/yyyy"),
                    gioHen = $"{appt.GioBatDau?.ToString("HH:mm")} - {appt.GioKetThuc?.ToString("HH:mm")}",
                    diaChi = appt.DiaChiHoTro,
                    trangThai = appt.TrangThai
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo lịch hẹn từ AI");
                return Json(new { success = false, message = "Lỗi tạo lịch hẹn: " + ex.Message });
            }
        }

        // ==========================================
        // 13. API CREATE TICKET (FROM AI CONFIRMATION CARD)
        // ==========================================
        [HttpPost]
        [Route("api/ticket/create-ai")]
        public async Task<IActionResult> CreateTicketAi([FromBody] SupportTicketSysterm.Models.CreateTicketAiDto req)
        {
            var (userId, _, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return Json(new { success = false, message = "Để tạo phiếu hỗ trợ và sắp xếp kỹ thuật viên, vui lòng đăng nhập tài khoản của bạn." });
            }

            try
            {
                // Auto find staff with least active workload
                var activeStaff = await _context.NhanViens
                    .Where(n => n.TrangThai == "Hoạt động" || n.TrangThai == "Hoạt Động")
                    .Select(n => new
                    {
                        Staff = n,
                        TicketCount = _context.PhieuHoTros.Count(p => p.IdNhanVien == n.IdNhanVien && (p.TrangThai == "Chờ tiếp nhận" || p.TrangThai == "Chờ xử lý" || p.TrangThai == "Đang xử lý"))
                    })
                    .OrderBy(x => x.TicketCount)
                    .FirstOrDefaultAsync();

                int? assignedStaffId = activeStaff?.Staff?.IdNhanVien;

                string maPhieu = $"PHT{DateTime.Now:yyyyMMddHHmmss}";

                string fullContent = string.IsNullOrWhiteSpace(req.Content) ? "Yêu cầu hỗ trợ kỹ thuật qua Chatbox AI" : req.Content;
                if (!string.IsNullOrWhiteSpace(req.Address) && !fullContent.Contains(req.Address))
                {
                    fullContent += $"\n[Địa chỉ hỗ trợ]: {req.Address}";
                }

                var newTicket = new PhieuHoTro
                {
                    MaPhieu = maPhieu,
                    IdKhachHang = userId.Value,
                    IdDichVu = (req.ServiceId.HasValue && req.ServiceId > 0) ? req.ServiceId.Value : null,
                    TieuDe = string.IsNullOrWhiteSpace(req.Title) ? "Khắc phục sự cố WiFi chập chờn" : req.Title,
                    NoiDung = fullContent,
                    TrangThai = "Chờ tiếp nhận",
                    MucDoUuTien = 2,
                    IdNhanVien = assignedStaffId,
                    NgayTao = DateOnly.FromDateTime(DateTime.Now),
                    NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
                };

                _context.PhieuHoTros.Add(newTicket);
                await _context.SaveChangesAsync();

                string dichVuName = "Khắc phục WiFi chập chờn";
                if (req.ServiceId.HasValue && req.ServiceId > 0)
                {
                    var dv = await _context.DichVus.FindAsync(req.ServiceId.Value);
                    if (dv != null) dichVuName = dv.TenDichVu;
                }

                string empName = activeStaff?.Staff?.HoTen ?? "Hệ thống sẽ tự động phân công kỹ thuật viên phù hợp";

                return Json(new
                {
                    success = true,
                    message = "Phiếu hỗ trợ của bạn đã được tạo thành công.",
                    maPhieu = newTicket.MaPhieu,
                    trangThai = newTicket.TrangThai ?? "Chờ tiếp nhận",
                    tenDichVu = dichVuName,
                    tenKtv = empName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo phiếu hỗ trợ từ AI");
                return Json(new { success = false, message = "Lỗi tạo phiếu hỗ trợ: " + ex.Message });
            }
        }

        // ==========================================
        // API UPDATE TICKET STATUS DIRECTLY FROM CHAT
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CapNhatTrangThaiPhieu(int idLienHe, string trangThaiMoi)
        {
            var (userId, role, hoTen) = GetUserSessionInfo();
            if (userId == null)
            {
                return Json(new { success = false, message = "Vui lòng đăng nhập." });
            }

            var lh = await _context.LienHes
                .Include(l => l.IdPhieuNavigation)
                .FirstOrDefaultAsync(l => l.IdLienHe == idLienHe);

            if (lh == null || lh.IdPhieuNavigation == null)
            {
                return Json(new { success = false, message = "Không tìm thấy phiếu hỗ trợ liên quan." });
            }

            var phieu = lh.IdPhieuNavigation;
            var trangThaiCu = phieu.TrangThai ?? "Chờ tiếp nhận";

            // Standardize 5 statuses
            string statusFormatted = trangThaiMoi switch
            {
                "0" or "Chờ tiếp nhận" or "ChoTiepNhan" => "Chờ tiếp nhận",
                "1" or "Đang xử lý" or "DangXuLy" => "Đang xử lý",
                "2" or "Chờ lịch hẹn" or "ChoLichHen" => "Chờ lịch hẹn",
                "3" or "Hoàn thành" or "HoanThanh" => "Hoàn thành",
                "4" or "Đã hủy" or "DaHuy" => "Đã hủy",
                _ => trangThaiMoi
            };

            // Staff assignment when accepting ticket
            if (statusFormatted == "Đang xử lý" && phieu.IdNhanVien == null && (role == "NhanVien" || role == "Admin" || role == "Nhân viên"))
            {
                phieu.IdNhanVien = userId;
                lh.IdNhanVien = userId;
            }

            phieu.TrangThai = statusFormatted;
            phieu.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);

            _context.PhieuHoTros.Update(phieu);
            _context.LienHes.Update(lh);

            // Save history
            var lichSu = new LichSuHoTro
            {
                IdPhieu = phieu.IdPhieu,
                TrangThaiCu = trangThaiCu,
                TrangThaiMoi = statusFormatted,
                NoiDungCapNhat = $"Trạng thái phiếu cập nhật từ '{trangThaiCu}' sang '{statusFormatted}' qua Chat.",
                IdNhanVien = (role == "KhachHang" ? null : userId),
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(lichSu);

            await _context.SaveChangesAsync();

            // Broadcast SignalR TicketStatusChanged
            try
            {
                var hubContext = HttpContext.RequestServices.GetRequiredService<IHubContext<LiveSupportHub>>();
                if (hubContext != null && !string.IsNullOrEmpty(phieu.MaPhieu))
                {
                    await hubContext.Clients.Group(phieu.MaPhieu).SendAsync("TicketStatusChanged", new
                    {
                        ticketCode = phieu.MaPhieu,
                        idPhieu = phieu.IdPhieu,
                        idLienHe = idLienHe,
                        trangThaiCu = trangThaiCu,
                        trangThaiMoi = statusFormatted,
                        updatedBy = hoTen
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi phát SignalR TicketStatusChanged");
            }

            return Json(new
            {
                success = true,
                message = $"Đã cập nhật trạng thái phiếu thành {statusFormatted}",
                trangThaiMoi = statusFormatted,
                maPhieu = phieu.MaPhieu
            });
        }

        // ==========================================
        // 9. NHẬN HỖ TRỢ (TIEP NHAN CHAT)
        // ==========================================
        [HttpPost]
        [Route("Chat/TiepNhanChat")]
        [Route("Chat/NhanHoTro")]
        public async Task<IActionResult> TiepNhanChat(int idLienHe)
        {
            var (userId, role, hoTen) = GetUserSessionInfo();
            if (userId == null) return Unauthorized(new { success = false, message = "Chưa đăng nhập." });

            var lienHe = await _context.LienHes.FirstOrDefaultAsync(l => l.IdLienHe == idLienHe);
            if (lienHe == null) return Json(new { success = false, message = "Cuộc trò chuyện không tồn tại." });

            if (lienHe.TrangThai != "Đang chờ" && lienHe.IdNhanVien != null && lienHe.IdNhanVien != userId)
            {
                return Json(new { success = false, message = "Cuộc trò chuyện này đã được nhân viên khác tiếp nhận." });
            }

            lienHe.IdNhanVien = userId.Value;
            lienHe.TrangThai = "Đang hỗ trợ";
            _context.LienHes.Update(lienHe);

            var sysMsg = new TinNhan
            {
                IdLienHe = lienHe.IdLienHe,
                LoaiNguoiGui = "Nhân viên",
                TinNhan1 = $"Kỹ thuật viên {hoTen} đã tiếp nhận cuộc trò chuyện.",
                TrangThai = "Đã gửi",
                ThoiGian = DateTime.Now
            };
            _context.TinNhans.Add(sysMsg);

            await _context.SaveChangesAsync();

            string groupName = $"Ticket_{lienHe.IdLienHe}";
            try
            {
                await _chatHubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", groupName, new {
                    idTinNhan = sysMsg.IdTinNhan,
                    idLienHe = lienHe.IdLienHe,
                    loaiNguoiGui = "Nhân viên",
                    tinNhan = sysMsg.TinNhan1,
                    thoiGian = sysMsg.ThoiGian?.ToString("HH:mm")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR Error on TiepNhanChat");
            }

            return Json(new { success = true, message = "Đã tiếp nhận cuộc trò chuyện thành công." });
        }

        // ==========================================
        // 10. TẠO PHIẾU HỖ TRỢ TỪ CHAT (CREATE TICKET)
        // ==========================================
        [HttpPost]
        [Route("Chat/TaoPhieuTuChat")]
        public async Task<IActionResult> TaoPhieuTuChat(int idLienHe, string tieuDe, string noiDung, int? idDichVu, int? mucDoUuTien, string? diaChi)
        {
            var (userId, role, hoTen) = GetUserSessionInfo();
            if (userId == null) return Unauthorized(new { success = false, message = "Chưa đăng nhập." });

            var lienHe = await _context.LienHes
                .Include(l => l.IdKhachHangNavigation)
                .FirstOrDefaultAsync(l => l.IdLienHe == idLienHe);

            if (lienHe == null) return Json(new { success = false, message = "Cuộc trò chuyện không tồn tại." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var countToday = await _context.PhieuHoTros.CountAsync();
                string maPhieu = $"PHT{(countToday + 1):D6}";

                var newPhieu = new PhieuHoTro
                {
                    MaPhieu = maPhieu,
                    IdKhachHang = lienHe.IdKhachHang,
                    IdNhanVien = lienHe.IdNhanVien ?? userId,
                    IdDichVu = idDichVu,
                    TieuDe = string.IsNullOrWhiteSpace(tieuDe) ? (lienHe.TieuDe ?? "Hỗ trợ sự cố kỹ thuật") : tieuDe.Trim(),
                    NoiDung = string.IsNullOrWhiteSpace(noiDung) ? (lienHe.NoiDung ?? "Tạo phiếu từ cuộc trò chuyện hỗ trợ trực tuyến.") : noiDung.Trim(),
                    MucDoUuTien = mucDoUuTien ?? 2,
                    TrangThai = "Chờ xử lý",
                    NgayTao = DateOnly.FromDateTime(DateTime.Now),
                    NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
                };

                _context.PhieuHoTros.Add(newPhieu);
                await _context.SaveChangesAsync();

                lienHe.IdPhieu = newPhieu.IdPhieu;
                _context.LienHes.Update(lienHe);

                var sysMsg = new TinNhan
                {
                    IdLienHe = lienHe.IdLienHe,
                    LoaiNguoiGui = "Hệ thống",
                    TinNhan1 = $"Hệ thống đã tạo Phiếu hỗ trợ {newPhieu.MaPhieu}.",
                    TrangThai = "Đã gửi",
                    ThoiGian = DateTime.Now
                };
                _context.TinNhans.Add(sysMsg);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                string groupName = $"Ticket_{lienHe.IdLienHe}";
                try
                {
                    await _chatHubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", groupName, new {
                        idTinNhan = sysMsg.IdTinNhan,
                        idLienHe = lienHe.IdLienHe,
                        loaiNguoiGui = "Hệ thống",
                        tinNhan = sysMsg.TinNhan1,
                        thoiGian = sysMsg.ThoiGian?.ToString("HH:mm")
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SignalR Error on TaoPhieuTuChat");
                }

                return Json(new { success = true, maPhieu = newPhieu.MaPhieu, idPhieu = newPhieu.IdPhieu, message = $"Hệ thống đã tạo Phiếu hỗ trợ {newPhieu.MaPhieu}." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Json(new { success = false, message = "Lỗi khi tạo phiếu hỗ trợ: " + ex.Message });
            }
        }

        // ==========================================
        // 11. KẾT THÚC HỖ TRỢ (CLOSE SUPPORT CHAT)
        // ==========================================
        [HttpPost]
        [Route("Chat/KetThucHoTro")]
        public async Task<IActionResult> KetThucHoTro(int idLienHe)
        {
            var (userId, role, hoTen) = GetUserSessionInfo();
            if (userId == null) return Unauthorized(new { success = false, message = "Chưa đăng nhập." });

            var lienHe = await _context.LienHes.FirstOrDefaultAsync(l => l.IdLienHe == idLienHe);
            if (lienHe == null) return Json(new { success = false, message = "Cuộc trò chuyện không tồn tại." });

            lienHe.TrangThai = "Đã hoàn thành";
            _context.LienHes.Update(lienHe);

            var sysMsg = new TinNhan
            {
                IdLienHe = lienHe.IdLienHe,
                LoaiNguoiGui = "Hệ thống",
                TinNhan1 = "Cuộc trò chuyện đã kết thúc. Xin cảm ơn Quý khách.",
                TrangThai = "Đã gửi",
                ThoiGian = DateTime.Now
            };
            _context.TinNhans.Add(sysMsg);

            await _context.SaveChangesAsync();

            string groupName = $"Ticket_{lienHe.IdLienHe}";
            try
            {
                await _chatHubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", groupName, new {
                    idTinNhan = sysMsg.IdTinNhan,
                    idLienHe = lienHe.IdLienHe,
                    loaiNguoiGui = "Hệ thống",
                    tinNhan = sysMsg.TinNhan1,
                    thoiGian = sysMsg.ThoiGian?.ToString("HH:mm")
                });
                await _chatHubContext.Clients.Group(groupName).SendAsync("ChatClosed", new { status = "Đã hoàn thành" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR Error on KetThucHoTro");
            }

            return Json(new { success = true, message = "Cuộc trò chuyện đã kết thúc." });
        }
    }
}

