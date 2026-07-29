using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models.ViewModels;

namespace SupportTicketSysterm.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly TechSupportContext _context;

        public DashboardService(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<DashboardViewModel> GetDashboardDataAsync(int? idNhanVien = null, string? role = null)
        {
            var model = new DashboardViewModel();

            bool isStaff = (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && idNhanVien.HasValue;

            var baseTicketsQuery = _context.PhieuHoTros.AsQueryable();
            if (isStaff)
            {
                baseTicketsQuery = baseTicketsQuery.Where(x => x.IdNhanVien == idNhanVien.Value);
            }

            // 1. Thống kê nhanh
            model.TongPhieu = await baseTicketsQuery.CountAsync();
            
            model.ChoTiepNhan = await baseTicketsQuery.CountAsync(x => 
                x.TrangThai == "Chờ tiếp nhận" || 
                x.TrangThai == "ChoTiepNhan" || 
                x.TrangThai == "waiting" || 
                x.TrangThai == "Chờ xử lý");

            model.DangXuLy = await baseTicketsQuery.CountAsync(x => 
                x.TrangThai == "Đang xử lý" || 
                x.TrangThai == "DangXuLy" || 
                x.TrangThai == "processing");

            model.DaHoanThanh = await baseTicketsQuery.CountAsync(x => 
                x.TrangThai == "Hoàn thành" || 
                x.TrangThai == "DaHoanThanh" || 
                x.TrangThai == "Đã hoàn thành" || 
                x.TrangThai == "completed");

            model.SoKhachHang = isStaff
                ? await baseTicketsQuery.Select(x => x.IdKhachHang).Distinct().CountAsync()
                : await _context.KhachHangs.CountAsync();

            var baseAppointmentsQuery = _context.LichHens.AsQueryable();
            if (isStaff)
            {
                baseAppointmentsQuery = baseAppointmentsQuery.Where(x => x.IdNhanVien == idNhanVien.Value || (x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdNhanVien == idNhanVien.Value));
            }
            model.LichHenKyThuat = await baseAppointmentsQuery.CountAsync(x => x.TrangThai != "Đã hủy");

            model.SoDichVu = await _context.DichVus.CountAsync();
            model.SoDanhMuc = await _context.DanhMucs.CountAsync();
            
            // Tính số lượng tin nhắn chưa đọc
            var baseContactsQuery = _context.LienHes.AsQueryable();
            if (isStaff)
            {
                baseContactsQuery = baseContactsQuery.Where(x => x.IdNhanVien == idNhanVien.Value);
            }
            model.ChatChuaDoc = await baseContactsQuery.AnyAsync() 
                ? await baseContactsQuery.SumAsync(x => (x.SoTinChuaDoc ?? 0) + (x.TinChuaDocKhach ?? 0))
                : 0;

            // 2. Biểu đồ 6 tháng gần nhất
            var today = DateTime.Today;
            var startMonthDate = new DateOnly(today.Year, today.Month, 1).AddMonths(-5);

            var monthlyTickets = await baseTicketsQuery
                .Where(x => x.NgayTao != null && x.NgayTao >= startMonthDate)
                .Select(x => x.NgayTao.Value)
                .ToListAsync();

            for (int i = -5; i <= 0; i++)
            {
                var targetMonth = today.AddMonths(i);
                var count = monthlyTickets.Count(d => d.Month == targetMonth.Month && d.Year == targetMonth.Year);
                model.ThongKeTheoThang.Add(new ThongKeThang 
                { 
                    Thang = targetMonth.Month, 
                    SoLuong = count 
                });
            }

            // 3. Biểu đồ Dịch vụ
            var ticketServices = await baseTicketsQuery
                .Where(x => x.IdDichVu != null)
                .GroupBy(x => x.IdDichVu)
                .Select(g => new 
                {
                    IdDichVu = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var servicesList = await _context.DichVus.ToListAsync();

            model.ThongKeTheoDichVu = ticketServices.Select(ts => new ThongKeDichVu
            {
                TenDichVu = servicesList.FirstOrDefault(s => s.IdDichVu == ts.IdDichVu)?.TenDichVu ?? "Dịch vụ khác",
                SoLuong = ts.Count
            }).ToList();

            // 4. Đánh giá sao
            var evaluationsQuery = _context.DanhGia.AsQueryable();
            if (isStaff)
            {
                evaluationsQuery = evaluationsQuery.Where(x => x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdNhanVien == idNhanVien.Value);
            }
            var evaluations = await evaluationsQuery.ToListAsync();
            var ratings = evaluations
                .Where(x => x.ChatLuongDichVu.HasValue || x.ThaiDoNhanVien.HasValue || x.TocDoXuLy.HasValue)
                .Select(x => 
                {
                    double sum = (x.ChatLuongDichVu ?? 0) + (x.ThaiDoNhanVien ?? 0) + (x.TocDoXuLy ?? 0);
                    int count = (x.ChatLuongDichVu.HasValue ? 1 : 0) + (x.ThaiDoNhanVien.HasValue ? 1 : 0) + (x.TocDoXuLy.HasValue ? 1 : 0);
                    double avg = count > 0 ? sum / count : 5.0;
                    return (int)Math.Round(avg);
                })
                .ToList();

            model.DanhGiaSao = new DanhGiaSao
            {
                Sao1 = ratings.Count(r => r <= 1),
                Sao2 = ratings.Count(r => r == 2),
                Sao3 = ratings.Count(r => r == 3),
                Sao4 = ratings.Count(r => r == 4),
                Sao5 = ratings.Count(r => r >= 5)
            };

            // 5. 5 Phiếu mới nhất
            var newestTickets = await baseTicketsQuery
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdDichVuNavigation)
                .OrderByDescending(p => p.NgayTao)
                .Take(5)
                .ToListAsync();

            model.PhieuMoiNhat = newestTickets.Select(p => 
            {
                string priorityStr = "Trung Bình";
                if (p.MucDoUuTien == 1) priorityStr = "Thấp";
                else if (p.MucDoUuTien == 2) priorityStr = "Trung Bình";
                else if (p.MucDoUuTien == 3) priorityStr = "Cao";
                else if (p.MucDoUuTien == 4) priorityStr = "Khẩn Cấp";

                return new PhieuMoiViewModel
                {
                    MaPhieu = p.MaPhieu,
                    KhachHang = p.IdKhachHangNavigation != null 
                        ? $"{p.IdKhachHangNavigation.HoTen} ({p.IdKhachHangNavigation.SoDienThoai})" 
                        : "Khách vãng lai",
                    NoiDung = !string.IsNullOrWhiteSpace(p.NoiDung) ? p.NoiDung : (p.TieuDe ?? string.Empty),
                    DichVu = p.IdDichVuNavigation?.TenDichVu ?? "Dịch vụ kỹ thuật",
                    MucDoUuTien = priorityStr,
                    TrangThai = p.TrangThai ?? "waiting",
                    NgayTao = p.NgayTao
                };
            }).ToList();

            return model;
        }
    }
}
