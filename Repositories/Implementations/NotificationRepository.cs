using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Repositories.Interfaces;

namespace SupportTicketSysterm.Repositories.Implementations
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly TechSupportContext _context;

        public NotificationRepository(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<List<PhieuHoTro>> GetTicketsForCustomerAsync(int idKhachHang)
        {
            return await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.IdDichVuNavigation)
                .Where(p => p.IdKhachHang == idKhachHang)
                .OrderByDescending(p => p.NgayTao)
                .Take(50)
                .ToListAsync();
        }

        public async Task<List<LichHen>> GetAppointmentsForCustomerAsync(int idKhachHang)
        {
            return await _context.LichHens
                .AsNoTracking()
                .Include(l => l.IdNhanVienNavigation)
                .Include(l => l.IdPhieuNavigation)
                .Where(l => l.IdPhieuNavigation != null && l.IdPhieuNavigation.IdKhachHang == idKhachHang)
                .OrderByDescending(l => l.NgayHen)
                .Take(50)
                .ToListAsync();
        }

        public async Task<List<TinNhan>> GetStaffMessagesForCustomerAsync(int idKhachHang)
        {
            return await (from tn in _context.TinNhans.AsNoTracking()
                          join lh in _context.LienHes.AsNoTracking() on tn.IdLienHe equals lh.IdLienHe
                          where lh.IdKhachHang == idKhachHang && (tn.LoaiNguoiGui == "NhanVien" || tn.LoaiNguoiGui == "Employee" || tn.LoaiNguoiGui == "AI")
                          orderby tn.ThoiGian descending
                          select tn)
                         .Take(50)
                         .ToListAsync();
        }

        public async Task<List<DanhGium>> GetRatingsForCustomerAsync(int idKhachHang)
        {
            return await (from dg in _context.DanhGia.AsNoTracking()
                          join p in _context.PhieuHoTros.AsNoTracking() on dg.IdPhieu equals p.IdPhieu
                          where p.IdKhachHang == idKhachHang
                          orderby dg.NgayDanhGia descending
                          select dg)
                         .Take(50)
                         .ToListAsync();
        }
    }
}
