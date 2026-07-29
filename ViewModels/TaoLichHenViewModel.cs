using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace SupportTicketSysterm.ViewModels
{
    /// <summary>
    /// Model hiển thị thông tin từng phiếu hỗ trợ đủ điều kiện dạng Card bên cột trái
    /// </summary>
    public class PhieuEligibleItem
    {
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string TieuDe { get; set; } = string.Empty;
        public string TenDichVu { get; set; } = string.Empty;
        public string TrangThaiPhieu { get; set; } = string.Empty;
        public string TrangThaiBadgeClass { get; set; } = "bg-primary text-white";
        public string TrangThaiIcon { get; set; } = "bi-gear-fill";
        public DateOnly? NgayTao { get; set; }
        public string DiaChi { get; set; } = string.Empty;
        public string TenNhanVien { get; set; } = string.Empty;
        public string? SoDienThoaiNV { get; set; }
        public bool IsConfirmed { get; set; }
        public bool IsSelected { get; set; }
    }

    /// <summary>
    /// ViewModel dùng cho View Đặt Lịch Hẹn Khách Hàng (2 Cột AJAX)
    /// </summary>
    public class TaoLichHenViewModel
    {
        [Required(ErrorMessage = "Vui lòng chọn phiếu hỗ trợ cần đặt lịch hẹn")]
        [Display(Name = "Phiếu hỗ trợ")]
        public int IdPhieu { get; set; }

        public string? MaPhieu { get; set; }

        public string? TieuDe { get; set; }

        public string? TenKhachHang { get; set; }

        public string? TenNhanVien { get; set; }

        public string? SoDienThoaiNV { get; set; }

        public bool IsConfirmed { get; set; }

        public string? TenDichVu { get; set; }

        public string? TrangThaiPhieu { get; set; }

        public string TrangThaiBadgeClass { get; set; } = "bg-primary text-white";

        public string TrangThaiIcon { get; set; } = "bi-gear-fill";

        [Required(ErrorMessage = "Vui lòng chọn ngày hẹn")]
        [Display(Name = "Ngày hẹn")]
        public DateOnly NgayHen { get; set; } = DateOnly.FromDateTime(DateTime.Today.AddDays(1));

        [Required(ErrorMessage = "Vui lòng chọn giờ bắt đầu")]
        [Display(Name = "Giờ bắt đầu")]
        public TimeOnly GioBatDau { get; set; } = new TimeOnly(8, 0);

        [Required(ErrorMessage = "Vui lòng chọn giờ kết thúc")]
        [Display(Name = "Giờ kết thúc")]
        public TimeOnly GioKetThuc { get; set; } = new TimeOnly(10, 0);

        [Required(ErrorMessage = "Vui lòng nhập địa chỉ hỗ trợ")]
        [Display(Name = "Địa chỉ hỗ trợ")]
        public string DiaChiHoTro { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        [Display(Name = "Ghi chú")]
        public string? GhiChu { get; set; }

        public string? TrangThai { get; set; } = "Chờ xác nhận";

        // Danh sách các phiếu thuộc về khách hàng (Dropdown fallback)
        public List<SelectListItem> DanhSachPhieu { get; set; } = new();

        // Danh sách phiếu hỗ trợ đủ điều kiện đặt lịch hiển thị dạng Card bên Cột Trái
        public List<PhieuEligibleItem> DanhSachPhieuEligible { get; set; } = new();
    }
}
