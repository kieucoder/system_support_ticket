using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Services
{
    public interface IRatingService
    {
        Task<DanhGium> RateTicketAsync(string maPhieu, int rating, string? comment);
    }

    public class RatingService : IRatingService
    {
        private readonly TechSupportContext _context;

        public RatingService(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<DanhGium> RateTicketAsync(string maPhieu, int rating, string? comment)
        {
            var ticket = await _context.PhieuHoTros.FirstOrDefaultAsync(p => p.MaPhieu == maPhieu);
            if (ticket == null) throw new ArgumentException("Mã phiếu không tồn tại.");

            // Check if rating already exists
            var existingRating = await _context.DanhGia.FirstOrDefaultAsync(dg => dg.IdPhieu == ticket.IdPhieu);
            if (existingRating != null)
            {
                existingRating.ChatLuongDichVu = rating;
                existingRating.ThaiDoNhanVien = rating;
                existingRating.TocDoXuLy = rating;
                existingRating.NhanXet = comment;
                existingRating.NgayDanhGia = DateTime.Now;
                _context.DanhGia.Update(existingRating);
                await _context.SaveChangesAsync();
                return existingRating;
            }

            var newRating = new DanhGium
            {
                IdPhieu = ticket.IdPhieu,
                ChatLuongDichVu = rating,
                ThaiDoNhanVien = rating,
                TocDoXuLy = rating,
                NhanXet = comment,
                NgayDanhGia = DateTime.Now
            };

            _context.DanhGia.Add(newRating);
            await _context.SaveChangesAsync();

            return newRating;
        }
    }
}
