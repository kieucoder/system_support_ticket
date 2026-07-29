using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Repositories.Interfaces;

namespace SupportTicketSysterm.Repositories.Implementations;

/// <summary>
/// Implementation của Repository quản lý truy vấn dữ liệu Lịch Hẹn
/// </summary>
public class LichHenRepository : ILichHenRepository
{
    private readonly TechSupportContext _context;

    public LichHenRepository(TechSupportContext context)
    {
        _context = context;
    }

    public async Task<LichHen?> GetByIdAsync(int idLichHen)
    {
        return await _context.LichHens
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .FirstOrDefaultAsync(l => l.IdLichHen == idLichHen);
    }

    public async Task<List<LichHen>> GetAllAppointmentsAsync(LichHenFilterDto? filter = null)
    {
        var query = _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdKhachHangNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .AsQueryable();

        if (filter != null)
        {
            if (filter.IdKhachHang.HasValue)
                query = query.Where(l => l.IdPhieuNavigation != null && l.IdPhieuNavigation.IdKhachHang == filter.IdKhachHang.Value);

            if (filter.IdNhanVien.HasValue)
                query = query.Where(l => l.IdNhanVien == filter.IdNhanVien.Value);

            if (filter.IdPhieu.HasValue)
                query = query.Where(l => l.IdPhieu == filter.IdPhieu.Value);

            if (filter.TrangThai.HasValue)
            {
                string statusStr = filter.TrangThai.Value.ToString();
                query = query.Where(l => l.TrangThai == statusStr);
            }

            if (filter.TuNgay.HasValue)
            {
                var tuNgayOnly = DateOnly.FromDateTime(filter.TuNgay.Value);
                query = query.Where(l => l.NgayHen >= tuNgayOnly);
            }

            if (filter.DenNgay.HasValue)
            {
                var denNgayOnly = DateOnly.FromDateTime(filter.DenNgay.Value);
                query = query.Where(l => l.NgayHen <= denNgayOnly);
            }
        }

        return await query
            .OrderByDescending(l => l.NgayHen)
            .ThenByDescending(l => l.GioBatDau)
            .ToListAsync();
    }

    public async Task<List<LichHen>> GetAppointmentsByEmployeeAsync(int idNhanVien, LichHenFilterDto? filter = null)
    {
        filter ??= new LichHenFilterDto();
        filter.IdNhanVien = idNhanVien;
        return await GetAllAppointmentsAsync(filter);
    }

    public async Task<List<LichHen>> GetCustomerAppointmentsAsync(int idKhachHang)
    {
        return await _context.LichHens
            .AsNoTracking()
            .Include(l => l.IdPhieuNavigation)
                .ThenInclude(p => p.IdDichVuNavigation)
            .Include(l => l.IdNhanVienNavigation)
            .Where(l => l.IdPhieuNavigation != null && l.IdPhieuNavigation.IdKhachHang == idKhachHang)
            .OrderByDescending(l => l.NgayHen)
            .ThenByDescending(l => l.GioBatDau)
            .ToListAsync();
    }

    public async Task<List<PhieuHoTro>> GetEligibleTicketsForCustomerAsync(int idKhachHang)
    {
        var finishedStatuses = new[] { "Đã giải quyết", "Đóng", "Hoàn thành", "DaHoanThanh", "Từ chối", "Hủy", "DaHuy" };

        return await _context.PhieuHoTros
            .AsNoTracking()
            .Include(p => p.IdDichVuNavigation)
            .Include(p => p.IdKhachHangNavigation)
            .Include(p => p.IdNhanVienNavigation)
            .Include(p => p.LichHens)
            .Where(p => p.IdKhachHang == idKhachHang
                     && (p.TrangThai == null || !finishedStatuses.Contains(p.TrangThai))
                     && (p.CanLichHen == "Có" || p.CanLichHen == null)
                     && !p.LichHens.Any(l => l.TrangThai == "ChoXacNhan" 
                                           || l.TrangThai == "Chờ xác nhận"
                                           || l.TrangThai == "DaXacNhan" 
                                           || l.TrangThai == "Đã xác nhận"
                                           || l.TrangThai == "DangThucHien"
                                           || l.TrangThai == "Đang thực hiện"))
            .OrderByDescending(p => p.NgayTao)
            .ToListAsync();
    }

    public async Task AddAsync(LichHen entity)
    {
        await _context.LichHens.AddAsync(entity);
    }

    public void Update(LichHen entity)
    {
        _context.LichHens.Update(entity);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
