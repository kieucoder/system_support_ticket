using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using System.Security.Claims;
using SupportTicketSysterm.Services;
using ChatViewModel = SupportTicketSysterm.ViewModels.ChatViewModel;

namespace SupportTicketSysterm.Controllers
{
    public class ChatController : Controller
    {
        private readonly TechSupportContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ChatController> _logger;
        private readonly IChatService _chatService;
        private readonly ITicketService _ticketService;

        public ChatController(
            TechSupportContext context,
            IWebHostEnvironment env,
            ILogger<ChatController> logger,
            IChatService chatService,
            ITicketService ticketService)
        {
            _context = context;
            _env = env;
            _logger = logger;
            _chatService = chatService;
            _ticketService = ticketService;
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

            var viewModel = new ChatViewModel
            {
                CurrentUserId = userId.Value,
                CurrentUserRole = role,
                SelectedIdLienHe = id
            };

            // Query LienHe and Include related data
            var query = _context.LienHes
                .Include(lh => lh.IdKhachHangNavigation)
                .Include(lh => lh.IdNhanVienNavigation)
                .Include(lh => lh.IdPhieuNavigation)
                    .ThenInclude(p => p!.IdDichVuNavigation)
                .Include(lh => lh.TinNhans)
                .AsQueryable();

            // Role filtering
            if (role == "KhachHang")
            {
                query = query.Where(lh => lh.IdKhachHang == userId.Value);
                ViewBag.Tickets = await _context.PhieuHoTros
                    .Where(p => p.IdKhachHang == userId.Value)
                    .ToListAsync();
            }
            else if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                query = query.Where(lh => lh.IdNhanVien == userId.Value);
            }
            // Admin role sees all (no filtering)

            var lienHes = await query
                .OrderByDescending(lh => lh.ThoiGianGui)
                .ToListAsync();

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
                    MaPhieu = lh.IdPhieuNavigation?.MaPhieu ?? "",
                    TieuDePhieu = lh.IdPhieuNavigation?.TieuDe ?? "",
                    TrangThaiPhieu = lh.IdPhieuNavigation?.TrangThai ?? "",
                    DichVuPhieu = lh.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "",
                    ThoiGianGui = lh.ThoiGianGui,
                    TrangThai = lh.TrangThai ?? "Đang xử lý",
                    SoTinChuaDoc = lh.SoTinChuaDoc ?? 0,
                    TinChuaDocKhach = lh.TinChuaDocKhach ?? 0,
                    LastMessage = lastMsgText
                });
            }

            // If a conversation is selected, load its messages and details
            if (id.HasValue)
            {
                var activeLh = lienHes.FirstOrDefault(x => x.IdLienHe == id.Value);
                if (activeLh != null)
                {
                    // Update read count
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

                    // Set Active Conversation
                    var lastMsg = activeLh.TinNhans.OrderByDescending(t => t.ThoiGian).FirstOrDefault();
                    viewModel.ActiveConversation = new ConversationViewModel
                    {
                        IdLienHe = activeLh.IdLienHe,
                        TieuDe = activeLh.TieuDe,
                        TenKhachHang = activeLh.IdKhachHangNavigation?.HoTen ?? "Khách hàng vãng lai",
                        TenNhanVien = activeLh.IdNhanVienNavigation?.HoTen ?? "Chưa phân công",
                        IdPhieu = activeLh.IdPhieu,
                        MaPhieu = activeLh.IdPhieuNavigation?.MaPhieu ?? "",
                        TieuDePhieu = activeLh.IdPhieuNavigation?.TieuDe ?? "",
                        TrangThaiPhieu = activeLh.IdPhieuNavigation?.TrangThai ?? "",
                        DichVuPhieu = activeLh.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "",
                        ThoiGianGui = activeLh.ThoiGianGui,
                        TrangThai = activeLh.TrangThai,
                        SoTinChuaDoc = activeLh.SoTinChuaDoc ?? 0,
                        TinChuaDocKhach = activeLh.TinChuaDocKhach ?? 0,
                        LastMessage = lastMsg != null ? (lastMsg.TinNhan1 ?? "[Tệp đính kèm]") : ""
                    };

                    // Load Messages
                    var messages = await _context.TinNhans
                        .Include(m => m.FileDinhKems)
                        .Where(m => m.IdLienHe == id.Value)
                        .OrderBy(m => m.ThoiGian)
                        .ToListAsync();

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
        // 3. GUI TIN NHAN ACTION (Post Message)
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuiTinNhan(int idLienHe, string? messageText, IFormFile? file)
        {
            var (userId, role, _) = GetUserSessionInfo();
            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (string.IsNullOrWhiteSpace(messageText) && file == null)
            {
                TempData["Error"] = "Vui lòng nhập nội dung tin nhắn hoặc đính kèm tệp.";
                return RedirectToAction("Index", new { id = idLienHe });
            }

            var lh = await _context.LienHes.FindAsync(idLienHe);
            if (lh == null)
            {
                return NotFound();
            }

            // Save Message Record
            var msg = new TinNhan
            {
                IdLienHe = idLienHe,
                LoaiNguoiGui = (role == "KhachHang" ? "KhachHang" : "NhanVien"),
                ThoiGian = DateTime.Now,
                TinNhan1 = messageText?.Trim(),
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(msg);
            await _context.SaveChangesAsync(); // save to generate IdTinNhan for file link

            // Handle file upload if present
            if (file != null && file.Length > 0)
            {
                var fileUploadResult = await SaveUploadedFile(msg.IdTinNhan, file);
                if (!fileUploadResult.Success)
                {
                    TempData["Error"] = fileUploadResult.ErrorMessage;
                    // remove message to maintain integrity
                    _context.TinNhans.Remove(msg);
                    await _context.SaveChangesAsync();
                    return RedirectToAction("Index", new { id = idLienHe });
                }
            }

            // Update LienHe status
            lh.ThoiGianGui = DateTime.Now;
            if (role == "KhachHang")
            {
                lh.SoTinChuaDoc = (lh.SoTinChuaDoc ?? 0) + 1; // unread for staff
            }
            else
            {
                lh.TinChuaDocKhach = (lh.TinChuaDocKhach ?? 0) + 1; // unread for customer
            }

            _context.LienHes.Update(lh);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { id = idLienHe });
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

                guestHistory.Last().Files.Add(new FileAttachmentViewModel
                {
                    IdFile = guestHistory.Count,
                    TenFile = file.FileName,
                    DuongDan = "/uploads/chat/" + Path.GetFileName(filePath),
                    LoaiFile = file.ContentType
                });

                var userMsgText = $"Đã tải lên tệp đính kèm: {file.FileName}";
                var aiResponse = await _chatService.GetAiResponseAndProcessActionsAsync(0, userMsgText, null);

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

                var userMsgText = $"Đã tải lên tệp đính kèm: {file.FileName}";
                await _chatService.GetAiResponseAndProcessActionsAsync(conversation.IdLienHe, userMsgText, userId);

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
    }
}
