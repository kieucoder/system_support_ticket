using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.DTO;
using SupportTicketSysterm.Repositories.Interfaces;
using SupportTicketSysterm.Services.Interfaces;

namespace SupportTicketSysterm.Services.Implementations
{
    public class TicketLookupService : ITicketLookupService
    {
        private readonly ITicketRepository _ticketRepository;
        private readonly ILogger<TicketLookupService> _logger;

        public TicketLookupService(
            ITicketRepository ticketRepository,
            ILogger<TicketLookupService> logger)
        {
            _ticketRepository = ticketRepository;
            _logger = logger;
        }

        public async Task<LookupTicketResponse> LookupAsync(LookupTicketRequest request, int? idKhachHang)
        {
            if (!idKhachHang.HasValue)
            {
                return new LookupTicketResponse
                {
                    Success = false,
                    Message = "Vui lòng đăng nhập tài khoản Khách hàng để tra cứu phiếu hỗ trợ.",
                    Intent = "Unauthorized"
                };
            }

            PhieuHoTro? ticket = null;
            string? targetCode = !string.IsNullOrWhiteSpace(request.TicketCode) ? request.TicketCode : request.ContextTicketCode;

            if (!string.IsNullOrWhiteSpace(targetCode))
            {
                ticket = await _ticketRepository.GetByTicketCodeAsync(targetCode);
            }

            // Fallback: If no code or code not found, get latest ticket for this customer
            if (ticket == null)
            {
                ticket = await _ticketRepository.GetLatestTicketByCustomerAsync(idKhachHang.Value);
            }

            if (ticket == null)
            {
                return new LookupTicketResponse
                {
                    Success = false,
                    Message = "Không tìm thấy phiếu hỗ trợ nào trong dữ liệu hệ thống.",
                    Intent = "NotFound"
                };
            }

            // Authorization check
            if (ticket.IdKhachHang != idKhachHang.Value)
            {
                _logger.LogWarning("Access Denied: Customer {IdKhachHang} tried to view ticket {MaPhieu} of Customer {OwnerId}",
                    idKhachHang.Value, ticket.MaPhieu, ticket.IdKhachHang);

                return new LookupTicketResponse
                {
                    Success = false,
                    Message = "Bạn không có quyền xem phiếu này.",
                    Intent = "Forbidden"
                };
            }

            // Fetch related detailed collections
            var appointmentEntity = await _ticketRepository.GetAppointmentByTicketIdAsync(ticket.IdPhieu);
            var attachmentEntities = await _ticketRepository.GetAttachmentsByTicketIdAsync(ticket.IdPhieu);
            var messageEntities = await _ticketRepository.GetMessagesByTicketIdAsync(ticket.IdPhieu, 20);
            var ratingEntity = await _ticketRepository.GetRatingByTicketIdAsync(ticket.IdPhieu);

            // Mapping to DTOs
            var cardDto = new TicketCardDto
            {
                IdPhieu = ticket.IdPhieu,
                TicketCode = ticket.MaPhieu ?? $"PH{ticket.IdPhieu:D6}",
                Title = ticket.TieuDe ?? "Hỗ trợ kỹ thuật",
                Content = ticket.NoiDung ?? "",
                Category = ticket.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "Hỗ trợ kỹ thuật",
                Service = ticket.IdDichVuNavigation?.TenDichVu ?? "Kỹ thuật chung",
                Priority = MapPriorityText(ticket.MucDoUuTien),
                Status = ticket.TrangThai ?? "Chờ tiếp nhận",
                CreatedDate = ticket.NgayTao?.ToString("dd/MM/yyyy") ?? "--",
                UpdatedDate = ticket.NgayCapNhat?.ToString("dd/MM/yyyy HH:mm") ?? ticket.NgayTao?.ToString("dd/MM/yyyy") ?? "--"
            };

            // Map Customer DTO
            if (ticket.IdKhachHangNavigation != null)
            {
                cardDto.Customer = new CustomerDto
                {
                    IdKhachHang = ticket.IdKhachHangNavigation.IdKhachHang,
                    MaKh = ticket.IdKhachHangNavigation.MaKh ?? "",
                    HoTen = ticket.IdKhachHangNavigation.HoTen ?? "Khách hàng",
                    Email = MaskEmail(ticket.IdKhachHangNavigation.Email),
                    SoDienThoai = MaskPhone(ticket.IdKhachHangNavigation.SoDienThoai)
                };
            }

            // Map Employee DTO
            if (ticket.IdNhanVienNavigation != null)
            {
                cardDto.Employee = new EmployeeDto
                {
                    IdNhanVien = ticket.IdNhanVienNavigation.IdNhanVien,
                    HoTen = ticket.IdNhanVienNavigation.HoTen ?? "Kỹ thuật viên",
                    ChucVu = ticket.IdNhanVienNavigation.ChucVu ?? "Nhân viên hỗ trợ",
                    AnhDaiDien = string.IsNullOrWhiteSpace(ticket.IdNhanVienNavigation.Avatar) ? "/assets/images/default-avatar.png" : ticket.IdNhanVienNavigation.Avatar,
                    SoDienThoai = MaskPhone(ticket.IdNhanVienNavigation.SoDienThoai)
                };
            }

            // Map Appointment DTO
            if (appointmentEntity != null)
            {
                cardDto.Appointment = new AppointmentDto
                {
                    IdLichHen = appointmentEntity.IdLichHen,
                    NgayHen = appointmentEntity.NgayHen?.ToString("dd/MM/yyyy") ?? "--",
                    GioBatDau = appointmentEntity.GioBatDau?.ToString("HH:mm") ?? "--",
                    GioKetThuc = appointmentEntity.GioKetThuc?.ToString("HH:mm") ?? "--",
                    DiaChiHoTro = appointmentEntity.DiaChiHoTro ?? "Địa chỉ đăng ký",
                    GhiChu = appointmentEntity.GhiChu ?? "",
                    TrangThai = appointmentEntity.TrangThai ?? "Đã xác nhận"
                };
            }

            // Map Attachments DTO
            if (attachmentEntities != null && attachmentEntities.Any())
            {
                cardDto.Attachments = attachmentEntities.Select(a => new AttachmentDto
                {
                    IdFile = a.IdFile,
                    TenFile = a.TenFile ?? "Tệp đính kèm",
                    DuongDan = a.DuongDan ?? "",
                    LoaiFile = a.LoaiFile ?? "Document",
                    NgayUpload = a.NgayUpload?.ToString("dd/MM/yyyy HH:mm") ?? ""
                }).ToList();
            }

            // Map Messages DTO
            if (messageEntities != null && messageEntities.Any())
            {
                cardDto.Messages = messageEntities.Select(m => new MessageDto
                {
                    IdTinNhan = m.IdTinNhan,
                    LoaiNguoiGui = m.LoaiNguoiGui ?? "KhachHang",
                    NoiDung = m.TinNhan1 ?? "",
                    ThoiGian = m.ThoiGian?.ToString("HH:mm dd/MM") ?? "",
                    TrangThai = m.TrangThai ?? "Đã gửi"
                }).ToList();
            }

            // Map Rating DTO
            if (ratingEntity != null)
            {
                cardDto.Rating = new RatingDto
                {
                    IdDanhGia = ratingEntity.IdDanhGia,
                    SoSao = (int)Math.Round(ratingEntity.DiemTrungBinh),
                    NhanXet = ratingEntity.NhanXet ?? "",
                    NgayDanhGia = ratingEntity.NgayDanhGia?.ToString("dd/MM/yyyy") ?? ""
                };
            }

            _logger.LogInformation("Successfully retrieved ticket {MaPhieu} for customer {IdKhachHang}", cardDto.TicketCode, idKhachHang.Value);

            return new LookupTicketResponse
            {
                Success = true,
                Message = "Tra cứu thông tin phiếu hỗ trợ thành công.",
                Intent = "LookupTicket",
                ContextTicketCode = cardDto.TicketCode,
                Ticket = cardDto
            };
        }

        private static string MapPriorityText(int? priority)
        {
            return priority switch
            {
                1 => "Thấp",
                2 => "Trung bình",
                3 => "Cao",
                4 => "Khẩn cấp",
                _ => "Trung bình"
            };
        }

        private static string MaskPhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return "Chưa cập nhật";
            return phone.Length > 6 ? string.Concat(phone.AsSpan(0, 4), "***", phone.AsSpan(phone.Length - 3)) : phone;
        }

        private static string MaskEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email)) return "Chưa cập nhật";
            var parts = email.Split('@');
            if (parts.Length < 2) return email;
            var name = parts[0];
            var maskedName = name.Length > 2 ? string.Concat(name.AsSpan(0, 1), "***", name.AsSpan(name.Length - 1)) : name;
            return $"{maskedName}@{parts[1]}";
        }
    }
}
