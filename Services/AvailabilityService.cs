using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services;

/// <summary>
/// Chịu trách nhiệm kiểm tra khả năng làm việc của nhân viên theo đúng 8 tiêu chí chuẩn quy trình Help Desk
/// </summary>
public class AvailabilityService : IAvailabilityService
{
    private readonly TechSupportContext _context;
    private readonly IConfiguration _configuration;

    public AvailabilityService(TechSupportContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /// <summary>
    /// Kiểm tra khả năng làm việc của nhân viên (8 tiêu chí theo thứ tự)
    /// </summary>
    public async Task<AvailabilityResult> CheckEmployeeAvailabilityAsync(
        int nhanVienId,
        DateTime start,
        DateTime end,
        string hinhThuc = "TrucTiep",
        int? currentLichHenId = null)
    {
        var result = new AvailabilityResult
        {
            IsAvailable = true,
            Message = "Nhân viên hợp lệ và rảnh lịch."
        };

        // --------------------------------------------------------------------------
        // 1. Kiểm tra Nhân viên có tồn tại không
        // --------------------------------------------------------------------------
        var nhanVien = await _context.NhanViens
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.IdNhanVien == nhanVienId);

        if (nhanVien == null)
        {
            result.IsAvailable = false;
            result.Message = "Nhân viên không tồn tại trong hệ thống.";
            result.Reasons.Add("Không tìm thấy dữ liệu nhân viên ID: " + nhanVienId);
            return result;
        }

        // --------------------------------------------------------------------------
        // 2. Kiểm tra Nhân viên có đang hoạt động không
        // --------------------------------------------------------------------------
        bool isHoatDong = string.Equals(nhanVien.TrangThai, "HoatDong", StringComparison.OrdinalIgnoreCase)
                       || string.Equals(nhanVien.TrangThai, "Đang làm việc", StringComparison.OrdinalIgnoreCase)
                       || string.Equals(nhanVien.TrangThai, "Hoạt động", StringComparison.OrdinalIgnoreCase)
                       || string.IsNullOrEmpty(nhanVien.TrangThai);

        if (!isHoatDong)
        {
            result.IsAvailable = false;
            result.Reasons.Add("Nhân viên đang ở trạng thái ngưng hoạt động/tạm khóa.");
        }

        // --------------------------------------------------------------------------
        // 3. Kiểm tra Có đúng vai trò kỹ thuật không
        // --------------------------------------------------------------------------
        // Chức vụ/Vai trò chấp nhận: Kỹ thuật viên, Technical, NhanVien, Staff,...
        string chucVu = (nhanVien.ChucVu ?? "").Trim();
        bool isKyThuat = string.IsNullOrEmpty(chucVu)
                      || chucVu.Contains("Kỹ thuật", StringComparison.OrdinalIgnoreCase)
                      || chucVu.Contains("Nhân viên", StringComparison.OrdinalIgnoreCase)
                      || chucVu.Contains("Staff", StringComparison.OrdinalIgnoreCase)
                      || chucVu.Contains("Tech", StringComparison.OrdinalIgnoreCase);

        if (!isKyThuat)
        {
            result.IsAvailable = false;
            result.Reasons.Add($"Nhân viên có chức vụ '{chucVu}' không thuộc vai trò kỹ thuật viên.");
        }

        // --------------------------------------------------------------------------
        // 4. Kiểm tra Nghỉ phép
        // --------------------------------------------------------------------------
        // TODO: Check Employee Leave Schedule when Leave table (BangNghiPhep) is available in DB schema.

        // --------------------------------------------------------------------------
        // 5. Kiểm tra Ngoài giờ làm việc (Quy định: 08:00 - 17:00)
        // --------------------------------------------------------------------------
        var startWork = new TimeSpan(8, 0, 0);
        var endWork = new TimeSpan(17, 0, 0);

        if (start.TimeOfDay < startWork || end.TimeOfDay > endWork || start >= end)
        {
            result.IsAvailable = false;
            result.Reasons.Add($"Khung giờ [{start:HH:mm} - {end:HH:mm}] nằm ngoài giờ làm việc quy định (08:00 - 17:00).");
        }

        // --------------------------------------------------------------------------
        // 6. Kiểm tra Trùng lịch (Chỉ kiểm tra TrangThai = DaXacNhan, bỏ qua ChoXacNhan & DaHuy)
        // --------------------------------------------------------------------------
        var existingAppts = await _context.LichHens
            .AsNoTracking()
            .Where(l => l.IdNhanVien == nhanVienId
                     && (l.TrangThai == "DaXacNhan" || l.TrangThai == "Đã xác nhận")
                     && (currentLichHenId == null || l.IdLichHen != currentLichHenId.Value))
            .ToListAsync();

        bool hasOverlap = existingAppts.Any(l =>
        {
            // Calculate DateTime range from LichHen
            DateTime apptStart = l.ThoiGianBatDau;
            DateTime apptEnd = l.ThoiGianKetThuc;

            // Fallback for legacy date/time fields if ThoiGianBatDau is not set
            if (l.NgayHen.HasValue && l.GioBatDau.HasValue && l.GioKetThuc.HasValue)
            {
                apptStart = l.NgayHen.Value.ToDateTime(l.GioBatDau.Value);
                apptEnd = l.NgayHen.Value.ToDateTime(l.GioKetThuc.Value);
            }

            // Overlap condition: start < apptEnd && end > apptStart
            return start < apptEnd && end > apptStart;
        });

        if (hasOverlap)
        {
            result.IsAvailable = false;
            result.Reasons.Add("Nhân viên đã bị trùng lịch với một lịch hẹn khác đã được xác nhận.");
        }

        // --------------------------------------------------------------------------
        // 7. Kiểm tra Vượt số lịch tối đa trong ngày (Ví dụ: 8 lịch/ngày từ AppSettings)
        // --------------------------------------------------------------------------
        int maxDaily = _configuration.GetValue<int>("AppointmentSettings:MaxDailyAppointments", 8);
        DateTime targetDate = start.Date;

        int dailyApptCount = existingAppts.Count(l =>
        {
            DateTime date = l.NgayHen.HasValue ? l.NgayHen.Value.ToDateTime(TimeOnly.MinValue).Date : l.ThoiGianBatDau.Date;
            return date == targetDate;
        });

        if (dailyApptCount >= maxDaily)
        {
            result.IsAvailable = false;
            result.Reasons.Add($"Nhân viên đã đạt tối đa số lượng lịch hẹn cho phép ({maxDaily} lịch/ngày) trong ngày {targetDate:dd/MM/yyyy}.");
        }

        // --------------------------------------------------------------------------
        // 8. Nếu Hỗ trợ Trực tiếp (TrucTiep) => Kiểm tra Khoảng nghỉ (Buffer time = 15 phút)
        // --------------------------------------------------------------------------
        if (string.Equals(hinhThuc, "TrucTiep", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(hinhThuc, "Tại nhà", StringComparison.OrdinalIgnoreCase))
        {
            int bufferMinutes = 15;
            bool violatesBuffer = existingAppts.Any(l =>
            {
                DateTime apptStart = l.ThoiGianBatDau;
                DateTime apptEnd = l.ThoiGianKetThuc;

                if (l.NgayHen.HasValue && l.GioBatDau.HasValue && l.GioKetThuc.HasValue)
                {
                    apptStart = l.NgayHen.Value.ToDateTime(l.GioBatDau.Value);
                    apptEnd = l.NgayHen.Value.ToDateTime(l.GioKetThuc.Value);
                }

                // Check gap between appointments
                if (apptEnd <= start && (start - apptEnd).TotalMinutes < bufferMinutes)
                    return true;
                if (end <= apptStart && (apptStart - end).TotalMinutes < bufferMinutes)
                    return true;

                return false;
            });

            if (violatesBuffer)
            {
                result.IsAvailable = false;
                result.Reasons.Add($"Hỗ trợ trực tiếp yêu cầu khoảng nghỉ tối thiểu {bufferMinutes} phút giữa hai lịch hẹn để di chuyển.");
            }
        }

        // --------------------------------------------------------------------------
        // Tổng hợp Kết quả
        // --------------------------------------------------------------------------
        if (!result.IsAvailable)
        {
            result.Message = "Nhân viên không khả thi cho khung giờ được chọn.";
            
            // Tự động tìm khung giờ đề xuất & nhân viên thay thế
            result.SuggestedSlots = await SuggestAvailableSlotsAsync(nhanVienId, start);
            var altStaff = await SuggestAvailableEmployeesAsync(start, end, hinhThuc);
            result.SuggestedEmployeeIds = altStaff.Select(e => e.IdNhanVien).ToList();
        }

        return result;
    }

    /// <summary>
    /// Gợi ý các khung giờ còn trống của nhân viên trong ngày
    /// </summary>
    public async Task<List<DateTime>> SuggestAvailableSlotsAsync(int nhanVienId, DateTime start)
    {
        var slots = new List<DateTime>();
        DateTime date = start.Date;
        
        // Tạo các khung giờ 1 tiếng từ 08:00 đến 16:00 (kết thúc 17:00)
        for (int hour = 8; hour < 17; hour++)
        {
            DateTime slotStart = new DateTime(date.Year, date.Month, date.Day, hour, 0, 0);
            DateTime slotEnd = slotStart.AddHours(1);

            // Bỏ qua khung giờ quá khứ
            if (slotStart <= DateTime.Now) continue;

            // Check availability nhẹ
            var check = await CheckEmployeeAvailabilityInternalAsync(nhanVienId, slotStart, slotEnd);
            if (check)
            {
                slots.Add(slotStart);
            }
        }

        return slots;
    }

    /// <summary>
    /// Gợi ý danh sách kỹ thuật viên khác đang rảnh trong khung giờ này
    /// </summary>
    public async Task<List<NhanVien>> SuggestAvailableEmployeesAsync(DateTime start, DateTime end, string hinhThuc = "TrucTiep")
    {
        var allStaff = await _context.NhanViens
            .AsNoTracking()
            .ToListAsync();

        var availableStaff = new List<NhanVien>();

        foreach (var nv in allStaff)
        {
            var check = await CheckEmployeeAvailabilityInternalAsync(nv.IdNhanVien, start, end, hinhThuc);
            if (check)
            {
                availableStaff.Add(nv);
            }
        }

        return availableStaff;
    }

    /// <summary>
    /// Kiểm tra nội bộ nhanh không tạo vòng lặp gợi ý
    /// </summary>
    private async Task<bool> CheckEmployeeAvailabilityInternalAsync(int nhanVienId, DateTime start, DateTime end, string hinhThuc = "TrucTiep")
    {
        var nv = await _context.NhanViens.AsNoTracking().FirstOrDefaultAsync(n => n.IdNhanVien == nhanVienId);
        if (nv == null) return false;

        // Active check
        bool isHoatDong = string.Equals(nv.TrangThai, "HoatDong", StringComparison.OrdinalIgnoreCase)
                       || string.Equals(nv.TrangThai, "Đang làm việc", StringComparison.OrdinalIgnoreCase)
                       || string.Equals(nv.TrangThai, "Hoạt động", StringComparison.OrdinalIgnoreCase)
                       || string.IsNullOrEmpty(nv.TrangThai);
        if (!isHoatDong) return false;

        // Working hours
        if (start.TimeOfDay < new TimeSpan(8, 0, 0) || end.TimeOfDay > new TimeSpan(17, 0, 0) || start >= end)
            return false;

        // Overlap check
        var appts = await _context.LichHens
            .AsNoTracking()
            .Where(l => l.IdNhanVien == nhanVienId && (l.TrangThai == "DaXacNhan" || l.TrangThai == "Đã xác nhận"))
            .ToListAsync();

        bool hasOverlap = appts.Any(l =>
        {
            DateTime apptStart = l.ThoiGianBatDau;
            DateTime apptEnd = l.ThoiGianKetThuc;
            if (l.NgayHen.HasValue && l.GioBatDau.HasValue && l.GioKetThuc.HasValue)
            {
                apptStart = l.NgayHen.Value.ToDateTime(l.GioBatDau.Value);
                apptEnd = l.NgayHen.Value.ToDateTime(l.GioKetThuc.Value);
            }
            return start < apptEnd && end > apptStart;
        });

        return !hasOverlap;
    }
}
