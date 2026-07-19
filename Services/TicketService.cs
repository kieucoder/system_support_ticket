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
                    CanLichHen = model.CanLichHen ?? "Không",
                    TrangThai = "Chờ tiếp nhận"
                };

                _context.PhieuHoTros.Add(phieu);
                await _context.SaveChangesAsync(); // Generates phieu.IdPhieu

                // Save schedule appointment if applicable
                if (model.CanLichHen == "Có")
                {
                    var lichHen = new LichHen
                    {
                        IdPhieu = phieu.IdPhieu,
                        NgayHen = model.NgayHen,
                        GioBatDau = model.GioBatDau,
                        GioKetThuc = model.GioKetThuc,
                        DiaChiHoTro = model.DiaChiHen,
                        GhiChu = model.GhiChuHen,
                        TrangThai = "Chờ xác nhận"
                    };
                    _context.LichHens.Add(lichHen);
                }

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
    }
}
