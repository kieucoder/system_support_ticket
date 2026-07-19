using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class ChatService : IChatService
    {
        private readonly TechSupportContext _context;
        private readonly IGeminiService _geminiService;
        private readonly ITicketService _ticketService;
        private readonly PromptBuilderService _promptBuilder;
        private readonly ChatHistoryService _chatHistory;
        private readonly ILogger<ChatService> _logger;

        public class CreateTicketTagParams
        {
            public int ServiceId { get; set; }
            public string Title { get; set; }
            public string Content { get; set; }
            public int Priority { get; set; }
        }

        public ChatService(
            TechSupportContext context,
            IGeminiService geminiService,
            ITicketService ticketService,
            PromptBuilderService promptBuilder,
            ChatHistoryService chatHistory,
            ILogger<ChatService> logger)
        {
            _context = context;
            _geminiService = geminiService;
            _ticketService = ticketService;
            _promptBuilder = promptBuilder;
            _chatHistory = chatHistory;
            _logger = logger;
        }

        // ==========================================
        // 1. GET OR CREATE AI CONVERSATION (With Guest Support)
        // ==========================================
        public async Task<LienHe> GetOrCreateAiConversationAsync(int? idKhachHang, int? idLienHeFromSession = null)
        {
            var title = "Trò chuyện với AI Hỗ trợ";
            LienHe? conversation = null;

            if (idKhachHang.HasValue)
            {
                // Authenticated Flow
                // First try to find existing AI conversation for this user
                conversation = await _context.LienHes
                    .Include(lh => lh.IdKhachHangNavigation)
                    .Include(lh => lh.IdNhanVienNavigation)
                    .Include(lh => lh.IdPhieuNavigation)
                    .FirstOrDefaultAsync(lh => lh.IdKhachHang == idKhachHang.Value && lh.TieuDe == title);

                // If not found but they had a guest session active before login, migrate/link it!
                if (conversation == null && idLienHeFromSession.HasValue)
                {
                    conversation = await _context.LienHes.FindAsync(idLienHeFromSession.Value);
                    if (conversation != null && conversation.IdKhachHang == null)
                    {
                        conversation.IdKhachHang = idKhachHang.Value;
                        _context.LienHes.Update(conversation);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Migrated guest conversation {IdLienHe} to customer {IdKhachHang}", conversation.IdLienHe, idKhachHang.Value);
                    }
                }
            }
            else if (idLienHeFromSession.HasValue)
            {
                // Guest Flow (already has a session conversation ID)
                conversation = await _context.LienHes
                    .Include(lh => lh.IdKhachHangNavigation)
                    .Include(lh => lh.IdNhanVienNavigation)
                    .Include(lh => lh.IdPhieuNavigation)
                    .FirstOrDefaultAsync(lh => lh.IdLienHe == idLienHeFromSession.Value);
            }

            // If still no conversation, create a new one!
            if (conversation == null)
            {
                conversation = new LienHe
                {
                    IdKhachHang = idKhachHang,
                    TieuDe = title,
                    ThoiGianGui = DateTime.Now,
                    TrangThai = "Đang trao đổi",
                    SoTinChuaDoc = 0,
                    TinChuaDocKhach = 0,
                    NgayTao = DateOnly.FromDateTime(DateTime.Now)
                };

                _context.LienHes.Add(conversation);
                await _context.SaveChangesAsync();

                // Create initial welcome message from AI
                var welcomeMessage = new TinNhan
                {
                    IdLienHe = conversation.IdLienHe,
                    LoaiNguoiGui = "AI",
                    ThoiGian = DateTime.Now,
                    TinNhan1 = "Xin chào! Tôi là trợ lý ảo hỗ trợ kỹ thuật TechSupport của Viettel Telecom. Tôi có thể giúp gì cho bạn hôm nay?",
                    TrangThai = "Đã gửi"
                };
                _context.TinNhans.Add(welcomeMessage);
                await _context.SaveChangesAsync();
            }

            return conversation;
        }

        // ==========================================
        // 2. GET CONVERSATION MESSAGES
        // ==========================================
        public async Task<List<TinNhan>> GetConversationMessagesAsync(int idLienHe)
        {
            return await _context.TinNhans
                .Include(t => t.FileDinhKems)
                .Where(t => t.IdLienHe == idLienHe)
                .OrderBy(t => t.ThoiGian)
                .ToListAsync();
        }

        // ==========================================
        // 3. SAVE CUSTOMER MESSAGE
        // ==========================================
        public async Task<TinNhan> SaveCustomerMessageAsync(int idLienHe, string content)
        {
            var msg = new TinNhan
            {
                IdLienHe = idLienHe,
                LoaiNguoiGui = "KhachHang",
                ThoiGian = DateTime.Now,
                TinNhan1 = content?.Trim(),
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(msg);

            var lh = await _context.LienHes.FindAsync(idLienHe);
            if (lh != null)
            {
                lh.ThoiGianGui = DateTime.Now;
                _context.LienHes.Update(lh);
            }

            await _context.SaveChangesAsync();
            return msg;
        }

        // ==========================================
        // 4. SAVE AI MESSAGE
        // ==========================================
        public async Task<TinNhan> SaveAiMessageAsync(int idLienHe, string content)
        {
            var msg = new TinNhan
            {
                IdLienHe = idLienHe,
                LoaiNguoiGui = "AI",
                ThoiGian = DateTime.Now,
                TinNhan1 = content?.Trim(),
                TrangThai = "Đã gửi"
            };

            _context.TinNhans.Add(msg);

            var lh = await _context.LienHes.FindAsync(idLienHe);
            if (lh != null)
            {
                lh.ThoiGianGui = DateTime.Now;
                _context.LienHes.Update(lh);
            }

            await _context.SaveChangesAsync();
            return msg;
        }

        // ==========================================
        // 5. GET AI RESPONSE & PARSE ACTIONS
        // ==========================================
        public async Task<string> GetAiResponseAndProcessActionsAsync(int idLienHe, string userMessage, int? idKhachHang)
        {
            try
            {
                // Save user message to database log via ChatHistoryService
                await _chatHistory.SaveMessageAsync(idKhachHang, userMessage, "user");

                // Fetch list of active services and categories from SQL Server
                var activeServices = await _context.DichVus
                    .Where(d => d.TrangThai == "Hoạt động" || d.TrangThai == "Hoạt Động")
                    .ToListAsync();

                var activeCategories = await _context.DanhMucs
                    .Where(d => d.TrangThai == "Hoạt động" || d.TrangThai == "Hoạt Động")
                    .ToListAsync();

                bool isLoggedIn = idKhachHang.HasValue;
                string customerName = "";
                List<PhieuHoTro> customerTickets = new List<PhieuHoTro>();
                List<LichHen> customerAppointments = new List<LichHen>();

                if (isLoggedIn)
                {
                    var kh = await _context.KhachHangs.FindAsync(idKhachHang.Value);
                    if (kh != null)
                    {
                        customerName = kh.HoTen ?? "";
                    }

                    customerTickets = await _context.PhieuHoTros
                        .Include(p => p.IdDichVuNavigation)
                        .Include(p => p.IdNhanVienNavigation)
                        .Where(p => p.IdKhachHang == idKhachHang.Value)
                        .OrderByDescending(p => p.NgayTao)
                        .ToListAsync();

                    customerAppointments = await _context.LichHens
                        .Include(lh => lh.IdNhanVienNavigation)
                        .Where(lh => lh.IdPhieuNavigation != null && lh.IdPhieuNavigation.IdKhachHang == idKhachHang.Value)
                        .OrderByDescending(lh => lh.NgayHen)
                        .ToListAsync();
                }

                // Build System Instruction Prompt dynamically
                var systemInstruction = _promptBuilder.BuildSystemInstruction(
                    activeServices,
                    activeCategories,
                    isLoggedIn,
                    customerName,
                    customerTickets,
                    customerAppointments
                );

                // Fetch recent chat history for context
                List<TinNhan> history = new List<TinNhan>();
                if (idLienHe > 0)
                {
                    history = await GetConversationMessagesAsync(idLienHe);
                }
                var historyText = string.Join("\n", history.TakeLast(10).Select(h => $"{h.LoaiNguoiGui}: {h.TinNhan1}"));

                // Call Gemini Service
                var fullPrompt = $"{historyText}\nKhachHang: {userMessage}\nAI:";
                var response = await _geminiService.SendPromptAsync(systemInstruction, fullPrompt);

                // Post-process: strip any leaked technical ID metadata from AI response
                response = CleanAiResponse(response);

                // Save AI message response to standard SQL Server chat history if applicable
                if (idLienHe > 0)
                {
                    await SaveAiMessageAsync(idLienHe, response);
                }

                // Save AI response to database log via ChatHistoryService
                await _chatHistory.SaveMessageAsync(idKhachHang, response, "model");

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI Response in ChatService");
                var errorMsg = "Xin lỗi, hiện tại hệ thống AI đang gặp trục trặc kỹ thuật. Tôi sẽ phản hồi lại cho bạn sớm nhất.";
                if (idLienHe > 0)
                {
                    await SaveAiMessageAsync(idLienHe, errorMsg);
                }
                await _chatHistory.SaveMessageAsync(idKhachHang, errorMsg, "model");
                return errorMsg;
            }
        }
        // ==========================================
        // 6. CLEAN AI RESPONSE — Remove leaked technical metadata
        // ==========================================
        private static string CleanAiResponse(string response)
        {
            if (string.IsNullOrEmpty(response)) return response;

            // Remove patterns like: (Danh mục ID: 12), Danh mục ID: 12, [Danh mục ID: 12]
            response = System.Text.RegularExpressions.Regex.Replace(
                response,
                @"[\(\[\s]*Danh\s*m[ụu]c\s*ID\s*:\s*\d+[\)\]\s,;.]*",
                " ",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            // Remove patterns like: (ID dịch vụ: 5), ID dịch vụ: 5
            response = System.Text.RegularExpressions.Regex.Replace(
                response,
                @"[\(\[\s]*ID\s*d[iị]ch\s*v[ụu]\s*:\s*\d+[\)\]\s,;.]*",
                " ",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            // Remove patterns like: ServiceId=5, CategoryId=12
            response = System.Text.RegularExpressions.Regex.Replace(
                response,
                @"[\(\[]?\s*(ServiceId|CategoryId|ServiceID|CategoryID)\s*=\s*\d+\s*[\)\]]?[,;.]?\s*",
                " ",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            // Remove patterns like: (ID: 12), (id: 5)
            response = System.Text.RegularExpressions.Regex.Replace(
                response,
                @"\(\s*[Ii][Dd]\s*:\s*\d+\s*\)",
                string.Empty);

            // Collapse multiple spaces/newlines left by removals
            response = System.Text.RegularExpressions.Regex.Replace(response, @"[ \t]{2,}", " ");
            response = System.Text.RegularExpressions.Regex.Replace(response, @"\n{3,}", "\n\n");

            return response.Trim();
        }
    }
}
