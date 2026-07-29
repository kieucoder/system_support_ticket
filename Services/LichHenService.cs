using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Repositories.Interfaces;

namespace SupportTicketSysterm.Services;

/// <summary>
/// Service Quản lý Lịch Hẹn chuẩn RBAC, Repository Pattern, Service Pattern & SOLID
/// </summary>
public class LichHenService : ILichHenService
{
    private readonly TechSupportContext _context;
    private readonly ILichHenRepository _lichHenRepository;
    private readonly IAvailabilityService _availabilityService;
    private readonly ISignalRService _signalRService;

    public LichHenService(
        TechSupportContext context,
        ILichHenRepository lichHenRepository,
        IAvailabilityService availabilityService,
        ISignalRService signalRService)
    {
        _context = context;
        _lichHenRepository = lichHenRepository;
        _availabilityService = availabilityService;
        _signalRService = signalRService;
    }

    private static bool IsAdminRole(string role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        var normalizedRole = role.Trim().ToLower();
        return normalizedRole == "admin" || normalizedRole == "quantrivien";
    }

    /// <summary>
    /// Kiểm tra quyền truy cập xem thông tin lịch hẹn (RBAC)
    /// </summary>
    public async Task<bool> CanUserAccessAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole)
    {
        if (IsAdminRole(currentUserRole)) return true;

        var lichHen = await _lichHenRepository.GetByIdAsync(idLichHen);
        if (lichHen == null) return false;

        // Nếu người dùng là Nhân viên, chỉ được xem lịch hẹn của chính mình
        return lichHen.IdNhanVien == currentUserId || 
               (lichHen.IdPhieuNavigation != null && lichHen.IdPhieuNavigation.IdNhanVien == currentUserId);
    }

    /// <summary>
    /// Kiểm tra quyền chỉnh sửa/thao tác lịch hẹn (RBAC)
    /// </summary>
    public async Task<bool> CanUserModifyAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole)
    {
        if (IsAdminRole(currentUserRole)) return true;

        var lichHen = await _lichHenRepository.GetByIdAsync(idLichHen);
        if (lichHen == null) return false;

        return lichHen.IdNhanVien == currentUserId ||
               (lichHen.IdPhieuNavigation != null && lichHen.IdPhieuNavigation.IdNhanVien == currentUserId);
    }

    /// <summary>
    /// 1. KHÁCH HÀNG: Tạo yêu cầu lịch hẹn (Trạng thái = ChoXacNhan)
    /// </summary>
    public async Task<LichHen> CreateAppointmentRequestAsync(CreateLichHenRequestDto dto, int idKhachHang)
    {
        if (dto.ThoiGianBatDau <= DateTime.Now)
            throw new ArgumentException("Thời gian hẹn phải lớn hơn thời gian hiện tại.");

        if (dto.ThoiGianKetThuc <= dto.ThoiGianBatDau)
            throw new ArgumentException("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");

        var phieu = await _context.PhieuHoTros
            .FirstOrDefaultAsync(p => p.IdPhieu == dto.IdPhieu);

        if (phieu == null)
            throw new KeyNotFoundException("Phiếu hỗ trợ không tồn tại.");

        if (phieu.IdKhachHang != idKhachHang)
            throw new UnauthorizedAccessException("403 Forbidden: Phiếu hỗ trợ không thuộc quyền sở hữu của bạn.");

        if (string.Equals(phieu.TrangThai, "DaHoanThanh", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(phieu.TrangThai, "Hoàn thành", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(phieu.TrangThai, "DaHuy", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(phieu.TrangThai, "Đã hủy", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Không thể tạo lịch hẹn cho phiếu hỗ trợ đã đóng/hoàn thành/đã hủy.");
        }

        bool hasActiveAppt = await _context.LichHens
            .AnyAsync(l => l.IdPhieu == dto.IdPhieu
                        && (l.TrangThai == "ChoXacNhan" || l.TrangThai == "Chờ xác nhận"
                            || l.TrangThai == "DaXacNhan" || l.TrangThai == "Đã xác nhận"
                            || l.TrangThai == "DangThucHien" || l.TrangThai == "Đang thực hiện"));

        if (hasActiveAppt)
            throw new InvalidOperationException("Phiếu hỗ trợ này hiện đã có lịch hẹn đang có hiệu lực (Chờ xác nhận / Đã xác nhận). Vui lòng không tạo thêm.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Cập nhật địa chỉ mới vào tài khoản Khách hàng nếu có nhập địa chỉ mới
            string userAddress = dto.DiaDiem?.Trim() ?? "";
            var khachHang = await _context.KhachHangs.FindAsync(idKhachHang);
            if (khachHang != null && !string.IsNullOrWhiteSpace(userAddress) && khachHang.DiaChi != userAddress)
            {
                khachHang.DiaChi = userAddress;
                _context.KhachHangs.Update(khachHang);
            }

            var lichHen = new LichHen
            {
                IdPhieu = dto.IdPhieu,
                IdNhanVien = phieu.IdNhanVien,
                NgayHen = DateOnly.FromDateTime(dto.ThoiGianBatDau),
                GioBatDau = TimeOnly.FromDateTime(dto.ThoiGianBatDau),
                GioKetThuc = TimeOnly.FromDateTime(dto.ThoiGianKetThuc),
                DiaChiHoTro = string.IsNullOrWhiteSpace(userAddress) ? (khachHang?.DiaChi ?? "") : userAddress,
                GhiChu = dto.GhiChu,
                TrangThai = "ChoXacNhan"
            };

            await _lichHenRepository.AddAsync(lichHen);

            string trangThaiCu = phieu.TrangThai ?? "Chờ tiếp nhận";
            phieu.TrangThai = "DangXuLy";
            phieu.CanLichHen = "Có";
            phieu.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);

            var log = new LichSuHoTro
            {
                IdPhieu = phieu.IdPhieu,
                IdNhanVien = phieu.IdNhanVien,
                TrangThaiCu = trangThaiCu,
                TrangThaiMoi = "DangXuLy",
                NoiDungCapNhat = $"Khách hàng gửi yêu cầu lịch hẹn mới [{dto.ThoiGianBatDau:dd/MM/yyyy HH:mm} - {dto.ThoiGianKetThuc:HH:mm}]. Trạng thái: Chờ xác nhận.",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            try
            {
                if (!string.IsNullOrEmpty(phieu.MaPhieu) && _signalRService != null)
                {
                    await _signalRService.SendMessageToRoomAsync(phieu.MaPhieu, "Notification", new
                    {
                        message = $"Khách hàng đã gửi yêu cầu lịch hẹn mới cho phiếu {phieu.MaPhieu}",
                        idLichHen = lichHen.IdLichHen,
                        status = "ChoXacNhan"
                    });
                }
            }
            catch
            {
                // Realtime broadcast exception ignored
            }

            return lichHen;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 2. ADMIN / STAFF: Phân công nhân viên & Xác nhận lịch (Có phân quyền RBAC)
    /// </summary>
    public async Task<LichHen> AssignAndConfirmAppointmentAsync(AssignLichHenDto dto, int currentUserId, string currentUserRole)
    {
        var lichHen = await _lichHenRepository.GetByIdAsync(dto.IdLichHen);
        if (lichHen == null)
            throw new KeyNotFoundException("Lịch hẹn không tồn tại.");

        // Kiểm tra phân quyền RBAC
        if (!IsAdminRole(currentUserRole))
        {
            // Nhân viên chỉ được thao tác lịch của chính mình
            if (lichHen.IdNhanVien.HasValue && lichHen.IdNhanVien.Value != currentUserId)
            {
                throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền xác nhận hoặc phân công lại lịch hẹn của nhân viên khác.");
            }
            // Nhân viên không được tự đổi IdNhanVien sang nhân viên khác
            if (dto.IdNhanVien != currentUserId && dto.IdNhanVien > 0)
            {
                throw new UnauthorizedAccessException("403 Forbidden: Nhân viên không có quyền thay đổi nhân viên phụ trách lịch hẹn.");
            }
            // Mặc định gán IdNhanVien = currentUserId nếu là Nhân viên
            dto.IdNhanVien = currentUserId;
        }

        DateTime start = dto.ThoiGianBatDau ?? lichHen.ThoiGianBatDau;
        DateTime end = dto.ThoiGianKetThuc ?? lichHen.ThoiGianKetThuc;

        // Rule II.5: Kiểm tra nhân viên phải đang hoạt động (TrangThai != "Khoa")
        var nhanVienObj = await _context.NhanViens.FindAsync(dto.IdNhanVien);
        if (nhanVienObj == null)
            throw new KeyNotFoundException("Nhân viên kỹ thuật không tồn tại.");
        if (string.Equals(nhanVienObj.TrangThai, "Khoa", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(nhanVienObj.TrangThai, "Khóa", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Nhân viên '{nhanVienObj.HoTen}' hiện đang bị khóa tài khoản, không thể phân công lịch hẹn.");
        }

        // Rule II.7: Tối đa 8 lịch hẹn / ngày / nhân viên
        DateOnly appointmentDate = DateOnly.FromDateTime(start);
        int todayApptCount = await _context.LichHens
            .CountAsync(l => l.IdNhanVien == dto.IdNhanVien
                          && l.IdLichHen != dto.IdLichHen
                          && l.NgayHen == appointmentDate
                          && l.TrangThai != "DaHuy" && l.TrangThai != "Đã hủy");

        if (todayApptCount >= 8)
        {
            throw new InvalidOperationException($"Nhân viên '{nhanVienObj.HoTen}' đã đạt hạn mức tối đa 8 lịch hẹn trong ngày {appointmentDate:dd/MM/yyyy}. Vui lòng chọn KTV khác!");
        }

        var availResult = await _availabilityService.CheckEmployeeAvailabilityAsync(
            dto.IdNhanVien,
            start,
            end,
            lichHen.HinhThuc ?? "TrucTiep",
            lichHen.IdLichHen);

        if (!availResult.IsAvailable)
        {
            string reasonStr = string.Join("; ", availResult.Reasons);
            throw new InvalidOperationException($"Không thể phân công nhân viên: {availResult.Message} (Lý do: {reasonStr})");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string oldStatus = lichHen.TrangThaiLich ?? "ChoXacNhan";

            lichHen.IdNhanVien = dto.IdNhanVien;
            lichHen.ThoiGianBatDau = start;
            lichHen.ThoiGianKetThuc = end;
            lichHen.TrangThaiLich = TrangThaiLichHen.DaXacNhan.ToString();
            lichHen.NgayXacNhan = DateTime.Now;
            lichHen.NgayCapNhat = DateTime.Now;

            if (lichHen.IdPhieuNavigation != null)
            {
                lichHen.IdPhieuNavigation.IdNhanVien = dto.IdNhanVien;
                lichHen.IdPhieuNavigation.TrangThai = "DangXuLy";
            }

            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = currentUserId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = TrangThaiLichHen.DaXacNhan.ToString(),
                NoiDungCapNhat = $"Phân công KTV (ID: {dto.IdNhanVien}) và xác nhận lịch hẹn [{start:dd/MM/yyyy HH:mm} - {end:HH:mm}].",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (lichHen.IdPhieuNavigation != null)
            {
                var staff = await _context.NhanViens.FindAsync(dto.IdNhanVien);
                string ktvName = staff?.HoTen ?? "Kỹ thuật viên Viettel";
                string ktvPhone = staff?.SoDienThoai ?? "";

                var notifyData = new
                {
                    type = "AppointmentConfirmed",
                    message = $"Lịch hẹn của bạn đã được xác nhận.",
                    idLichHen = lichHen.IdLichHen,
                    maPhieu = lichHen.IdPhieuNavigation.MaPhieu,
                    status = "DaXacNhan",
                    statusText = "Đã xác nhận",
                    ktvName = ktvName,
                    ktvPhone = ktvPhone,
                    time = DateTime.Now.ToString("HH:mm"),
                    title = "Lịch đã xác nhận"
                };

                await _signalRService.BroadcastNotificationAsync(lichHen.IdPhieuNavigation.MaPhieu ?? "", lichHen.IdPhieuNavigation.IdKhachHang, "Notification", notifyData);
            }

            return lichHen;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 3. ADMIN / STAFF: Đổi lịch hẹn (Có phân quyền RBAC)
    /// </summary>
    public async Task<LichHen> RescheduleAppointmentAsync(RescheduleLichHenDto dto, int currentUserId, string currentUserRole)
    {
        if (dto.NewThoiGianBatDau <= DateTime.Now)
            throw new ArgumentException("Thời gian hẹn mới phải lớn hơn thời gian hiện tại.");

        if (dto.NewThoiGianKetThuc <= dto.NewThoiGianBatDau)
            throw new ArgumentException("Thời gian kết thúc mới phải lớn hơn thời gian bắt đầu.");

        var oldLichHen = await _lichHenRepository.GetByIdAsync(dto.IdLichHen);
        if (oldLichHen == null)
            throw new KeyNotFoundException("Lịch hẹn cũ không tồn tại.");

        // Kiểm tra phân quyền RBAC
        if (!IsAdminRole(currentUserRole) && oldLichHen.IdNhanVien != currentUserId)
        {
            throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền đổi lịch hẹn của nhân viên khác.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            oldLichHen.TrangThaiLich = TrangThaiLichHen.DaHuy.ToString();
            oldLichHen.LyDoHuy = $"Đổi sang lịch hẹn mới: {dto.LyDoDoiLich}";
            oldLichHen.NgayCapNhat = DateTime.Now;

            var newLichHen = new LichHen
            {
                IdPhieu = oldLichHen.IdPhieu,
                IdKhachHang = oldLichHen.IdKhachHang,
                IdNhanVien = oldLichHen.IdNhanVien,
                ThoiGianBatDau = dto.NewThoiGianBatDau,
                ThoiGianKetThuc = dto.NewThoiGianKetThuc,
                HinhThuc = oldLichHen.HinhThuc,
                DiaDiem = oldLichHen.DiaDiem,
                GhiChu = oldLichHen.GhiChu,
                TrangThaiLich = TrangThaiLichHen.ChoXacNhan.ToString(),
                LyDoDoiLich = dto.LyDoDoiLich,
                NgayTao = DateTime.Now
            };

            await _lichHenRepository.AddAsync(newLichHen);

            var log = new LichSuHoTro
            {
                IdPhieu = oldLichHen.IdPhieu,
                IdNhanVien = currentUserId,
                TrangThaiCu = oldLichHen.TrangThaiLich,
                TrangThaiMoi = "DoiLich",
                NoiDungCapNhat = $"Thay đổi thời gian lịch hẹn cũ #{oldLichHen.IdLichHen} sang khung giờ mới [{dto.NewThoiGianBatDau:dd/MM/yyyy HH:mm} - {dto.NewThoiGianKetThuc:HH:mm}]. Lý do: {dto.LyDoDoiLich}",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (oldLichHen.IdPhieuNavigation != null)
            {
                var notifyData = new
                {
                    type = "AppointmentRescheduled",
                    message = $"Lịch hẹn đã đổi sang {dto.NewThoiGianBatDau:HH:mm dd/MM/yyyy}.",
                    idLichHen = newLichHen.IdLichHen,
                    maPhieu = oldLichHen.IdPhieuNavigation.MaPhieu,
                    status = "ChoXacNhan",
                    statusText = "Đổi lịch sang " + dto.NewThoiGianBatDau.ToString("HH:mm"),
                    time = DateTime.Now.ToString("HH:mm"),
                    title = "Lịch đổi sang " + dto.NewThoiGianBatDau.ToString("HH:mm")
                };
                await _signalRService.BroadcastNotificationAsync(oldLichHen.IdPhieuNavigation.MaPhieu ?? "", oldLichHen.IdPhieuNavigation.IdKhachHang, "Notification", notifyData);
            }

            return newLichHen;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 4. ADMIN / STAFF: Hủy lịch hẹn (Có phân quyền RBAC)
    /// </summary>
    public async Task<LichHen> CancelAppointmentAsync(CancelLichHenDto dto, int currentUserId, string currentUserRole)
    {
        if (string.IsNullOrWhiteSpace(dto.LyDoHuy))
            throw new ArgumentException("Vui lòng nhập lý do hủy lịch hẹn.");

        var lichHen = await _lichHenRepository.GetByIdAsync(dto.IdLichHen);
        if (lichHen == null)
            throw new KeyNotFoundException("Lịch hẹn không tồn tại.");

        if (lichHen.TrangThai == "HoanThanh" || lichHen.TrangThai == "Hoàn thành" || lichHen.TrangThai == "DaHoanThanh")
            throw new InvalidOperationException("Lịch hẹn đã hoàn thành, không thể hủy.");

        if (lichHen.TrangThai == "DaHuy" || lichHen.TrangThai == "Đã hủy")
            throw new InvalidOperationException("Lịch hẹn này đã bị hủy trước đó.");

        // Kiểm tra phân quyền RBAC
        if (!IsAdminRole(currentUserRole) && lichHen.IdNhanVien != currentUserId)
        {
            throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền hủy lịch hẹn của nhân viên khác.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string oldStatus = lichHen.TrangThaiLich ?? "ChoXacNhan";

            lichHen.TrangThaiLich = TrangThaiLichHen.DaHuy.ToString();
            lichHen.TrangThai = "DaHuy";
            lichHen.LyDoHuy = dto.LyDoHuy;
            lichHen.NgayCapNhat = DateTime.Now;

            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = currentUserId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = TrangThaiLichHen.DaHuy.ToString(),
                NoiDungCapNhat = $"Đã hủy lịch hẹn #{lichHen.IdLichHen}. Lý do: {dto.LyDoHuy}",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (lichHen.IdPhieuNavigation != null)
            {
                var notifyData = new
                {
                    type = "AppointmentCancelled",
                    message = $"Lịch hẹn cho phiếu {lichHen.IdPhieuNavigation.MaPhieu} đã bị hủy.",
                    idLichHen = lichHen.IdLichHen,
                    maPhieu = lichHen.IdPhieuNavigation.MaPhieu,
                    status = "DaHuy",
                    statusText = "Đã hủy",
                    time = DateTime.Now.ToString("HH:mm"),
                    title = "Lịch hẹn đã bị hủy"
                };
                await _signalRService.BroadcastNotificationAsync(lichHen.IdPhieuNavigation.MaPhieu ?? "", lichHen.IdPhieuNavigation.IdKhachHang, "Notification", notifyData);
            }

            return lichHen;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// <summary>
    /// 5. ADMIN / STAFF: Hoàn thành lịch hẹn (Có phân quyền RBAC & Ghi chú kết quả)
    /// </summary>
    public async Task<LichHen> CompleteAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole, string? ghiChuKetQua = null)
    {
        var lichHen = await _lichHenRepository.GetByIdAsync(idLichHen);
        if (lichHen == null)
            throw new KeyNotFoundException("Lịch hẹn không tồn tại.");

        // Kiểm tra phân quyền RBAC
        if (!IsAdminRole(currentUserRole) && lichHen.IdNhanVien != currentUserId)
        {
            throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền hoàn thành lịch hẹn của nhân viên khác.");
        }

        // Kiểm tra trạng thái phiếu hỗ trợ
        if (lichHen.IdPhieuNavigation != null &&
            (string.Equals(lichHen.IdPhieuNavigation.TrangThai, "DaHuy", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(lichHen.IdPhieuNavigation.TrangThai, "Đã hủy", StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("Phiếu hỗ trợ đã bị hủy. Không thể hoàn thành lịch hẹn.");
        }

        if (lichHen.TrangThai == "HoanThanh" || lichHen.TrangThai == "Hoàn thành" || lichHen.TrangThai == "DaHoanThanh")
            throw new InvalidOperationException("Lịch hẹn này đã được hoàn thành trước đó.");

        if (lichHen.TrangThai == "DaHuy" || lichHen.TrangThai == "Đã hủy")
            throw new InvalidOperationException("Không thể hoàn thành lịch hẹn đã bị hủy.");

        // Ràng buộc quy trình: Bắt buộc phải Đang thực hiện mới được Hoàn thành
        if (lichHen.TrangThai != "DangThucHien" && lichHen.TrangThai != "Đang thực hiện" &&
            lichHen.TrangThaiLich != "DangThucHien" && lichHen.TrangThaiLich != "Đang thực hiện")
        {
            throw new InvalidOperationException("Lịch hẹn chưa được chuyển sang trạng thái \"Đang thực hiện\".");
        }

        DateOnly today = DateOnly.FromDateTime(DateTime.Today);
        TimeOnly nowTime = TimeOnly.FromDateTime(DateTime.Now);

        if (lichHen.NgayHen.HasValue)
        {
            if (lichHen.NgayHen.Value > today)
            {
                throw new InvalidOperationException($"Chưa đến ngày hẹn ({lichHen.NgayHen.Value:dd/MM/yyyy}). Không thể hoàn thành trước thời gian hẹn!");
            }
            if (lichHen.NgayHen.Value == today && lichHen.GioBatDau.HasValue && lichHen.GioBatDau.Value > nowTime)
            {
                throw new InvalidOperationException($"Chưa đến giờ hẹn ({lichHen.GioBatDau.Value:hh\\:mm}). Không thể hoàn thành trước thời gian hẹn!");
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string oldStatus = lichHen.TrangThaiLich ?? "DangThucHien";

            lichHen.TrangThaiLich = TrangThaiLichHen.DaHoanThanh.ToString();
            lichHen.TrangThai = "Hoàn thành";
            lichHen.NgayHoanThanh = DateTime.Now;
            lichHen.NgayCapNhat = DateTime.Now;

            if (!string.IsNullOrWhiteSpace(ghiChuKetQua))
            {
                lichHen.GhiChu = string.IsNullOrWhiteSpace(lichHen.GhiChu) 
                    ? ghiChuKetQua 
                    : $"{lichHen.GhiChu}\n[Ghi chú kết quả]: {ghiChuKetQua}";
            }

            if (lichHen.IdPhieuNavigation != null)
            {
                lichHen.IdPhieuNavigation.TrangThai = "Hoàn thành";
                lichHen.IdPhieuNavigation.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);
            }

            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = currentUserId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = "HoanThanh",
                NoiDungCapNhat = string.IsNullOrWhiteSpace(ghiChuKetQua) 
                    ? $"Hoàn thành buổi lịch hẹn #{lichHen.IdLichHen}." 
                    : $"Hoàn thành buổi lịch hẹn #{lichHen.IdLichHen}. Kết quả: {ghiChuKetQua}",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (lichHen.IdPhieuNavigation != null && _signalRService != null)
            {
                try
                {
                    var notifyData = new
                    {
                        type = "AppointmentCompleted",
                        message = $"Lịch hẹn cho phiếu {lichHen.IdPhieuNavigation.MaPhieu} đã hoàn thành. Vui lòng đánh giá dịch vụ hỗ trợ.",
                        idLichHen = lichHen.IdLichHen,
                        maPhieu = lichHen.IdPhieuNavigation.MaPhieu,
                        status = "DaHoanThanh",
                        statusText = "Hoàn thành",
                        time = DateTime.Now.ToString("HH:mm"),
                        title = "Lịch hẹn đã hoàn thành"
                    };
                    await _signalRService.BroadcastNotificationAsync(lichHen.IdPhieuNavigation.MaPhieu ?? "", lichHen.IdPhieuNavigation.IdKhachHang, "Notification", notifyData);
                }
                catch
                {
                    // Realtime notification exception ignored
                }
            }

            return lichHen;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 6. KTV / STAFF: Bắt đầu hỗ trợ (Chuyển trạng thái sang Đang thực hiện - Có RBAC & EF Core Transaction)
    /// </summary>
    public async Task<LichHen> StartSupportAppointmentAsync(int idLichHen, int currentUserId, string currentUserRole)
    {
        var lichHen = await _lichHenRepository.GetByIdAsync(idLichHen);
        if (lichHen == null)
            throw new KeyNotFoundException("Lịch hẹn không tồn tại.");

        if (!IsAdminRole(currentUserRole) && lichHen.IdNhanVien != currentUserId)
        {
            throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền bắt đầu hỗ trợ lịch hẹn của nhân viên khác.");
        }

        if (lichHen.TrangThai == "HoanThanh" || lichHen.TrangThai == "Hoàn thành" || lichHen.TrangThai == "DaHoanThanh")
            throw new InvalidOperationException("Lịch hẹn này đã hoàn thành, không thể bắt đầu lại.");

        if (lichHen.TrangThai == "DaHuy" || lichHen.TrangThai == "Đã hủy")
            throw new InvalidOperationException("Lịch hẹn đã bị hủy, không thể bắt đầu hỗ trợ.");

        DateOnly today = DateOnly.FromDateTime(DateTime.Today);
        TimeOnly nowTime = TimeOnly.FromDateTime(DateTime.Now);

        if (lichHen.NgayHen.HasValue)
        {
            if (lichHen.NgayHen.Value > today)
            {
                throw new InvalidOperationException($"Chưa đến ngày hẹn ({lichHen.NgayHen.Value:dd/MM/yyyy}). Không thể bắt đầu hỗ trợ trước ngày hẹn!");
            }
            if (lichHen.NgayHen.Value == today && lichHen.GioBatDau.HasValue && lichHen.GioBatDau.Value > nowTime)
            {
                throw new InvalidOperationException($"Chưa đến giờ hẹn ({lichHen.GioBatDau.Value:hh\\:mm}). Không thể bắt đầu hỗ trợ trước giờ hẹn!");
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string oldStatus = lichHen.TrangThaiLich ?? "DaXacNhan";

            lichHen.TrangThaiLich = TrangThaiLichHen.DangThucHien.ToString();
            lichHen.TrangThai = "Đang thực hiện";
            lichHen.NgayCapNhat = DateTime.Now;

            if (lichHen.IdPhieuNavigation != null)
            {
                lichHen.IdPhieuNavigation.TrangThai = "Đang xử lý";
                lichHen.IdPhieuNavigation.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);
            }

            var log = new LichSuHoTro
            {
                IdPhieu = lichHen.IdPhieu,
                IdNhanVien = currentUserId,
                TrangThaiCu = oldStatus,
                TrangThaiMoi = TrangThaiLichHen.DangThucHien.ToString(),
                NoiDungCapNhat = $"KTV (ID: {currentUserId}) đã bắt đầu hỗ trợ lịch hẹn #{lichHen.IdLichHen}.",
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (lichHen.IdPhieuNavigation != null && _signalRService != null)
            {
                var notifyData = new
                {
                    type = "AppointmentStarted",
                    message = $"Kỹ thuật viên đã bắt đầu hỗ trợ lịch hẹn #{lichHen.IdLichHen}.",
                    idLichHen = lichHen.IdLichHen,
                    maPhieu = lichHen.IdPhieuNavigation.MaPhieu,
                    status = "DangThucHien",
                    statusText = "Đang thực hiện",
                    time = DateTime.Now.ToString("HH:mm"),
                    title = "Đã bắt đầu hỗ trợ"
                };
                await _signalRService.BroadcastNotificationAsync(lichHen.IdPhieuNavigation.MaPhieu ?? "", lichHen.IdPhieuNavigation.IdKhachHang, "Notification", notifyData);
            }

            return lichHen;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Lấy chi tiết lịch hẹn theo ID dành cho người dùng hiện tại (RBAC Check)
    /// </summary>
    public async Task<LichHen?> GetByIdForUserAsync(int idLichHen, int currentUserId, string currentUserRole)
    {
        var lichHen = await _lichHenRepository.GetByIdAsync(idLichHen);
        if (lichHen == null) return null;

        if (!IsAdminRole(currentUserRole))
        {
            if (lichHen.IdNhanVien != currentUserId &&
                (lichHen.IdPhieuNavigation == null || lichHen.IdPhieuNavigation.IdNhanVien != currentUserId))
            {
                throw new UnauthorizedAccessException("403 Forbidden: Bạn không có quyền xem thông tin lịch hẹn này.");
            }
        }

        return lichHen;
    }

    public async Task<LichHen?> GetByIdAsync(int idLichHen)
    {
        return await _lichHenRepository.GetByIdAsync(idLichHen);
    }

    public async Task<List<LichHen>> GetCustomerAppointmentsAsync(int idKhachHang)
    {
        return await _lichHenRepository.GetCustomerAppointmentsAsync(idKhachHang);
    }

    public async Task<List<LichHen>> GetStaffAppointmentsAsync(int idNhanVien)
    {
        return await _lichHenRepository.GetAppointmentsByEmployeeAsync(idNhanVien);
    }

    /// <summary>
    /// Lấy danh sách lịch hẹn theo phân quyền người dùng (RBAC)
    /// </summary>
    public async Task<List<LichHen>> GetAppointmentsForUserAsync(int currentUserId, string currentUserRole, LichHenFilterDto? filter = null)
    {
        filter ??= new LichHenFilterDto();

        if (IsAdminRole(currentUserRole))
        {
            return await _lichHenRepository.GetAllAppointmentsAsync(filter);
        }
        else
        {
            // Nhân viên thường: BẮT BUỘC chỉ lọc theo IdNhanVien của chính mình
            filter.IdNhanVien = currentUserId;
            return await _lichHenRepository.GetAppointmentsByEmployeeAsync(currentUserId, filter);
        }
    }

    public async Task<List<PhieuHoTro>> GetEligibleTicketsForCustomerAsync(int idKhachHang)
    {
        return await _lichHenRepository.GetEligibleTicketsForCustomerAsync(idKhachHang);
    }

    public async Task<List<LichHen>> GetAllAppointmentsAsync(LichHenFilterDto? filter = null)
    {
        return await _lichHenRepository.GetAllAppointmentsAsync(filter);
    }
}
