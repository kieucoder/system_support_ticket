using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models
{
    /// <summary>
    /// DTO đại diện một lịch hẹn đầy đủ thông tin, dùng cho calendar event và detail sidebar.
    /// </summary>
    public class LichHenViewModel
    {
        // --- Thông tin lịch hẹn ---
        public int IdLichHen { get; set; }
        public string? TrangThai { get; set; }
        public DateOnly? NgayHen { get; set; }
        public TimeOnly? GioBatDau { get; set; }
        public TimeOnly? GioKetThuc { get; set; }
        public string? DiaChiHoTro { get; set; }
        public string? GhiChu { get; set; }

        // --- Thông tin phiếu hỗ trợ ---
        public int? IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string? TieuDe { get; set; }
        public int? MucDoUuTien { get; set; }
        public string? TrangThaiPhieu { get; set; }
        public string? CanLichHen { get; set; }

        // --- Thông tin dịch vụ / danh mục ---
        public string? TenDichVu { get; set; }
        public string? TenDanhMuc { get; set; }

        // --- Thông tin khách hàng ---
        public int? IdKhachHang { get; set; }
        public string TenKhachHang { get; set; } = string.Empty;
        public string SoDienThoaiKH { get; set; } = string.Empty;
        public string? EmailKH { get; set; }
        public string? DiaChiKH { get; set; }

        // --- Thông tin nhân viên phụ trách ---
        public int? IdNhanVien { get; set; }
        public string TenNhanVien { get; set; } = string.Empty;
        public string SoDienThoaiNV { get; set; } = string.Empty;
        public string? EmailNV { get; set; }

        // --- Helpers ---

        /// <summary>
        /// Nhãn hiển thị mức ưu tiên (Low=1, Medium=2, High=3, Critical=4)
        /// </summary>
        public string NhanUuTien => MucDoUuTien switch
        {
            1 => "Thấp",
            2 => "Trung bình",
            3 => "Cao",
            4 => "Khẩn cấp",
            _ => "Không xác định"
        };

        /// <summary>
        /// CSS class tương ứng với trạng thái lịch hẹn (dùng cho màu event calendar).
        /// </summary>
        public string CssClassTrangThai => TrangThai switch
        {
            "Chờ xác nhận" => "waiting",
            "Đã xác nhận"  => "confirmed",
            "Đang thực hiện" => "in_progress",
            "Hoàn thành"   => "completed",
            "Đã hủy"       => "cancelled",
            _ => "waiting"
        };

        /// <summary>
        /// Google Maps search URL theo địa chỉ hỗ trợ.
        /// </summary>
        public string GoogleMapsUrl =>
            string.IsNullOrWhiteSpace(DiaChiHoTro)
                ? "#"
                : $"https://www.google.com/maps/search/?api=1&query={Uri.EscapeDataString(DiaChiHoTro)}";

        /// <summary>
        /// Chuỗi giờ định dạng HH:mm để hiển thị.
        /// </summary>
        public string GioBatDauStr => GioBatDau.HasValue ? GioBatDau.Value.ToString("HH:mm") : "--:--";
        public string GioKetThucStr => GioKetThuc.HasValue ? GioKetThuc.Value.ToString("HH:mm") : "--:--";

        /// <summary>
        /// True nếu có thể thực hiện các thao tác (không phải Hoàn thành / Đã hủy).
        /// </summary>
        public bool CoTheThaoTac => TrangThai != "Hoàn thành" && TrangThai != "Đã hủy";

        /// <summary>
        /// True nếu có thể đổi KTV (không phải Đang thực hiện, Hoàn thành, Đã hủy).
        /// </summary>
        public bool CoTheDoiKTV => TrangThai != "Đang thực hiện" && TrangThai != "Hoàn thành" && TrangThai != "Đã hủy";
    }
}
