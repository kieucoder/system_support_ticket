using System;
using System.Collections.Generic;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.ViewModels
{
    public class ChiTietPhieuViewModel
    {
        // Thông tin phiếu
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = null!;
        public string TieuDe { get; set; } = null!;
        public string NoiDung { get; set; } = null!;
        public string TrangThai { get; set; } = null!;
        public string LoaiYeuCau { get; set; } = null!;
        public int MucDoUuTien { get; set; }
        public DateOnly NgayTao { get; set; }

        // Khách hàng
        public string? HoTen { get; set; }
        public string? SoDienThoai { get; set; }
        public string? Email { get; set; }
        public string? DiaChiKhachHang { get; set; }

        // Dịch vụ
        public string? TenDanhMuc { get; set; }
        public string? TenDichVu { get; set; }

        // Lịch hẹn (độc lập hoặc đầu tiên)
        public string? DiaChi { get; set; }
        public DateOnly? NgayHen { get; set; }
        public TimeOnly? GioHen { get; set; }

        // Nhân viên
        public string? TenNhanVien { get; set; }
        public string? SoDienThoaiNV { get; set; }
        public string? EmailNV { get; set; }
        public string? VaiTroNV { get; set; }
        public string? MaNhanVien { get; set; }

        // Đánh giá
        public int? SoSao { get; set; }
        public string? NhanXet { get; set; }

        // Tin nhắn hội thoại
        public List<TinNhan> TinNhans { get; set; } = new();

        // Đánh giá chi tiết
        public DanhGium? DanhGia { get; set; }
        public string? PhanHoiNhanVien { get; set; }
        public DateTime? NgayPhanHoi { get; set; }
        public string? TenNhanVienPhanHoi { get; set; }
        public string? AvatarNhanVien { get; set; }
        public bool DaPhanHoi { get; set; }

        // Danh sách sử dụng ViewModels
        public List<FileDinhKemViewModel> FileDinhKems { get; set; } = new();
        public List<LichSuXuLyViewModel> LichSuXuLys { get; set; } = new();
        public List<LichHenViewModel> LichHens { get; set; } = new();

        // Helper/Alias properties to match exact specifications or backward compatibility
        public string HoTenKhachHang => HoTen ?? string.Empty;
        public List<FileDinhKemViewModel> DanhSachFile => FileDinhKems;
        public List<LichSuXuLyViewModel> DanhSachLichSu => LichSuXuLys;
    }
}
