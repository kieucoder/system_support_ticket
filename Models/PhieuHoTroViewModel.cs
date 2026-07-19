using System;
using System.Collections.Generic;

namespace SupportTicketSysterm.Models
{
    // ============================================================
    //  DTO: Một hàng trong danh sách phiếu hỗ trợ
    // ============================================================

    /// <summary>
    /// DTO hiển thị một phiếu hỗ trợ trong danh sách "Phiếu của tôi".
    /// Chứa đủ thông tin để render card/list view và progress bar.
    /// </summary>
    public class PhieuHoTroItemDto
    {
        /// <summary>Khóa chính phiếu hỗ trợ (dùng cho link chi tiết / chat).</summary>
        public int IdPhieu { get; set; }

        /// <summary>Mã phiếu hiển thị, ví dụ: TKT-20240101-001.</summary>
        public string MaPhieu { get; set; } = string.Empty;

        /// <summary>Tiêu đề phiếu hỗ trợ.</summary>
        public string? TieuDe { get; set; }

        /// <summary>Mô tả / nội dung phiếu.</summary>
        public string? MoTa { get; set; }

        /// <summary>
        /// Trạng thái phiếu: ChoTiepNhan | DangXuLy | ChoKhachHangPhanHoi
        ///                    | DaHoanThanh | DaHuy.
        /// </summary>
        public string? TrangThai { get; set; }

        /// <summary>
        /// Mức ưu tiên dưới dạng chuỗi: Low | Medium | High | Critical.
        /// View dùng switch expression để ánh xạ sang CSS class và nhãn tiếng Việt.
        /// </summary>
        public string? MucUuTien { get; set; }

        /// <summary>Ngày tạo phiếu.</summary>
        public DateOnly NgayTao { get; set; }

        /// <summary>Ngày cập nhật cuối cùng.</summary>
        public DateOnly? NgayCapNhat { get; set; }

        /// <summary>Tên dịch vụ liên quan.</summary>
        public string? TenDichVu { get; set; }

        /// <summary>
        /// Tiến độ xử lý (0–100) theo quy tắc:
        /// ChoTiepNhan=20, DangXuLy=60, ChoKhachHangPhanHoi=80,
        /// DaHoanThanh=100, DaHuy=0.
        /// </summary>
        public int TienDo { get; set; }

        /// <summary>Họ tên nhân viên phụ trách (null nếu chưa được tiếp nhận).</summary>
        public string? NhanVienPhuTrach { get; set; }

        public string? MaNhanVien { get; set; }
        public string? SoDienThoaiNV { get; set; }
        public string? EmailNV { get; set; }
        public string? VaiTroNV { get; set; }

        /// <summary>Ngày hẹn xử lý — dùng để tính trạng thái Quá hạn.</summary>
        public DateOnly? NgayHenXuLy { get; set; }

        /// <summary>Trạng thái đã đánh giá phiếu hay chưa.</summary>
        public bool DaDanhGia { get; set; }
    }

    // ============================================================
    //  DTO: Hoạt động gần đây (LichSuHoTro)
    // ============================================================

    /// <summary>
    /// DTO cho widget "Hoạt động gần đây" ở sidebar.
    /// Ánh xạ từ bảng LichSuHoTro.
    /// </summary>
    public class HoatDongGanDayDto
    {
        /// <summary>Mô tả nội dung cập nhật (NoiDungCapNhat từ LichSuHoTro).</summary>
        public string MoTa { get; set; } = string.Empty;

        /// <summary>Thời gian cập nhật — cần DateTime để format ngày giờ.</summary>
        public DateTime ThoiGian { get; set; }
    }

    // ============================================================
    //  DTO: Thông báo (TinNhan)
    // ============================================================

    /// <summary>
    /// DTO cho widget "Thông báo" ở sidebar.
    /// Ánh xạ từ bảng TinNhan qua LienHe của khách hàng.
    /// </summary>
    public class ThongBaoDto
    {
        /// <summary>Nội dung tin nhắn / thông báo.</summary>
        public string NoiDung { get; set; } = string.Empty;

