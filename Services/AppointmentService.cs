using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Services
{
    public interface IAppointmentService
    {
        Task<LichHen> CreateAppointmentAsync(string maPhieu, DateOnly ngayHen, TimeOnly gioBatDau, TimeOnly gioKetThuc, string? diaChi, string? ghiChu);
    }

    public class AppointmentService : IAppointmentService
    {
        private readonly TechSupportContext _context;
        private readonly ILiveSupportService _liveSupportService;

        public AppointmentService(TechSupportContext context, ILiveSupportService liveSupportService)
        {
            _context = context;
            _liveSupportService = liveSupportService;
        }

        public async Task<LichHen> CreateAppointmentAsync(string maPhieu, DateOnly ngayHen, TimeOnly gioBatDau, TimeOnly gioKetThuc, string? diaChi, string? ghiChu)
        {
            var ticket = await _context.PhieuHoTros.FirstOrDefaultAsync(p => p.MaPhieu == maPhieu);
            if (ticket == null) throw new ArgumentException("Mã phiếu không tồn tại.");

            var appointment = new LichHen
            {
                IdPhieu = ticket.IdPhieu,
                IdNhanVien = ticket.IdNhanVien,
                NgayHen = ngayHen,
                GioBatDau = gioBatDau,
                GioKetThuc = gioKetThuc,
                DiaChiHoTro = diaChi,
                GhiChu = ghiChu,
                TrangThai = "Sắp diễn ra"
            };

            _context.LichHens.Add(appointment);
            await _context.SaveChangesAsync();

            // Create a system message in the chat thread notifying of the appointment
            string systemContent = $"📅 [LỊCH HẸN HỖ TRỢ] Kỹ thuật viên đã tạo lịch hẹn hỗ trợ trực tiếp:\n" +
                                   $"- Ngày: {ngayHen:dd/MM/yyyy}\n" +
                                   $"- Thời gian: {gioBatDau:HH:mm} - {gioKetThuc:HH:mm}\n" +
                                   $"- Địa chỉ: {appointment.DiaChiHoTro}\n" +
                                   $"- Ghi chú: {(string.IsNullOrEmpty(ghiChu) ? "Không có" : ghiChu)}";

            await _liveSupportService.SaveMessageAsync(maPhieu, systemContent, "Staff");

            return appointment;
        }
    }
}
