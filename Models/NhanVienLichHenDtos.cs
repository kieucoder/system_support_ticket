using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models;

/// <summary>
/// DTO từng dòng trong danh sách lịch hẹn của Nhân viên
/// </summary>
public class LichHenNhanVienDto
{
    public int IdLichHen { get; set; }
    public string MaLichHen { get; set; } = string.Empty;
    public int? IdPhieu { get; set; }
    public string MaPhieu { get; set; } = string.Empty;
    public string TieuDePhieu { get; set; } = string.Empty;
    public int? IdKhachHang { get; set; }
    public string TenKhachHang { get; set; } = string.Empty;
    public string SoDienThoaiKhachHang { get; set; } = string.Empty;
    public string EmailKhachHang { get; set; } = string.Empty;
    public DateOnly? NgayHen { get; set; }
    public TimeOnly? GioBatDau { get; set; }
    public TimeOnly? GioKetThuc { get; set; }
    public string DiaDiem { get; set; } = string.Empty;
    public string HinhThuc { get; set; } = "TrucTiep";
    public string TrangThai { get; set; } = string.Empty; // ChoDuyet, DaXacNhan, DaTuChoi, DaHuy, HoanThanh, ChoXacNhanDoi
    public string TrangThaiTitle { get; set; } = string.Empty;
    public string TrangThaiBadgeClass { get; set; } = "bg-secondary";
    public string? GhiChu { get; set; }
    public string? LyDo { get; set; }
    public DateTime? NgayTao { get; set; }

    public bool CanRequestReschedule => (TrangThai == "DaXacNhan" || TrangThai == "ChoXacNhan" || TrangThai == "ChoDuyet" || TrangThai == "Chờ xác nhận" || TrangThai == "Đã xác nhận") && (!NgayHen.HasValue || NgayHen.Value >= DateOnly.FromDateTime(DateTime.Today));
    public bool CanCancel => (TrangThai == "DaXacNhan" || TrangThai == "ChoXacNhan" || TrangThai == "ChoDuyet" || TrangThai == "Chờ xác nhận" || TrangThai == "Đã xác nhận") && (!NgayHen.HasValue || NgayHen.Value >= DateOnly.FromDateTime(DateTime.Today));
}

/// <summary>
/// DTO Chi tiết Lịch hẹn dành cho Nhân viên
/// </summary>
public class LichHenNhanVienDetailDto
{
    public int IdLichHen { get; set; }
    public string MaLichHen { get; set; } = string.Empty;
    public DateOnly? NgayHen { get; set; }
    public TimeOnly? GioBatDau { get; set; }
    public TimeOnly? GioKetThuc { get; set; }
    public string DiaDiem { get; set; } = string.Empty;
    public string HinhThuc { get; set; } = "TrucTiep";
    public string TrangThai { get; set; } = string.Empty;
    public string TrangThaiTitle { get; set; } = string.Empty;
    public string TrangThaiBadgeClass { get; set; } = "bg-secondary";
    public string? GhiChu { get; set; }
    public string? LyDo { get; set; }
    public DateTime? NgayTao { get; set; }

    // Thông tin Khách hàng
    public int? IdKhachHang { get; set; }
    public string TenKhachHang { get; set; } = string.Empty;
    public string SoDienThoaiKhachHang { get; set; } = string.Empty;
    public string EmailKhachHang { get; set; } = string.Empty;
    public string DiaChiKhachHang { get; set; } = string.Empty;

    // Thông tin Phiếu hỗ trợ
    public int? IdPhieu { get; set; }
    public string MaPhieu { get; set; } = string.Empty;
    public string TieuDePhieu { get; set; } = string.Empty;
    public string TrangThaiPhieu { get; set; } = string.Empty;
    public string TenDichVu { get; set; } = string.Empty;

    // Danh sách lịch sử thay đổi
    public List<LichSuLichHenDto> LichSuChanges { get; set; } = new();
}

/// <summary>
/// DTO Input Yêu cầu Đổi lịch hẹn
/// </summary>
public class YeuCauDoiLichInputDto
{
    [Required(ErrorMessage = "Vui lòng chọn lịch hẹn.")]
    public int LichHenId { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập lý do đổi lịch.")]
    [StringLength(500, ErrorMessage = "Lý do đổi lịch không quá 500 ký tự.")]
    public string LyDo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn ngày mới.")]
    public DateOnly NgayMoi { get; set; } = DateOnly.FromDateTime(DateTime.Today.AddDays(1));

    [Required(ErrorMessage = "Vui lòng chọn giờ bắt đầu mới.")]
    public TimeOnly GioBatDauMoi { get; set; } = new TimeOnly(8, 0);

    [Required(ErrorMessage = "Vui lòng chọn giờ kết thúc mới.")]
    public TimeOnly GioKetThucMoi { get; set; } = new TimeOnly(10, 0);

    [Required(ErrorMessage = "Vui lòng nhập địa điểm mới.")]
    public string DiaDiemMoi { get; set; } = string.Empty;
}

/// <summary>
/// DTO Input Hủy Lịch Hẹn phía Nhân viên
/// </summary>
public class HuyLichNhanVienInputDto
{
    [Required(ErrorMessage = "Vui lòng chọn lịch hẹn.")]
    public int LichHenId { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập lý do hủy lịch.")]
    [StringLength(500, ErrorMessage = "Lý do hủy không quá 500 ký tự.")]
    public string LyDo { get; set; } = string.Empty;
}

/// <summary>
/// DTO Lịch sử thay đổi lịch hẹn
/// </summary>
public class LichSuLichHenDto
{
    public int Id { get; set; }
    public DateTime ThoiGian { get; set; }
    public string NguoiThucHien { get; set; } = string.Empty;
    public string HanHDong { get; set; } = string.Empty;
    public string NoiDung { get; set; } = string.Empty;
}

/// <summary>
/// DTO Bộ lọc danh sách lịch hẹn Nhân viên
/// </summary>
public class NhanVienLichHenFilterInput
{
    public string? TrangThai { get; set; }
    public DateTime? TuNgay { get; set; }
    public DateTime? DenNgay { get; set; }
    public string? TuKhoa { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// ViewModel cho trang danh sách Lịch hẹn Nhân viên
/// </summary>
public class NhanVienLichHenListViewModel
{
    public List<LichHenNhanVienDto> Items { get; set; } = new();
    public NhanVienLichHenFilterInput Filter { get; set; } = new();

    public int TotalItems { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);

    // KPI Stats (Chỉ hiển thị của Nhân viên này)
    public int TotalMyAppointments { get; set; }
    public int PendingCount { get; set; }
    public int ConfirmedCount { get; set; }
    public int CancelledCount { get; set; }
    public int ReschedulePendingCount { get; set; }
}

/// <summary>
/// Response kết quả thao tác chung
/// </summary>
public class ServiceResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;

    public static ServiceResult Ok(string msg = "Thao tác thành công.") => new() { Success = true, Message = msg };
    public static ServiceResult Fail(string msg) => new() { Success = false, Message = msg };
}

/// <summary>
/// Generic Paged Result
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
}
