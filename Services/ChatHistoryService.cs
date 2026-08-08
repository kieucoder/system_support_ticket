using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Services
{
    public class ChatHistoryService
    {
        private readonly TechSupportContext _context;

        public ChatHistoryService(TechSupportContext context)
        {
            _context = context;
        }

        public async Task SaveMessageAsync(int? idKhachHang, string message, string role)
        {
            // TinNhan entities are persisted via ChatService / LiveSupportService linked to LienHe.
            await Task.CompletedTask;
        }

        public async Task<List<TinNhan>> GetHistoryAsync(int? idKhachHang, int limit = 20)
        {
            if (idKhachHang.HasValue)
            {
                return await _context.TinNhans
                    .Include(t => t.IdLienHeNavigation)
                    .Where(t => t.IdLienHeNavigation != null && t.IdLienHeNavigation.IdKhachHang == idKhachHang.Value)
                    .OrderByDescending(t => t.ThoiGian)
                    .Take(limit)
                    .OrderBy(t => t.ThoiGian)
                    .ToListAsync();
            }
            return new List<TinNhan>();
        }
    }
}
