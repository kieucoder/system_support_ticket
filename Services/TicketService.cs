using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class TicketService : ITicketService
    {
        private readonly TechSupportContext _context;

        public TicketService(TechSupportContext context)
        {
            _context = context;
        }

        public async Task<string> TaoMaPhieuAsync()
        {
            var phieuCuoi = await _context.PhieuHoTros
                            .OrderByDescending(x => x.IdPhieu)
                            .FirstOrDefaultAsync();

            if (phieuCuoi == null)
            {
                return "PHT000001";
            }

            string so = phieuCuoi.MaPhieu.Replace("PHT", "");
            if (int.TryParse(so, out int stt))
            {
                stt++;
                return $"PHT{stt:D6}";
            }
            return "PHT000001";
        }

        public async Task<NhanVien?> SelectTechnicianWithLowestTicketsAsync()
        {
            return await _context.NhanViens
                .Where(nv => nv.VaiTro == "Nhân viên" && (nv.TrangThai == "Hoạt động" || nv.TrangThai == "Hoạt Động"))
                .Select(nv => new
                {
                    NhanVien = nv,
                    TicketCount = nv.PhieuHoTros.Count(p => 
                        p.TrangThai == "Chờ tiếp nhận" || 
                        p.TrangThai == "ChoTiepNhan" || 
                        p.TrangThai == "Đang xử lý" || 
                        p.TrangThai == "DangXuLy")
                })
                .OrderBy(x => x.TicketCount)
                .Select(x => x.NhanVien)
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Success, int TicketId, string? ErrorMessage, PhieuHoTro? Phieu)> CreateTicketAsync(PhieuViewModel model, int idKhachHang)
        {
            var selectedNhanVien = await SelectTechnicianWithLowestTicketsAsync();
            if (selectedNhanVien == null)
            {
                return (false, 0, "Hiện tại chưa có nhân viên phụ trách hoạt động trên hệ thống.", null);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var phieu = new PhieuHoTro
                {
                    IdKhachHang = idKhachHang,
                    IdNhanVien = selectedNhanVien.IdNhanVien,
                    IdDichVu = model.IdDichVu,
                    MaPhieu = await TaoMaPhieuAsync(),
                    TieuDe = model.TieuDe,
                    MucDoUuTien = model.MucDoUuTien,
                    LoaiYeuCau = model.LoaiYeuCau ?? "Hỗ trợ kỹ thuật",
                    NoiDung = model.NoiDung,
                    NgayTao = DateOnly.FromDateTime(DateTime.Now),
                    NgayCapNhat = null,
                    CanLichHen = "Không",
                    TrangThai = "Chờ tiếp nhận"
                };

                _context.PhieuHoTros.Add(phieu);
                await _context.SaveChangesAsync(); // Generates phieu.IdPhieu

                // Log support history
                var lichSu = new LichSuHoTro
                {
                    IdPhieu = phieu.IdPhieu,
                    IdNhanVien = selectedNhanVien.IdNhanVien,
                    TrangThaiCu = "",
                    TrangThaiMoi = "Chờ tiếp nhận",
                    NoiDungCapNhat = $"Hệ thống tự động phân công nhân viên {selectedNhanVien.HoTen}.",
                    NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
                };
                _context.LichSuHoTros.Add(lichSu);

                // Save attachments if any
                if (model.Files != null && model.Files.Count > 0)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    foreach (var file in model.Files)
                    {
                        if (file.Length > 0)
                        {
                            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                            using (var fileStream = new FileStream(filePath, FileMode.Create))
                            {
                                await file.CopyToAsync(fileStream);
                            }

                            var fileDinhKem = new FileDinhKem
                            {
                                IdPhieu = phieu.IdPhieu,
                                TenFile = file.FileName,
                                DuongDan = $"/uploads/{uniqueFileName}",
                                LoaiFile = file.ContentType,
                                NgayUpload = DateTime.Now
                            };
                            _context.FileDinhKems.Add(fileDinhKem);
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, phieu.IdPhieu, null, phieu);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, 0, ex.Message, null);
            }
        }

        public async Task<bool> CanUserAccessTicketAsync(int idPhieu, int userId, string role)
        {
            if (role == "Admin") return true;

            var ticket = await _context.PhieuHoTros.AsNoTracking().FirstOrDefaultAsync(p => p.IdPhieu == idPhieu);
            if (ticket == null) return false;

            if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                return ticket.IdNhanVien == userId;
            }

            if (role == "KhachHang")
            {
                return ticket.IdKhachHang == userId;
            }

            return false;
        }

        public async Task<PhieuHoTro?> GetTicketDetailForUserAsync(int idPhieu, int userId, string role)
        {
            var ticket = await _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.FileDinhKems)
                .Include(p => p.DanhGium)
                .FirstOrDefaultAsync(p => p.IdPhieu == idPhieu);

            if (ticket == null) return null;

            if (role == "Admin") return ticket;
            if ((role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && ticket.IdNhanVien == userId) return ticket;
            if (role == "KhachHang" && ticket.IdKhachHang == userId) return ticket;

            return null;
        }

        public async Task<System.Collections.Generic.List<PhieuHoTro>> GetTicketsForUserAsync(int userId, string role)
        {
            var query = _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                    .ThenInclude(d => d!.IdDanhMucNavigation)
                .Include(p => p.IdKhachHangNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Include(p => p.LichHens)
                .Include(p => p.DanhGium)
                .AsQueryable();

            if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                query = query.Where(p => p.IdNhanVien == userId);
            }
            else if (role == "KhachHang")
            {
                query = query.Where(p => p.IdKhachHang == userId);
            }

            return await query.OrderByDescending(p => p.NgayTao).ThenByDescending(p => p.IdPhieu).ToListAsync();
        }
    }
}
