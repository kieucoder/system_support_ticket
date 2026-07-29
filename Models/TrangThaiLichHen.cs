namespace SupportTicketSysterm.Models;

/// <summary>
/// Trạng thái của Lịch hẹn theo quy trình Help Desk
/// </summary>
public enum TrangThaiLichHen
{
    /// <summary>
    /// Khách hàng vừa gửi yêu cầu, chờ Admin/KTV duyệt & phân công
    /// </summary>
    ChoXacNhan = 0,

    /// <summary>
    /// Đã được phân công KTV và xác nhận khung giờ
    /// </summary>
    DaXacNhan = 1,

    /// <summary>
    /// KTV đã đến hỗ trợ và hoàn tất buổi hẹn
    /// </summary>
    DaHoanThanh = 2,

    /// <summary>
    /// Lịch bị hủy bởi Khách hàng hoặc Admin/KTV (hoặc bị hủy do đổi sang lịch mới)
    /// </summary>
    DaHuy = 3,

    /// <summary>
    /// KTV đã bắt đầu tiến hành hỗ trợ
    /// </summary>
    DangThucHien = 4
}
