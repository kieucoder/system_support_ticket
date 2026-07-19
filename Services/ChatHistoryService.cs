using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services
{
    public class ChatHistoryService
    {
        private readonly TechSupportContext _context;
        private static bool _dbInitialized = false;
        private static readonly object _dbLock = new object();

        public ChatHistoryService(TechSupportContext context)
        {
            _context = context;
        }

        private void InitializeDatabase()
        {
            if (_dbInitialized) return;
            lock (_dbLock)
            {
                if (_dbInitialized) return;
                try
                {
                    _context.Database.ExecuteSqlRaw(@"
                        IF OBJECT_ID('ChatMessages', 'U') IS NULL
                        BEGIN
                            CREATE TABLE ChatMessages (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                IdKhachHang INT NULL,
                                Message NVARCHAR(MAX) NOT NULL,
                                Role NVARCHAR(50) NOT NULL,
                                CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
                            );
                        END
                    ");
                    _dbInitialized = true;
                }
                catch (Exception)
                {
                    // Fail silently or log if context logging is available
                }
            }
        }

        public async Task SaveMessageAsync(int? idKhachHang, string message, string role)
        {
            InitializeDatabase();
            var chatMsg = new ChatMessage
            {
                IdKhachHang = idKhachHang,
                Message = message?.Trim() ?? "",
                Role = role ?? "user",
                CreatedAt = DateTime.Now
            };

            _context.ChatMessages.Add(chatMsg);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ChatMessage>> GetHistoryAsync(int? idKhachHang, int limit = 20)
        {
            InitializeDatabase();
            if (idKhachHang.HasValue)
            {
                return await _context.ChatMessages
                    .Where(m => m.IdKhachHang == idKhachHang.Value)
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(limit)
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();
            }
            else
            {
                // Retrieve all guest messages (IdKhachHang == null) as general context
                // In production, this can be filtered or just empty for guests
                return new List<ChatMessage>();
            }
        }
    }
}
