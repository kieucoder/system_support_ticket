using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace SupportTicketSysterm.ViewModels;

/// <summary>
/// ViewModel cho Danh sách Lịch hẹn từ phía Admin
/// </summary>
public class AdminLichHenListViewModel
{
    public List<AdminLichHenItemViewModel> Items { get; set; } = new();

    public AdminLichHenFilterInput Filter { get; set; } = new();

    // Phân trang
    public int TotalItems { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);

    // Thống kê KPI
    public int TotalAppointments { get; set; }
    public int PendingCount { get; set; }
    public int ConfirmedCount { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }

    // Dropdown danh sách nhân viên phục vụ bộ lọc
    public List<SelectListItem> NhanVienList { get; set; } = new();
}

/// <summary>
/// Model bộ lọc danh sách lịch hẹn phía Admin
/// </summary>
public class AdminLichHenFilterInput
{
    public string? TuKhoa { get; set; }
    public string? TrangThai { get; set; }
    public int? IdNhanVien { get; set; }
    public DateTime? TuNgay { get; set; }
    public DateTime? DenNgay { get; set; }
    public string? SapXep { get; set; } = "MoiNhat";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// ViewModel từng dòng lịch hẹn trong danh sách Admin
/// </summary>
public class AdminLichHenItemViewModel
{
    public int IdLichHen { get; set; }
    public int? IdPhieu { get; set; }
    public string MaPhieu { get; set; } = string.Empty;
    public string TieuDePhieu { get; set; } = string.Empty;
    public string TenKhachHang { get; set; } = string.Empty;
    public string SoDienThoaiKhachHang { get; set; } = string.Empty;
    public int? IdNhanVien { get; set; }
    public string TenNhanVien { get; set; } = string.Empty;
    public DateOnly? NgayHen { get; set; }
    public TimeOnly? GioBatDau { get; set; }
    public TimeOnly? GioKetThuc { get; set; }
    public string HinhThuc { get; set; } = "TrucTiep";
    public string DiaDiem { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public string TrangThaiCode { get; set; } = string.Empty;
    public string TrangThaiTitle { get; set; } = string.Empty;
    public string TrangThaiBadgeClass { get; set; } = "bg-secondary";
    public DateTime? NgayTao { get; set; }
    public string? LyDoHuy { get; set; }

    public string ThoiGianFormatted
    {
        get
        {
            if (!NgayHen.HasValue) return "Chưa chọn ngày";
            string strNgay = NgayHen.Value.ToString("dd/MM/yyyy");
            if (GioBatDau.HasValue && GioKetThuc.HasValue)
            {
                return $"{strNgay} ({GioBatDau.Value:HH:mm} - {GioKetThuc.Value:HH:mm})";
            }
            return strNgay;
        }
    }
}

/// <summary>
/// ViewModel Chi tiết Lịch hẹn dành cho Admin
/// </summary>
public class AdminLichHenDetailViewModel
{
    public int IdLichHen { get; set; }
    public int? IdPhieu { get; set; }
    public string MaPhieu { get; set; } = string.Empty;
    public string TieuDePhieu { get; set; } = string.Empty;
    public string TenDichVu { get; set; } = string.Empty;
    public string TrangThaiPhieu { get; set; } = string.Empty;
    public DateTime? NgayTaoPhieu { get; set; }

    // Thông tin Khách hàng
    public int? IdKhachHang { get; set; }
    public string TenKhachHang { get; set; } = string.Empty;
    public string SoDienThoaiKhachHang { get; set; } = string.Empty;
    public string EmailKhachHang { get; set; } = string.Empty;
    public string DiaChiKhachHang { get; set; } = string.Empty;

    // Thông tin Nhân viên KTV
    public int? IdNhanVien { get; set; }
    public string TenNhanVien { get; set; } = string.Empty;
    public string ChucVuNhanVien { get; set; } = string.Empty;
    public string SoDienThoaiNhanVien { get; set; } = string.Empty;

