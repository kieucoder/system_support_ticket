using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    public class PrintTicketViewModel
    {
        // THÔNG TIN KHÁCH HÀNG
        public string HoTenKhachHang { get; set; } = null!;
        public string SoDienThoaiKhachHang { get; set; } = null!;
        public string? EmailKhachHang { get; set; }
        public string? DiaChiKhachHang { get; set; }

        // THÔNG TIN PHIẾU
        public int IdPhieu { get; set; }
        public string MaPhieu { get; set; } = null!;
        public string? TieuDe { get; set; }
        public string? TenDanhMuc { get; set; }
        public string? TenDichVu { get; set; }
        public string LoaiYeuCau { get; set; } = null!;
        public int MucDoUuTien { get; set; }
        public string TrangThai { get; set; } = null!;
        public string? NgayTao { get; set; }
        public string? NgayCapNhat { get; set; }
        public string? NoiDungYeuCau { get; set; }

        // NHÂN VIÊN PHỤ TRÁCH
        public string? TenNhanVien { get; set; }
        public string? SoDienThoaiNhanVien { get; set; }
        public string? EmailNhanVien { get; set; }

        // LỊCH HẸN
        public AppointmentPrintInfo? LichHen { get; set; }

        // LỊCH SỬ XỬ LÝ
        public List<HistoryPrintInfo> LichSuXuLy { get; set; } = new();

        // ĐÁNH GIÁ
        public ReviewPrintInfo? DanhGia { get; set; }

        // PHẢN HỒI CỦA NHÂN VIÊN
        public ResponsePrintInfo? PhanHoiNhanVien { get; set; }

        // FILE ĐÍNH KÈM
        public List<AttachmentPrintInfo> FileDinhKems { get; set; } = new();
    }

    public class AppointmentPrintInfo
    {
        public string? NgayHen { get; set; }
        public string? GioBatDau { get; set; }
        public string? GioKetThuc { get; set; }
        public string? DiaDiem { get; set; }
        public string? TrangThai { get; set; }
    }

    public class HistoryPrintInfo
    {
        public string? NgayCapNhat { get; set; }
        public string? TrangThaiCu { get; set; }
        public string? TrangThaiMoi { get; set; }
        public string? NoiDungCapNhat { get; set; }
        public string? NhanVienThucHien { get; set; }
    }

    public class ReviewPrintInfo
    {
        public int ChatLuongDichVu { get; set; }
        public int ThaiDoNhanVien { get; set; }
        public int TocDoXuLy { get; set; }
        public string? NhanXet { get; set; }
        public string? NgayDanhGia { get; set; }
    }

    public class ResponsePrintInfo
    {
        public string TenNhanVien { get; set; } = null!;
        public string? NgayPhanHoi { get; set; }
        public string NoiDungPhanHoi { get; set; } = null!;
    }

    public class AttachmentPrintInfo
    {
        public string TenFile { get; set; } = null!;
        public string? LoaiFile { get; set; }
        public string? NgayUpload { get; set; }
    }
}
