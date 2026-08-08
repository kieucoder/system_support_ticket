using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace SupportTicketSysterm.Models.ViewModels
{
    public class ChiTietLichHenViewModel
    {
        // --- Thông tin Lịch hẹn ---
        public int IdLichHen { get; set; }
        public string? TrangThai { get; set; }
        public DateOnly? NgayHen { get; set; }
        public TimeOnly? GioBatDau { get; set; }
        public TimeOnly? GioKetThuc { get; set; }
        public string? DiaChiHoTro { get; set; }
        public string? GhiChu { get; set; }
        public DateTime? NgayTao { get; set; }
        public string? NguoiTao { get; set; }

        public string GioBatDauStr => GioBatDau.HasValue ? GioBatDau.Value.ToString("HH:mm") : "--:--";
        public string GioKetThucStr => GioKetThuc.HasValue ? GioKetThuc.Value.ToString("HH:mm") : "--:--";
        public string ThoiLuongStr => (GioBatDau.HasValue && GioKetThuc.HasValue) 
            ? $"{(int)(GioKetThuc.Value - GioBatDau.Value).TotalMinutes} phút" 
            : "Chưa xác định";

        public string TenTrangThaiHienThi => TrangThai switch
        {
            "ChoXacNhan" or "Chờ xác nhận" => "Chờ xác nhận",
            "DaXacNhan" or "Đã xác nhận" => "Đã xác nhận",
            "DangThucHien" or "Đang thực hiện" or "Đang hỗ trợ" => "Đang hỗ trợ",
            "HoanThanh" or "DaHoanThanh" or "Hoàn thành" or "Đã hoàn thành" => "Đã hoàn thành",
            "DaHuy" or "Đã hủy" => "Đã hủy",
            _ => TrangThai ?? "Chưa xác định"
        };

        public string CssClassTrangThai => TrangThai switch
        {
            "ChoXacNhan" or "Chờ xác nhận" => "bg-secondary text-white",
            "DaXacNhan" or "Đã xác nhận" => "bg-primary text-white",
            "DangThucHien" or "Đang thực hiện" or "Đang hỗ trợ" => "bg-warning text-dark",
            "HoanThanh" or "DaHoanThanh" or "Hoàn thành" or "Đã hoàn thành" => "bg-success text-white",
            "DaHuy" or "Đã hủy" => "bg-danger text-white",
            _ => "bg-secondary text-white"
        };

        // --- Thông tin Phiếu hỗ trợ ---
        public int? IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string? TieuDePhieu { get; set; }
        public string? NoiDungPhieu { get; set; }
        public int? MucDoUuTien { get; set; }
        public string? TrangThaiPhieu { get; set; }
        public string? TenDichVu { get; set; }
        public string? TenDanhMuc { get; set; }

        public string NhanUuTien => MucDoUuTien switch
        {
            1 => "Thấp",
            2 => "Trung bình",
            3 => "Cao",
            4 => "Khẩn cấp",
            _ => "Trung bình"
        };

        public string CssClassUuTien => MucDoUuTien switch
        {
            1 => "bg-secondary text-white",
            2 => "bg-warning text-dark",
            3 => "bg-danger text-white",
            4 => "bg-danger text-white fw-bold",
            _ => "bg-secondary text-white"
        };

        // --- Thông tin Khách hàng ---
        public int? IdKhachHang { get; set; }
        public string TenKhachHang { get; set; } = string.Empty;
        public string SoDienThoaiKH { get; set; } = string.Empty;
        public string? EmailKH { get; set; }
        public string? DiaChiKH { get; set; }
        public string GoogleMapsUrl => string.IsNullOrWhiteSpace(DiaChiHoTro) && string.IsNullOrWhiteSpace(DiaChiKH)
            ? "#"
            : $"https://www.google.com/maps/search/?api=1&query={Uri.EscapeDataString(DiaChiHoTro ?? DiaChiKH!)}";

        // --- Thông tin KTV phụ trách ---
        public int? IdNhanVien { get; set; }
        public string TenNhanVien { get; set; } = "Chưa phân công";
        public string SoDienThoaiNV { get; set; } = "--";
        public string? EmailNV { get; set; }
        public string? ChucVuNV { get; set; }

        // --- Lịch sử xử lý ---
        public List<LichSuHoTroItemViewModel> LichSuHoTros { get; set; } = new();

        // --- Tệp đính kèm ---
        public List<FileDinhKemItemViewModel> FileDinhKems { get; set; } = new();

        // --- Dropdown KTV ---
        public List<SelectListItem> DanhSachKTV { get; set; } = new();

        // --- Helper cho Staff Status Actions ---
        public bool CoTheBatDau => TrangThai == "Chờ xác nhận" || TrangThai == "ChoXacNhan" || TrangThai == "Đã xác nhận" || TrangThai == "DaXacNhan";
        public bool CoTheHoanThanh => TrangThai == "Đang thực hiện" || TrangThai == "DangThucHien" || TrangThai == "Đang hỗ trợ";
        public bool DaHoanThanh => TrangThai == "Hoàn thành" || TrangThai == "DaHoanThanh" || TrangThai == "Đã hoàn thành";
    }

    public class LichSuHoTroItemViewModel
    {
        public int IdLichSu { get; set; }
        public DateTime? ThoiGian { get; set; }
        public string NguoiThucHien { get; set; } = "Hệ thống";
        public string? TrangThaiCu { get; set; }
        public string? TrangThaiMoi { get; set; }
        public string? NoiDung { get; set; }
    }

    public class FileDinhKemItemViewModel
    {
        public int IdFile { get; set; }
        public string TenFile { get; set; } = string.Empty;
        public string DuongDan { get; set; } = string.Empty;
        public string? LoaiFile { get; set; }
        public DateTime? NgayUpload { get; set; }

        public string IconClass
        {
            get
            {
                if (string.IsNullOrEmpty(LoaiFile)) return "fa-file-lines text-secondary";
                var l = LoaiFile.ToLower();
                if (l.Contains("pdf")) return "fa-file-pdf text-danger";
                if (l.Contains("image") || l.Contains("png") || l.Contains("jpg") || l.Contains("jpeg")) return "fa-file-image text-primary";
                if (l.Contains("word") || l.Contains("doc")) return "fa-file-word text-info";
                if (l.Contains("excel") || l.Contains("xls")) return "fa-file-excel text-success";
                return "fa-file-lines text-secondary";
            }
        }
    }
}
