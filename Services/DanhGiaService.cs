using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Repositories.Interfaces;
using SupportTicketSysterm.ViewModels;

namespace SupportTicketSysterm.Services
{
    public class DanhGiaService : IDanhGiaService
    {
        private readonly TechSupportContext _context;
        private readonly IDanhGiaRepository _danhGiaRepository;

        public DanhGiaService(TechSupportContext context, IDanhGiaRepository danhGiaRepository)
        {
            _context = context;
            _danhGiaRepository = danhGiaRepository;
        }

        public async Task<bool> CanUserReplyRatingAsync(int idDanhGia, int userId, string role)
        {
            if (role == "Admin") return true;

            var evaluation = await _context.DanhGia
                .AsNoTracking()
                .Include(d => d.IdPhieuNavigation)
                .FirstOrDefaultAsync(d => d.IdDanhGia == idDanhGia);

            if (evaluation == null || evaluation.IdPhieuNavigation == null) return false;

            if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                return evaluation.IdPhieuNavigation.IdNhanVien == userId;
            }

            return false;
        }

        public async Task<DanhGiaChiTietViewModel?> GetRatingForReplyAsync(int idDanhGia, int userId, string role)
        {
            var dg = await _danhGiaRepository.GetByIdWithDetailsAsync(idDanhGia);
            if (dg == null) return null;

            bool canReply = false;
            int? staffIdOfTicket = dg.IdPhieuNavigation?.IdNhanVien;

            if (role == "Admin")
            {
                canReply = true;
            }
            else if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                canReply = (staffIdOfTicket == userId);
            }

            double avg = ((dg.ChatLuongDichVu ?? 0) + (dg.ThaiDoNhanVien ?? 0) + (dg.TocDoXuLy ?? 0)) / 3.0;

