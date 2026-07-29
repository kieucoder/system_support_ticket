using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.Services;

/// <summary>
/// Service kiểm tra khả năng làm việc của nhân viên (Availability Engine)
/// </summary>
public interface IAvailabilityService
{
    /// <summary>
    /// Kiểm tra tính khả thi/rảnh rỗi của nhân viên cho một khung giờ nhất định theo 8 tiêu chí chuẩn Help Desk
    /// </summary>
    Task<AvailabilityResult> CheckEmployeeAvailabilityAsync(
        int nhanVienId,
        DateTime start,
        DateTime end,
        string hinhThuc = "TrucTiep",
        int? currentLichHenId = null);

    /// <summary>
    /// Gợi ý các khung giờ còn trống trong ngày của nhân viên
    /// </summary>
    Task<List<DateTime>> SuggestAvailableSlotsAsync(
        int nhanVienId,
        DateTime start);

    /// <summary>
    /// Gợi ý danh sách các nhân viên kỹ thuật rảnh trong khoảng thời gian (start -> end)
    /// </summary>
    Task<List<NhanVien>> SuggestAvailableEmployeesAsync(
        DateTime start,
        DateTime end,
        string hinhThuc = "TrucTiep");
}
