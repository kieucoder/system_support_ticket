using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Repositories;

namespace SupportTicketSysterm.Services
{
    public class LiveSupportService : ILiveSupportService
    {
        private readonly ILiveSupportRepository _repository;

        public LiveSupportService(ILiveSupportRepository repository)
        {
            _repository = repository;
        }

        public async Task<PhieuHoTro?> GetTicketByCodeAsync(string maPhieu)
        {
            return await _repository.GetTicketByCodeAsync(maPhieu);
        }

        public async Task<LienHe?> GetOrCreateLienHeAsync(string maPhieu)
        {
            var ticket = await _repository.GetTicketByCodeAsync(maPhieu);
            if (ticket == null) return null;

            var lienHe = await _repository.GetLienHeByTicketIdAsync(ticket.IdPhieu);
            if (lienHe == null)
            {
                lienHe = new LienHe
                {
                    IdPhieu = ticket.IdPhieu,
                    IdKhachHang = ticket.IdKhachHang,
                    IdNhanVien = ticket.IdNhanVien,
                    TieuDe = $"Hỗ trợ chat trực tuyến - {ticket.MaPhieu}",
                    ThoiGianGui = DateTime.Now,
                    TrangThai = "Đang hỗ trợ",
                    NgayTao = DateOnly.FromDateTime(DateTime.Now),
                    SoTinChuaDoc = 0,
                    TinChuaDocKhach = 0
                };
                lienHe = await _repository.CreateLienHeAsync(lienHe);
            }
            return lienHe;
        }

        public async Task<List<MessageViewModel>> GetMessagesAsync(string maPhieu)
        {
            var lienHe = await GetOrCreateLienHeAsync(maPhieu);
            if (lienHe == null) return new List<MessageViewModel>();

            var list = await _repository.GetMessagesByLienHeIdAsync(lienHe.IdLienHe);
            return list.Select(MapToViewModel).ToList();
        }

        public async Task<MessageViewModel> SaveMessageAsync(string maPhieu, string content, string senderRole)
        {
            var lienHe = await GetOrCreateLienHeAsync(maPhieu);
            if (lienHe == null) throw new ArgumentException("Mã phiếu không tồn tại.");

            // Standardize senderRole as stored in db
            // "KhachHang" for Customer, "NhanVien" for Staff
            string loaiNguoiGui = senderRole == "Customer" ? "KhachHang" : "NhanVien";

            var msg = new TinNhan
            {
                IdLienHe = lienHe.IdLienHe,
                LoaiNguoiGui = loaiNguoiGui,
                ThoiGian = DateTime.Now,
                TinNhan1 = content,
                TrangThai = "Đã gửi"
            };

            var saved = await _repository.SaveMessageAsync(msg);
            return MapToViewModel(saved);
        }

        public async Task<MessageViewModel> UploadAsync(string maPhieu, string fileName, string filePath, string fileType, string senderRole)
        {
            var lienHe = await GetOrCreateLienHeAsync(maPhieu);
            if (lienHe == null) throw new ArgumentException("Mã phiếu không tồn tại.");

            string loaiNguoiGui = senderRole == "Customer" ? "KhachHang" : "NhanVien";

            // Create message first
            var msg = new TinNhan
            {
                IdLienHe = lienHe.IdLienHe,
                LoaiNguoiGui = loaiNguoiGui,
                ThoiGian = DateTime.Now,
                TinNhan1 = $"[Đính kèm tệp: {fileName}]",
                TrangThai = "Đã gửi"
            };
            var savedMsg = await _repository.SaveMessageAsync(msg);

            // Create File attachment
            var file = new FileDinhKem
            {
                IdPhieu = lienHe.IdPhieu,
                IdTinNhan = savedMsg.IdTinNhan,
                TenFile = fileName,
                DuongDan = filePath,
                LoaiFile = fileType,
                NgayUpload = DateTime.Now
            };
            await _repository.SaveFileAttachmentAsync(file);

            // Fetch fully populated message
            var messages = await _repository.GetMessagesByLienHeIdAsync(lienHe.IdLienHe);
            var fullyPopulated = messages.FirstOrDefault(m => m.IdTinNhan == savedMsg.IdTinNhan);

            return MapToViewModel(fullyPopulated ?? savedMsg);
        }

        public async Task MarkAsReadAsync(string maPhieu, string readerRole)
        {
            var lienHe = await GetOrCreateLienHeAsync(maPhieu);
            if (lienHe != null)
            {
                await _repository.MarkAsReadAsync(lienHe.IdLienHe, readerRole);
            }
        }

        public async Task<NhanVien?> GetAssignedStaffAsync(string maPhieu)
        {
            var ticket = await _repository.GetTicketByCodeAsync(maPhieu);
            if (ticket?.IdNhanVien != null)
            {
                return await _repository.GetStaffByIdAsync(ticket.IdNhanVien.Value);
            }
            return null;
        }

        private MessageViewModel MapToViewModel(TinNhan entity)
        {
            return new MessageViewModel
            {
                IdTinNhan = entity.IdTinNhan,
                IdLienHe = entity.IdLienHe ?? 0,
                LoaiNguoiGui = entity.LoaiNguoiGui ?? "",
                NoiDung = entity.TinNhan1 ?? "",
                ThoiGian = entity.ThoiGian ?? DateTime.Now,
                TrangThai = entity.TrangThai ?? "",
                Files = entity.FileDinhKems.Select(f => new FileAttachmentViewModel
                {
                    IdFile = f.IdFile,
                    TenFile = f.TenFile,
                    DuongDan = f.DuongDan,
                    LoaiFile = f.LoaiFile ?? ""
                }).ToList()
            };
        }
    }
}