    // Thông tin Lịch hẹn
    public DateOnly? NgayHen { get; set; }
    public TimeOnly? GioBatDau { get; set; }
    public TimeOnly? GioKetThuc { get; set; }
    public string HinhThuc { get; set; } = "TrucTiep";
    public string DiaDiem { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public string TrangThaiCode { get; set; } = string.Empty;
    public string TrangThaiTitle { get; set; } = string.Empty;
    public string TrangThaiBadgeClass { get; set; } = "bg-secondary";
    public DateTime? NgayTao { get; set; }
    public DateTime? NgayXacNhan { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public string? LyDoHuy { get; set; }
    public string? LyDoDoiLich { get; set; }

    // Lịch sử xử lý phiếu
    public List<LichSuHoTroItemViewModel> HistoryLogs { get; set; } = new();

    // Dropdown KTV cho modal phân công
    public List<SelectListItem> NhanVienList { get; set; } = new();
}

/// <summary>
/// DTO Input Xác nhận & Phân công lịch hẹn Admin
/// </summary>
public class AdminConfirmLichHenInput
{
    [Required(ErrorMessage = "Vui lòng chọn lịch hẹn.")]
    public int IdLichHen { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn nhân viên kỹ thuật phụ trách.")]
    public int IdNhanVien { get; set; }

    public DateOnly? NgayHen { get; set; }
    public TimeOnly? GioBatDau { get; set; }
    public TimeOnly? GioKetThuc { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú không vượt quá 500 ký tự.")]
    public string? GhiChu { get; set; }
}

/// <summary>
/// DTO Input Từ chối / Hủy lịch hẹn Admin
/// </summary>
public class AdminRejectLichHenInput
{
    [Required(ErrorMessage = "Vui lòng chọn lịch hẹn.")]
    public int IdLichHen { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập lý do từ chối/hủy lịch.")]
    [StringLength(500, ErrorMessage = "Lý do không vượt quá 500 ký tự.")]
    public string LyDoHuy { get; set; } = string.Empty;
}

/// <summary>
/// ViewModel Chỉnh sửa Lịch hẹn dành cho Admin
/// </summary>
public class AdminEditLichHenViewModel
{
    public int IdLichHen { get; set; }
    public int? IdPhieu { get; set; }
    public string MaPhieu { get; set; } = string.Empty;
    public string TieuDePhieu { get; set; } = string.Empty;
    public string TenKhachHang { get; set; } = string.Empty;
    public string TenDichVu { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn nhân viên kỹ thuật.")]
    public int? IdNhanVien { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày hẹn.")]
    public DateOnly NgayHen { get; set; } = DateOnly.FromDateTime(DateTime.Today.AddDays(1));

    [Required(ErrorMessage = "Vui lòng chọn giờ bắt đầu.")]
    public TimeOnly GioBatDau { get; set; } = new TimeOnly(8, 0);

    [Required(ErrorMessage = "Vui lòng chọn giờ kết thúc.")]
    public TimeOnly GioKetThuc { get; set; } = new TimeOnly(10, 0);

    [Required(ErrorMessage = "Vui lòng chọn hình thức hỗ trợ.")]
    public string HinhThuc { get; set; } = "TrucTiep";

    [Required(ErrorMessage = "Vui lòng nhập địa điểm hỗ trợ.")]
    public string DiaDiem { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Ghi chú không vượt quá 500 ký tự.")]
    public string? GhiChu { get; set; }

    public List<SelectListItem> NhanVienList { get; set; } = new();
}

/// <summary>
/// ViewModel từng bản ghi nhật ký lịch sử hỗ trợ
/// </summary>
public class LichSuHoTroItemViewModel
{
    public int IdLichSu { get; set; }
    public string TrangThaiCu { get; set; } = string.Empty;
    public string TrangThaiMoi { get; set; } = string.Empty;
    public string NoiDungCapNhat { get; set; } = string.Empty;
    public DateOnly? NgayCapNhat { get; set; }
    public string TenNhanVien { get; set; } = string.Empty;
}
