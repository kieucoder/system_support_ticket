namespace SupportTicketSysterm.Helpers
{
    public static class LichHenStatusHelper
    {
        /// <summary>
        /// Chuyển đổi mã TrangThai trong SQL Server thành chuỗi Tiếng Việt hiển thị
        /// </summary>
        public static string GetStatusText(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "Chờ xác nhận";
            return status.Trim() switch
            {
                "ChoXacNhan" or "Chờ xác nhận" => "Chờ xác nhận",
                "DaXacNhan" or "Đã xác nhận" => "Đã xác nhận",
                "DangThucHien" or "Đang thực hiện" => "Đang thực hiện",
                "HoanThanh" or "DaHoanThanh" or "Hoàn thành" => "Hoàn thành",
                "DaHuy" or "Đã hủy" => "Đã hủy",
                _ => status
            };
        }

        /// <summary>
        /// Lấy CSS Class của Badge tương ứng với TrangThai từ SQL Server
        /// - ChoXacNhan: Vàng (Warning)
        /// - DaXacNhan: Xanh Dương (Info / Primary)
        /// - DangThucHien: Tím (Purple)
        /// - HoanThanh: Xanh Lá (Success)
        /// - DaHuy: Đỏ (Danger)
        /// </summary>
        public static string GetStatusBadgeClass(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "badge-warning bg-warning text-dark";
            return status.Trim() switch
            {
                "ChoXacNhan" or "Chờ xác nhận" => "badge-warning bg-warning text-dark",
                "DaXacNhan" or "Đã xác nhận" => "badge-info bg-primary text-white",
                "DangThucHien" or "Đang thực hiện" => "badge-purple bg-purple text-white",
                "HoanThanh" or "DaHoanThanh" or "Hoàn thành" => "badge-success bg-success text-white",
                "DaHuy" or "Đã hủy" => "badge-danger bg-danger text-white",
                _ => "badge-secondary bg-secondary text-white"
            };
        }

        /// <summary>
        /// Lấy Bootstrap Icon class tương ứng với TrangThai từ SQL Server
        /// </summary>
        public static string GetStatusIcon(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "bi-hourglass-split";
            return status.Trim() switch
            {
                "ChoXacNhan" or "Chờ xác nhận" => "bi-hourglass-split",
                "DaXacNhan" or "Đã xác nhận" => "bi-check-circle-fill",
                "DangThucHien" or "Đang thực hiện" => "bi-gear-wide-connected",
                "HoanThanh" or "DaHoanThanh" or "Hoàn thành" => "bi-check-all",
                "DaHuy" or "Đã hủy" => "bi-x-circle-fill",
                _ => "bi-info-circle"
            };
        }
    }
}
