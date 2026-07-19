using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace SupportTicketSysterm.Models
{
    /// <summary>
    /// ViewModel dùng cho form Thêm lịch hẹn mới và các action thao tác trên lịch hẹn.
    /// </summary>
    public class LichHenChiTietViewModel
    {
        // ─────────────────────────────────────────────────────────
        //  ID (dùng cho hidden field trong form)
        // ─────────────────────────────────────────────────────────
        public int IdLichHen { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Form: Thêm lịch mới
        // ─────────────────────────────────────────────────────────
        [Required(ErrorMessage = "Vui lòng chọn phiếu hỗ trợ")]
        [Display(Name = "Phiếu Hỗ Trợ")]
        public int IdPhieu { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn kỹ thuật viên")]
        [Display(Name = "Kỹ thuật viên")]
        public int IdNhanVien { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn ngày hẹn")]
        [Display(Name = "Ngày hẹn")]
        public string NgayHenStr { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập giờ bắt đầu")]
        [Display(Name = "Giờ bắt đầu")]
        public string GioBatDauStr { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập giờ kết thúc")]
        [Display(Name = "Giờ kết thúc")]
        public string GioKetThucStr { get; set; } = string.Empty;

        [Display(Name = "Địa chỉ hỗ trợ")]
        public string? DiaChiHoTro { get; set; }

        [Display(Name = "Ghi chú")]
        public string? GhiChu { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Form: Đổi lịch hẹn (dời lịch)
        // ─────────────────────────────────────────────────────────
        [Display(Name = "Ngày hẹn mới")]
        public string? NewNgayHenStr { get; set; }

        [Display(Name = "Giờ bắt đầu mới")]
        public string? NewGioBatDauStr { get; set; }

        [Display(Name = "Giờ kết thúc mới")]
        public string? NewGioKetThucStr { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Form: Đổi kỹ thuật viên
        // ─────────────────────────────────────────────────────────
        [Display(Name = "Kỹ thuật viên mới")]
        public int? IdNhanVienMoi { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Form: Hủy lịch
        // ─────────────────────────────────────────────────────────
        [Display(Name = "Lý do hủy")]
        public string? LyDoHuy { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Dropdowns (lấy từ DB)
        // ─────────────────────────────────────────────────────────

        /// <summary>Danh sách phiếu hỗ trợ có thể đặt lịch (CanLichHen != "Không").</summary>
        public List<SelectListItem> DanhSachPhieu { get; set; } = new();

        /// <summary>Danh sách KTV hoạt động (VaiTro="Nhân viên", TrangThai="Hoạt động").</summary>
        public List<SelectListItem> DanhSachNhanVien { get; set; } = new();
    }
}
