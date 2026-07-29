using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Repositories.Interfaces;

namespace SupportTicketSysterm.Repositories.Implementations
{
    public class DanhGiaRepository : IDanhGiaRepository
    {
        private readonly TechSupportContext _context;

        public DanhGiaRepository(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<DanhGium?> GetByIdAsync(int idDanhGia)
        {
            return await _context.DanhGia.FirstOrDefaultAsync(d => d.IdDanhGia == idDanhGia);
        }

        public async Task<DanhGium?> GetByIdWithDetailsAsync(int idDanhGia)
        {
            return await _context.DanhGia
                .AsNoTracking()
                .Include(d => d.IdPhieuNavigation)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .Include(d => d.IdPhieuNavigation)
                    .ThenInclude(p => p.IdNhanVienNavigation)
                .Include(d => d.IdPhieuNavigation)
                    .ThenInclude(p => p.IdDichVuNavigation)
                        .ThenInclude(dv => dv.IdDanhMucNavigation)
                .Include(d => d.FileDinhKems)
                .Include(d => d.IdNhanVienPhanHoiNavigation)
                .FirstOrDefaultAsync(d => d.IdDanhGia == idDanhGia);
        }

        public async Task<List<DanhGium>> GetAllWithDetailsAsync()
        {
            return await _context.DanhGia
                .AsNoTracking()
                .Include(d => d.IdPhieuNavigation)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .Include(d => d.IdPhieuNavigation)
                    .ThenInclude(p => p.IdNhanVienNavigation)
                .Include(d => d.IdPhieuNavigation)
                    .ThenInclude(p => p.IdDichVuNavigation)
                        .ThenInclude(dv => dv.IdDanhMucNavigation)
                .Include(d => d.FileDinhKems)
                .Include(d => d.IdNhanVienPhanHoiNavigation)
                .ToListAsync();
        }

        public async Task UpdateResponseAsync(int idDanhGia, string phanHoi, int idNhanVienPhanHoi)
        {
            var evaluation = await _context.DanhGia.FindAsync(idDanhGia);
            if (evaluation != null)
            {
                evaluation.PhanHoiNhanVien = phanHoi;
                evaluation.NgayPhanHoi = DateTime.Now;
                evaluation.IdNhanVienPhanHoi = idNhanVienPhanHoi;

                _context.DanhGia.Update(evaluation);
                await _context.SaveChangesAsync();
            }
        }
    }
}
