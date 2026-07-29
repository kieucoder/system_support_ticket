using System;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models;

/// <summary>
/// DTO gửi yêu cầu lịch hẹn từ phía Khách hàng
/// Khách hàng CHỈ chọn ngày/giờ, hình thức, địa điểm & ghi chú. Không được chọn KTV hay đổi trạng thái.
/// </summary>
public class CreateLichHenRequestDto
{
    [Required(ErrorMessage = "Vui lòng chọn phiếu hỗ trợ cần đặt lịch.")]
    public int IdPhieu { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn thời gian bắt đầu.")]
    public DateTime ThoiGianBatDau { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn thời gian kết thúc.")]
    public DateTime ThoiGianKetThuc { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn hình thức hỗ trợ.")]
    public string HinhThuc { get; set; } = "TrucTiep"; // "TrucTiep" hoặc "Online"

    public string? DiaDiem { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú không vượt quá 500 ký tự.")]
    public string? GhiChu { get; set; }
}

/// <summary>
/// DTO Phân công KTV & Xác nhận lịch hẹn từ phía Admin/Staff
/// </summary>
public class AssignLichHenDto
{
    [Required]
    public int IdLichHen { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn nhân viên kỹ thuật phụ trách.")]
    public int IdNhanVien { get; set; }

    public DateTime? ThoiGianBatDau { get; set; }
    public DateTime? ThoiGianKetThuc { get; set; }
}

/// <summary>
/// DTO Đổi lịch hẹn
/// Quy trình Help Desk: Không update bản ghi cũ. Đánh dấu lịch cũ thành "DaHuy" và tạo lịch mới "ChoXacNhan".
/// </summary>
public class RescheduleLichHenDto
{
    [Required]
    public int IdLichHen { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn thời gian bắt đầu mới.")]
    public DateTime NewThoiGianBatDau { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn thời gian kết thúc mới.")]
    public DateTime NewThoiGianKetThuc { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập lý do đổi lịch.")]
    [StringLength(500, ErrorMessage = "Lý do đổi lịch không vượt quá 500 ký tự.")]
    public string LyDoDoiLich { get; set; } = string.Empty;
}

/// <summary>
/// DTO Hủy lịch hẹn
/// </summary>
public class CancelLichHenDto
{
    [Required]
    public int IdLichHen { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập lý do hủy lịch.")]
    [StringLength(500, ErrorMessage = "Lý do hủy không vượt quá 500 ký tự.")]
    public string LyDoHuy { get; set; } = string.Empty;
}

/// <summary>
/// DTO Lọc danh sách lịch hẹn
/// </summary>
public class LichHenFilterDto
{
    public int? IdKhachHang { get; set; }
    public int? IdNhanVien { get; set; }
    public int? IdPhieu { get; set; }
    public TrangThaiLichHen? TrangThai { get; set; }
    public DateTime? TuNgay { get; set; }
    public DateTime? DenNgay { get; set; }
}
