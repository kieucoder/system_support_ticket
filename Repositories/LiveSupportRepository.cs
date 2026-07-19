using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Repositories
{
    public class LiveSupportRepository : ILiveSupportRepository
    {
        private readonly TechSupportContext _context;

        public LiveSupportRepository(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<PhieuHoTro?> GetTicketByCodeAsync(string maPhieu)
        {
            return await _context.PhieuHoTros
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .FirstOrDefaultAsync(p => p.MaPhieu == maPhieu);
        }

        public async Task<LienHe?> GetLienHeByTicketIdAsync(int idPhieu)
        {
            return await _context.LienHes
                .Include(lh => lh.IdKhachHangNavigation)
                .Include(lh => lh.IdNhanVienNavigation)
                .FirstOrDefaultAsync(lh => lh.IdPhieu == idPhieu);
        }

        public async Task<LienHe> CreateLienHeAsync(LienHe lienHe)
        {
            _context.LienHes.Add(lienHe);
            await _context.SaveChangesAsync();
            return lienHe;
        }

        public async Task<List<TinNhan>> GetMessagesByLienHeIdAsync(int idLienHe)
        {
            return await _context.TinNhans
                .Include(t => t.FileDinhKems)
                .Where(t => t.IdLienHe == idLienHe)
                .OrderBy(t => t.ThoiGian)
                .ToListAsync();
        }

        public async Task<TinNhan> SaveMessageAsync(TinNhan message)
        {
            _context.TinNhans.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }

        public async Task SaveFileAttachmentAsync(FileDinhKem file)
        {
            _context.FileDinhKems.Add(file);
            await _context.SaveChangesAsync();
        }

        public async Task MarkAsReadAsync(int idLienHe, string readerRole)
        {
            // If the customer is reading, mark all staff messages as read
            // If the staff is reading, mark all customer messages as read
            string senderToMark = readerRole == "Customer" ? "NhanVien" : "KhachHang";

            var unreadMessages = await _context.TinNhans
                .Where(t => t.IdLienHe == idLienHe && t.LoaiNguoiGui == senderToMark && t.TrangThai != "Đã xem")
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.TrangThai = "Đã xem";
            }

            if (unreadMessages.Any())
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task<NhanVien?> GetStaffByIdAsync(int idNhanVien)
        {
            return await _context.NhanViens.FindAsync(idNhanVien);
        }

        public async Task<KhachHang?> GetCustomerByIdAsync(int idKhachHang)
        {
            return await _context.KhachHangs.FindAsync(idKhachHang);
        }
    }
}
