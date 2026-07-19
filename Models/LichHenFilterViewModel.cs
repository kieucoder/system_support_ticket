using System;

namespace SupportTicketSysterm.Models
{
    /// <summary>
    /// Filter params model cho query string binding trên trang Quản Lý Lịch Hẹn.
    /// </summary>
    public class LichHenFilterViewModel
    {
        /// <summary>ID nhân viên lọc.</summary>
        public int? NhanVien { get; set; }

        /// <summary>Trạng thái lịch hẹn: "Chờ xác nhận" | "Đã xác nhận" | "Đang thực hiện" | "Hoàn thành" | "Đã hủy"</summary>
        public string? TrangThai { get; set; }

        /// <summary>ID danh mục dịch vụ để lọc.</summary>
        public int? DanhMuc { get; set; }

        /// <summary>Từ ngày (yyyy-MM-dd) để lọc khoảng thời gian.</summary>
        public string? TuNgay { get; set; }

        /// <summary>Đến ngày (yyyy-MM-dd) để lọc khoảng thời gian.</summary>
        public string? DenNgay { get; set; }

        /// <summary>Từ khóa tìm kiếm: mã phiếu, tên khách hàng, SĐT, tiêu đề.</summary>
        public string? Keyword { get; set; }

        /// <summary>Cách sắp xếp: newest | oldest | priority | az</summary>
        public string Sort { get; set; } = "newest";

        /// <summary>Trang hiện tại (1-based).</summary>
        public int Page { get; set; } = 1;

        /// <summary>Số lịch hẹn mỗi trang.</summary>
        public int PageSize { get; set; } = 20;

        /// <summary>Tháng hiển thị trong calendar (null = tháng hiện tại).</summary>
        public int? Thang { get; set; }

        /// <summary>Năm hiển thị trong calendar (null = năm hiện tại).</summary>
        public int? Nam { get; set; }

        /// <summary>ID lịch hẹn đang được chọn để hiển thị chi tiết trong sidebar.</summary>
        public int? SelectedId { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Parsed helpers
        // ─────────────────────────────────────────────────────────

        /// <summary>Parse TuNgay thành DateOnly? (trả về null nếu không hợp lệ).</summary>
        public DateOnly? TuNgayParsed
        {
            get
            {
                if (DateOnly.TryParse(TuNgay, out var d)) return d;
                return null;
            }
        }

        /// <summary>Parse DenNgay thành DateOnly? (trả về null nếu không hợp lệ).</summary>
        public DateOnly? DenNgayParsed
        {
            get
            {
                if (DateOnly.TryParse(DenNgay, out var d)) return d;
                return null;
            }
        }

        /// <summary>Tháng hiển thị calendar (default = tháng hiện tại).</summary>
        public int ThangHienThi => Thang ?? DateTime.Today.Month;

        /// <summary>Năm hiển thị calendar (default = năm hiện tại).</summary>
        public int NamHienThi => Nam ?? DateTime.Today.Year;
    }
}
