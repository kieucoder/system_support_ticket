using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    // =========================================================
    // KPI TỔNG QUAN
    // =========================================================
    public class KpiCardViewModel
    {
        public int GiaTriHienTai { get; set; }
        public int GiaTriThangTruoc { get; set; }
        public int ThayDoi => GiaTriHienTai - GiaTriThangTruoc;
        public double PhanTramThayDoi => GiaTriThangTruoc == 0
            ? 0
            : Math.Round((double)ThayDoi / GiaTriThangTruoc * 100, 1);
        public bool TangSoVoiThangTruoc => ThayDoi >= 0;
    }

    // =========================================================
    // TOP NHÂN VIÊN
    // =========================================================
    public class TopNhanVienViewModel
    {
        public int IdNhanVien { get; set; }
        public string HoTen { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string VaiTro { get; set; } = string.Empty;
        public int TongPhieu { get; set; }
        public int DangXuLy { get; set; }
        public int HoanThanh { get; set; }
        public int DaHuy { get; set; }
        public double TyLeHoanThanh => TongPhieu == 0
            ? 0
            : Math.Round((double)HoanThanh / TongPhieu * 100, 1);
    }

    // =========================================================
    // TOP DỊCH VỤ
    // =========================================================
    public class TopDichVuViewModel
    {
        public int IdDichVu { get; set; }
        public string TenDichVu { get; set; } = string.Empty;
        public string TenDanhMuc { get; set; } = string.Empty;
        public int SoPhieu { get; set; }
        public double PhanTram { get; set; }
    }

    // =========================================================
    // TOP KHÁCH HÀNG
    // =========================================================
    public class TopKhachHangViewModel
    {
        public int IdKhachHang { get; set; }
        public string HoTen { get; set; } = string.Empty;
        public string? SoDienThoai { get; set; }
        public string? Email { get; set; }
        public int SoPhieu { get; set; }
    }

    // =========================================================
    // THỐNG KÊ ĐÁNH GIÁ
    // =========================================================
    public class ThongKeDanhGiaViewModel
    {
        public double DiemTrungBinh { get; set; }
        public int TongDanhGia { get; set; }
        public int Star5 { get; set; }
        public int Star4 { get; set; }
        public int Star3 { get; set; }
        public int Star2 { get; set; }
        public int Star1 { get; set; }
        public double PhanTramStar5 => TongDanhGia == 0 ? 0 : Math.Round((double)Star5 / TongDanhGia * 100, 1);
        public double PhanTramStar4 => TongDanhGia == 0 ? 0 : Math.Round((double)Star4 / TongDanhGia * 100, 1);
        public double PhanTramStar3 => TongDanhGia == 0 ? 0 : Math.Round((double)Star3 / TongDanhGia * 100, 1);
        public double PhanTramStar2 => TongDanhGia == 0 ? 0 : Math.Round((double)Star2 / TongDanhGia * 100, 1);
        public double PhanTramStar1 => TongDanhGia == 0 ? 0 : Math.Round((double)Star1 / TongDanhGia * 100, 1);
        // Radar: avg of 3 criteria
        public double TrungBinhChatLuong { get; set; }
        public double TrungBinhThaiDo { get; set; }
        public double TrungBinhTocDo { get; set; }
    }

    // =========================================================
    // THỐNG KÊ LỊCH HẸN
    // =========================================================
    public class ThongKeLichHenViewModel
    {
        public int TongLichHen { get; set; }
        public int DaHoanThanh { get; set; }
        public int DaHuy { get; set; }
        public int DangCho { get; set; }
        public double TyLeHoanThanh => TongLichHen == 0
            ? 0
            : Math.Round((double)DaHoanThanh / TongLichHen * 100, 1);
    }

    // =========================================================
    // CHART DATA POINTS
    // =========================================================
    public class ChartDataPoint
    {
        public string Label { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    // =========================================================
    // BỘ LỌC
    // =========================================================
    public class ThongKeFilterViewModel
    {
        public DateOnly? TuNgay { get; set; }
        public DateOnly? DenNgay { get; set; }
        public int? IdNhanVien { get; set; }
        public int? IdKhachHang { get; set; }
        public int? IdDichVu { get; set; }
        public int? IdDanhMuc { get; set; }
        public string? TrangThai { get; set; }
        public string KhoangThoiGian { get; set; } = "thang"; // ngay/tuan/thang/quy/nam/tuy-chon
    }

    // =========================================================
    // MAIN VIEWMODEL
    // =========================================================
    public class ThongKeBaoCaoViewModel
    {
        // --- Filter ---
        public ThongKeFilterViewModel Filter { get; set; } = new();

        // --- Dropdown data for filter ---
        public List<(int Id, string Ten)> DanhSachNhanVien { get; set; } = new();
        public List<(int Id, string Ten)> DanhSachDichVu { get; set; } = new();
        public List<(int Id, string Ten)> DanhSachDanhMuc { get; set; } = new();

        // --- KPI Cards ---
        public KpiCardViewModel TongPhieuHoTro { get; set; } = new();
        public KpiCardViewModel ChoXuLy { get; set; } = new();
        public KpiCardViewModel DangXuLy { get; set; } = new();
        public KpiCardViewModel HoanThanh { get; set; } = new();
        public KpiCardViewModel DaHuy { get; set; } = new();
        public KpiCardViewModel TongKhachHang { get; set; } = new();
        public KpiCardViewModel TongNhanVien { get; set; } = new();
        public KpiCardViewModel TongDichVu { get; set; } = new();
        public KpiCardViewModel TongDanhMuc { get; set; } = new();
        public double DiemDanhGiaTrungBinh { get; set; }

        // --- Chart: Phiếu theo tháng (12 tháng gần nhất) ---
        public List<ChartDataPoint> PhieuTheoThang { get; set; } = new();

        // --- Chart: Phiếu theo trạng thái (Doughnut) ---
        public int PhieuChoXuLy { get; set; }
        public int PhieuDangXuLy { get; set; }
        public int PhieuHoanThanh { get; set; }
        public int PhieuDaHuy { get; set; }

        // --- Chart: Top 10 dịch vụ (Bar) ---
        public List<ChartDataPoint> TopDichVuChart { get; set; } = new();

        // --- Chart: Phiếu theo danh mục (Pie) ---
        public List<ChartDataPoint> PhieuTheoDanhMuc { get; set; } = new();

        // --- Chart: Phiếu theo ngày (Line - 30 ngày) ---
        public List<ChartDataPoint> PhieuTheoNgay { get; set; } = new();

        // --- Chart: Radar - Hiệu suất nhân viên (top 6) ---
        public List<string> RadarNhanVienLabels { get; set; } = new();
        public List<int> RadarTongPhieu { get; set; } = new();
        public List<int> RadarHoanThanh { get; set; } = new();
        public List<int> RadarDangXuLy { get; set; } = new();

        // --- Bảng Top 10 Nhân viên ---
        public List<TopNhanVienViewModel> TopNhanVien { get; set; } = new();

        // --- Bảng Top 10 Dịch vụ ---
        public List<TopDichVuViewModel> TopDichVu { get; set; } = new();

        // --- Bảng Top 10 Khách hàng ---
        public List<TopKhachHangViewModel> TopKhachHang { get; set; } = new();

        // --- Thống kê đánh giá ---
        public ThongKeDanhGiaViewModel DanhGia { get; set; } = new();

        // --- Thống kê lịch hẹn ---
        public ThongKeLichHenViewModel LichHen { get; set; } = new();
    }
}
