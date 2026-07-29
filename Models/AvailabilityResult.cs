using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models;

/// <summary>
/// Kết quả kiểm tra khả năng làm việc của nhân viên (Availability Service Output)
/// </summary>
public class AvailabilityResult
{
    /// <summary>
    /// Cho biết nhân viên có hợp lệ/rảnh để tiếp nhận lịch hẹn trong khung giờ được chọn không
    /// </summary>
    public bool IsAvailable { get; set; }

    /// <summary>
    /// Thông điệp tổng quan (Ví dụ: "Nhân viên hợp lệ", "Nhân viên trùng lịch",...)
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Danh sách lý do chi tiết nếu không hợp lệ (Trùng lịch, vượt slot, ngoài giờ làm việc,...)
    /// </summary>
    public List<string> Reasons { get; set; } = new();

    /// <summary>
    /// Đề xuất các khung giờ khả thi khác của nhân viên này
    /// </summary>
    public List<DateTime> SuggestedSlots { get; set; } = new();

    /// <summary>
    /// Đề xuất danh sách ID các nhân viên kỹ thuật khác đang rảnh trong khung giờ này
    /// </summary>
    public List<int> SuggestedEmployeeIds { get; set; } = new();
}
