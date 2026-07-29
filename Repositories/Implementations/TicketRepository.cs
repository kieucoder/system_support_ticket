using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Repositories.Interfaces;

namespace SupportTicketSysterm.Repositories.Implementations
{
    public class TicketRepository : ITicketRepository
    {
        private readonly TechSupportContext _context;

        public TicketRepository(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<PhieuHoTro?> GetByTicketCodeAsync(string ticketCode)
        {
            if (string.IsNullOrWhiteSpace(ticketCode)) return null;

            var codeClean = ticketCode.Trim();
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.FileDinhKems)
                .Include(p => p.DanhGium)
                .FirstOrDefaultAsync(p => p.MaPhieu == codeClean || (p.MaPhieu != null && p.MaPhieu.Contains(codeClean)));
        }

        public async Task<PhieuHoTro?> GetLatestTicketByCustomerAsync(int idKhachHang)
        {
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.FileDinhKems)
                .Include(p => p.DanhGium)
                .Where(p => p.IdKhachHang == idKhachHang)
                .OrderByDescending(p => p.NgayTao)
                .ThenByDescending(p => p.IdPhieu)
                .FirstOrDefaultAsync();
        }

        public async Task<LichHen?> GetAppointmentByTicketIdAsync(int idPhieu)
        {
            return await _context.LichHens
                .AsNoTracking()
                .Include(l => l.IdNhanVienNavigation)
                .Where(l => l.IdPhieu == idPhieu)
                .OrderByDescending(l => l.NgayHen)
                .FirstOrDefaultAsync();
        }

        public async Task<List<FileDinhKem>> GetAttachmentsByTicketIdAsync(int idPhieu)
        {
            return await _context.FileDinhKems
                .AsNoTracking()
                .Where(f => f.IdPhieu == idPhieu)
                .OrderByDescending(f => f.NgayUpload)
                .ToListAsync();
        }

        public async Task<List<TinNhan>> GetMessagesByTicketIdAsync(int idPhieu, int limit = 20)
        {
            // Find linked LienHe for ticket
            var lienHeId = await _context.LienHes
                .AsNoTracking()
                .Where(lh => lh.IdPhieu == idPhieu)
                .Select(lh => (int?)lh.IdLienHe)
                .FirstOrDefaultAsync();

            if (!lienHeId.HasValue) return new List<TinNhan>();

            return await _context.TinNhans
                .AsNoTracking()
                .Where(t => t.IdLienHe == lienHeId.Value)
                .OrderByDescending(t => t.ThoiGian)
                .Take(limit)
                .OrderBy(t => t.ThoiGian)
                .ToListAsync();
        }

        public async Task<DanhGium?> GetRatingByTicketIdAsync(int idPhieu)
        {
            return await _context.DanhGia
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.IdPhieu == idPhieu);
        }

        public async Task<List<PhieuHoTro>> GetTicketsByEmployeeAsync(int idNhanVien)
        {
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.DanhGium)
                .Where(p => p.IdNhanVien == idNhanVien)
                .OrderByDescending(p => p.NgayTao)
                .ThenByDescending(p => p.IdPhieu)
                .ToListAsync();
        }

        public async Task<List<PhieuHoTro>> GetAllTicketsAsync()
        {
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.DanhGium)
                .OrderByDescending(p => p.NgayTao)
                .ThenByDescending(p => p.IdPhieu)
                .ToListAsync();
        }

        public async Task<PhieuHoTro?> GetTicketByIdForEmployeeAsync(int idPhieu, int idNhanVien)
        {
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.FileDinhKems)
                .Include(p => p.DanhGium)
                .FirstOrDefaultAsync(p => p.IdPhieu == idPhieu && p.IdNhanVien == idNhanVien);
        }

        public async Task<PhieuHoTro?> GetTicketByIdAsync(int idPhieu)
        {
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.FileDinhKems)
                .Include(p => p.DanhGium)
                .FirstOrDefaultAsync(p => p.IdPhieu == idPhieu);
        }
    }
}
