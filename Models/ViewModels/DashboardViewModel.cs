using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models.ViewModels
{
    public class DashboardViewModel
    {
        public int TongPhieu { get; set; }
        public int ChoTiepNhan { get; set; }
        public int DangXuLy { get; set; }
        public int DaHoanThanh { get; set; }
        public int SoKhachHang { get; set; }
        public int LichHenKyThuat { get; set; }
        public int SoDichVu { get; set; }
        public int SoDanhMuc { get; set; }
        public int ChatChuaDoc { get; set; }
        public List<ThongKeThang> ThongKeTheoThang { get; set; } = new List<ThongKeThang>();
        public List<ThongKeDichVu> ThongKeTheoDichVu { get; set; } = new List<ThongKeDichVu>();
        public DanhGiaSao DanhGiaSao { get; set; } = new DanhGiaSao();
        public List<PhieuMoiViewModel> PhieuMoiNhat { get; set; } = new List<PhieuMoiViewModel>();
    }

    public class ThongKeThang
    {
        public int Thang { get; set; }
        public int SoLuong { get; set; }
    }

    public class ThongKeDichVu
    {
        public string TenDichVu { get; set; } = string.Empty;
        public int SoLuong { get; set; }
    }

    public class DanhGiaSao
    {
        public int Sao1 { get; set; }
        public int Sao2 { get; set; }
        public int Sao3 { get; set; }
        public int Sao4 { get; set; }
        public int Sao5 { get; set; }
    }

    public class PhieuMoiViewModel
    {
        public string MaPhieu { get; set; } = string.Empty;
        public string KhachHang { get; set; } = string.Empty; // Tên + số điện thoại
        public string NoiDung { get; set; } = string.Empty;   // Lấy từ NoiDung hoặc TieuDe
        public string DichVu { get; set; } = string.Empty;
        public string MucDoUuTien { get; set; } = string.Empty; // 1-Thấp, 2-Trung Bình, 3-Cao, 4-Khẩn Cấp
        public string TrangThai { get; set; } = string.Empty;
        public DateOnly? NgayTao { get; set; }
    }
}