        /// <summary>Thời gian gửi thông báo.</summary>
        public DateTime ThoiGian { get; set; }
    }

    // ============================================================
    //  DTO: Lịch hẹn gần nhất (LichHen)
    // ============================================================

    /// <summary>
    /// DTO cho widget "Lịch hẹn gần nhất" ở sidebar.
    /// Ánh xạ từ bảng LichHen kết hợp PhieuHoTro.
    /// </summary>
    public class LichHenGanNhatDto
    {
        /// <summary>Tiêu đề (lấy từ TieuDe phiếu liên quan hoặc GhiChu).</summary>
        public string TieuDe { get; set; } = string.Empty;

        /// <summary>Thời gian hẹn = NgayHen + GioBatDau kết hợp thành DateTime.</summary>
        public DateTime ThoiGian { get; set; }
    }

    // ============================================================
    //  ViewModel chính: PhieuHoTroViewModel
    // ============================================================

    /// <summary>
    /// ViewModel dùng cho View Customers/PhieuCuaToi.cshtml.
    /// Chứa toàn bộ dữ liệu: danh sách phiếu có phân trang, thống kê,
    /// sidebar (hoạt động, thông báo, lịch hẹn) và dropdown filter dịch vụ.
    /// </summary>
    public class PhieuHoTroViewModel
    {
        // ----------------------------------------------------------
        //  Danh sách phiếu (đã phân trang, đã search/filter/sort)
        // ----------------------------------------------------------

        /// <summary>Danh sách phiếu hỗ trợ của trang hiện tại.</summary>
        public List<PhieuHoTroItemDto> DanhSachPhieu { get; set; } = new();

        // ----------------------------------------------------------
        //  Thống kê (tính trên toàn bộ phiếu — không bị ảnh hưởng bởi phân trang)
        // ----------------------------------------------------------

        /// <summary>Tổng số phiếu hỗ trợ của khách hàng.</summary>
        public int TongPhieu { get; set; }

        /// <summary>Số phiếu đang xử lý (TrangThai == "DangXuLy").</summary>
        public int DangXuLy { get; set; }

        /// <summary>Số phiếu chờ tiếp nhận (TrangThai == "ChoTiepNhan").</summary>
        public int ChoTiepNhan { get; set; }

        /// <summary>Số phiếu đã hoàn thành (TrangThai == "DaHoanThanh").</summary>
        public int DaHoanThanh { get; set; }

        /// <summary>Số phiếu đã hủy (TrangThai == "DaHuy").</summary>
        public int DaHuy { get; set; }

        /// <summary>
        /// Số phiếu quá hạn:
        /// TrangThai != "DaHoanThanh" AND NgayHenXuLy &lt; ngày hôm nay.
        /// </summary>
        public int QuaHan { get; set; }

        // ----------------------------------------------------------
        //  Sidebar widgets
        // ----------------------------------------------------------

        /// <summary>5 thông báo gần nhất cho widget Thông báo.</summary>
        public List<ThongBaoDto> DanhSachThongBao { get; set; } = new();

        /// <summary>5 hoạt động gần đây cho widget Hoạt động gần đây.</summary>
        public List<HoatDongGanDayDto> HoatDongGanDay { get; set; } = new();

        /// <summary>3 lịch hẹn gần nhất cho widget Lịch hẹn gần nhất.</summary>
        public List<LichHenGanNhatDto> LichHenGanNhat { get; set; } = new();

        // ----------------------------------------------------------
        //  Filter helpers
        // ----------------------------------------------------------

        /// <summary>Danh sách tên dịch vụ duy nhất để render dropdown filter dịch vụ.</summary>
        public List<string> DanhSachDichVu { get; set; } = new();

        // ----------------------------------------------------------
        //  Phân trang
        // ----------------------------------------------------------

        /// <summary>Tổng số trang.</summary>
        public int TongTrang { get; set; }

        /// <summary>Trang hiện tại (1-based).</summary>
        public int TrangHienTai { get; set; }
    }
}