            return new DanhGiaChiTietViewModel
            {
                IdDanhGia = dg.IdDanhGia,
                IdPhieu = dg.IdPhieu ?? 0,
                MaPhieu = dg.IdPhieuNavigation?.MaPhieu ?? "N/A",
                TieuDePhieu = dg.IdPhieuNavigation?.TieuDe ?? "N/A",
                HoTenKhachHang = dg.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "N/A",
                HoTenNhanVien = dg.IdPhieuNavigation?.IdNhanVienNavigation?.HoTen ?? "N/A",
                TenDanhMuc = dg.IdPhieuNavigation?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "N/A",
                TenDichVu = dg.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "N/A",
                ChatLuongDichVu = dg.ChatLuongDichVu ?? 0,
                ThaiDoNhanVien = dg.ThaiDoNhanVien ?? 0,
                TocDoXuLy = dg.TocDoXuLy ?? 0,
                DiemTrungBinh = Math.Round(avg, 1),
                NhanXet = dg.NhanXet,
                NgayDanhGia = dg.NgayDanhGia ?? DateTime.Now,
                IsResponded = dg.IdNhanVienPhanHoi != null && !string.IsNullOrEmpty(dg.PhanHoiNhanVien),
                PhanHoiNhanVien = dg.PhanHoiNhanVien,
                NgayPhanHoi = dg.NgayPhanHoi,
                HoTenNhanVienPhanHoi = dg.IdNhanVienPhanHoiNavigation?.HoTen,
                IdNhanVienPhuTrach = staffIdOfTicket,
                CanReply = canReply,
                FileDinhKems = dg.FileDinhKems.Select(f => new FileDinhKemViewModel
                {
                    IdFile = f.IdFile,
                    TenFile = f.TenFile,
                    DuongDan = f.DuongDan,
                    LoaiFile = f.LoaiFile
                }).ToList()
            };
        }

        public async Task<(bool Success, string Message, int StatusCode)> SaveReplyAsync(int idDanhGia, string phanHoi, int userId, string role)
        {
            var evaluation = await _context.DanhGia
                .Include(d => d.IdPhieuNavigation)
                .FirstOrDefaultAsync(d => d.IdDanhGia == idDanhGia);

            if (evaluation == null)
            {
                return (false, "Đánh giá không tồn tại.", 404);
            }

            // Security authorization check
            bool isAuthorized = false;
            if (role == "Admin")
            {
                isAuthorized = true;
            }
            else if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && evaluation.IdPhieuNavigation != null)
            {
                if (evaluation.IdPhieuNavigation.IdNhanVien == userId)
                {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized)
            {
                return (false, "403 Forbidden: Bạn không có quyền phản hồi đánh giá này.", 403);
            }

            await _danhGiaRepository.UpdateResponseAsync(idDanhGia, phanHoi, userId);
            return (true, "Phản hồi đánh giá thành công.", 200);
        }

        public async Task<DanhGiaListViewModel> GetRatingListForUserAsync(int userId, string role, string keyword, string status, string sort, int page, int pageSize)
        {
            var query = _context.DanhGia
                .AsNoTracking()
                .Include(dg => dg.IdPhieuNavigation)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .Include(dg => dg.IdPhieuNavigation)
                    .ThenInclude(p => p.IdNhanVienNavigation)
                .Include(dg => dg.IdPhieuNavigation)
                    .ThenInclude(p => p.IdDichVuNavigation)
                        .ThenInclude(dv => dv.IdDanhMucNavigation)
                .Include(dg => dg.FileDinhKems)
                .Include(dg => dg.IdNhanVienPhanHoiNavigation)
                .AsQueryable();

            bool isStaff = (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ");

            // Tim kiem LINQ
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(dg =>
                    (dg.IdPhieuNavigation != null && dg.IdPhieuNavigation.MaPhieu != null && dg.IdPhieuNavigation.MaPhieu.ToLower().Contains(kw)) ||
                    (dg.IdPhieuNavigation != null && dg.IdPhieuNavigation.TieuDe != null && dg.IdPhieuNavigation.TieuDe.ToLower().Contains(kw)) ||
                    (dg.IdPhieuNavigation != null && dg.IdPhieuNavigation.IdKhachHangNavigation != null && dg.IdPhieuNavigation.IdKhachHangNavigation.HoTen.ToLower().Contains(kw)) ||
                    (dg.NhanXet != null && dg.NhanXet.ToLower().Contains(kw))
                );
            }

            // Loc trang thai phan hoi
            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                if (status == "replied")
                {
                    query = query.Where(dg => dg.IdNhanVienPhanHoi != null && dg.PhanHoiNhanVien != null);
                }
                else if (status == "not-replied")
                {
                    query = query.Where(dg => dg.IdNhanVienPhanHoi == null || dg.PhanHoiNhanVien == null);
                }
            }

            // Sap xep
            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(dg => dg.NgayDanhGia);
                    break;
                case "highest-rating":
                    query = query.OrderByDescending(dg => ((dg.ChatLuongDichVu ?? 0) + (dg.ThaiDoNhanVien ?? 0) + (dg.TocDoXuLy ?? 0)) / 3.0);
                    break;
                case "lowest-rating":
                    query = query.OrderBy(dg => ((dg.ChatLuongDichVu ?? 0) + (dg.ThaiDoNhanVien ?? 0) + (dg.TocDoXuLy ?? 0)) / 3.0);
                    break;
                default: // newest
                    query = query.OrderByDescending(dg => dg.NgayDanhGia);
                    break;
            }

            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (page < 1) page = 1;
            if (totalPages > 0 && page > totalPages) page = totalPages;

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var mappedItems = items.Select(dg =>
            {
                double avg = ((dg.ChatLuongDichVu ?? 0) + (dg.ThaiDoNhanVien ?? 0) + (dg.TocDoXuLy ?? 0)) / 3.0;
                int? staffIdOfTicket = dg.IdPhieuNavigation?.IdNhanVien;

                bool canReply = false;
                if (role == "Admin")
                {
                    canReply = true;
                }
                else if (isStaff)
                {
                    canReply = (staffIdOfTicket == userId);
                }

                return new DanhGiaChiTietViewModel
                {
                    IdDanhGia = dg.IdDanhGia,
                    IdPhieu = dg.IdPhieu ?? 0,
                    MaPhieu = dg.IdPhieuNavigation?.MaPhieu ?? "N/A",
                    TieuDePhieu = dg.IdPhieuNavigation?.TieuDe ?? "N/A",
                    HoTenKhachHang = dg.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? "N/A",
                    HoTenNhanVien = dg.IdPhieuNavigation?.IdNhanVienNavigation?.HoTen ?? "N/A",
                    TenDanhMuc = dg.IdPhieuNavigation?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "N/A",
                    TenDichVu = dg.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu ?? "N/A",
                    ChatLuongDichVu = dg.ChatLuongDichVu ?? 0,
                    ThaiDoNhanVien = dg.ThaiDoNhanVien ?? 0,
                    TocDoXuLy = dg.TocDoXuLy ?? 0,
                    DiemTrungBinh = Math.Round(avg, 1),
                    NhanXet = dg.NhanXet,
                    NgayDanhGia = dg.NgayDanhGia ?? DateTime.Now,
                    IsResponded = dg.IdNhanVienPhanHoi != null && !string.IsNullOrEmpty(dg.PhanHoiNhanVien),
                    PhanHoiNhanVien = dg.PhanHoiNhanVien,
                    NgayPhanHoi = dg.NgayPhanHoi,
                    HoTenNhanVienPhanHoi = dg.IdNhanVienPhanHoiNavigation?.HoTen,
                    IdNhanVienPhuTrach = staffIdOfTicket,
                    CanReply = canReply,
                    FileDinhKems = dg.FileDinhKems.Select(f => new FileDinhKemViewModel
                    {
                        IdFile = f.IdFile,
                        TenFile = f.TenFile,
                        DuongDan = f.DuongDan,
                        LoaiFile = f.LoaiFile
                    }).ToList()
                };
            }).ToList();

            // Thong ke tong quan
            int totalReviews = await _context.DanhGia.CountAsync();
            int repliedCount = await _context.DanhGia.CountAsync(dg => dg.IdNhanVienPhanHoi != null && dg.PhanHoiNhanVien != null);
            int notRepliedCount = totalReviews - repliedCount;
            double averageRating = 0.0;
            if (totalReviews > 0)
            {
                var sumRatings = await _context.DanhGia
                    .SumAsync(dg => ((dg.ChatLuongDichVu ?? 0) + (dg.ThaiDoNhanVien ?? 0) + (dg.TocDoXuLy ?? 0)) / 3.0);
                averageRating = Math.Round(sumRatings / totalReviews, 1);
            }

            return new DanhGiaListViewModel
            {
                Items = mappedItems,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = page,
                PageSize = pageSize,
                Keyword = keyword,
                StatusFilter = status,
                SortOrder = sort,
                TotalReviews = totalReviews,
                RepliedCount = repliedCount,
                NotRepliedCount = notRepliedCount,
                AverageRating = averageRating
            };
        }
    }
}
