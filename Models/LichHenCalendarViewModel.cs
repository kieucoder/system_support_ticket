using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace SupportTicketSysterm.Models
{
    /// <summary>
    /// ViewModel tổng hợp cho trang Quản Lý Lịch Hẹn.
    /// Chứa toàn bộ dữ liệu: KPI, calendar events, timeline, filter dropdowns và chi tiết lịch được chọn.
    /// </summary>
    public class LichHenCalendarViewModel
    {
        // ─────────────────────────────────────────────────────────
        //  KPI Stats (tính từ lịch hẹn trong ngày hôm nay)
        // ─────────────────────────────────────────────────────────
        public int TongHomNay { get; set; }
        public int ChoXacNhan { get; set; }
        public int DaXacNhan { get; set; }
        public int DangThucHien { get; set; }
        public int HoanThanh { get; set; }
        public int DaHuy { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Lịch hẹn cho calendar grid (đã áp dụng filter)
        // ─────────────────────────────────────────────────────────
        public List<LichHenViewModel> DanhSachLichHen { get; set; } = new();

        /// <summary>Lịch hẹn hôm nay (NgayHen == Today), dùng cho timeline và sidebar list.</summary>
        public List<LichHenViewModel> DanhSachHomNay { get; set; } = new();

        // ─────────────────────────────────────────────────────────
        //  Calendar navigation state
        // ─────────────────────────────────────────────────────────
        public int CalendarThang { get; set; } = DateTime.Today.Month;
        public int CalendarNam { get; set; } = DateTime.Today.Year;

        /// <summary>Ngày đầu tiên của tháng đang xem trong calendar.</summary>
        public DateTime NgayDauThang => new DateTime(CalendarNam, CalendarThang, 1);

        /// <summary>Tổng số ngày trong tháng đang xem.</summary>
        public int SoNgayTrongThang => DateTime.DaysInMonth(CalendarNam, CalendarThang);

        /// <summary>
        /// Index offset để căn ô ngày đầu tiên theo lưới Thứ 2 – Chủ nhật (0=Thứ2, 6=Chủ nhật).
        /// </summary>
        public int OffsetNgayDau
        {
            get
            {
                int dow = (int)NgayDauThang.DayOfWeek; // Sun=0, Mon=1...
                return dow == 0 ? 6 : dow - 1;         // Shift để Mon=0
            }
        }

        /// <summary>Tên tháng hiển thị, ví dụ: "Tháng 6, 2026".</summary>
        public string TieuDeCalendar =>
            $"Tháng {CalendarThang}, {CalendarNam}";

        // ─────────────────────────────────────────────────────────
        //  Filter dropdowns (lấy từ DB)
        // ─────────────────────────────────────────────────────────
        public List<SelectListItem> DanhSachNhanVien { get; set; } = new();
        public List<SelectListItem> DanhSachDanhMuc { get; set; } = new();

        // ─────────────────────────────────────────────────────────
        //  Filter params đang áp dụng (để giữ trạng thái form)
        // ─────────────────────────────────────────────────────────
        public int? FilterNhanVien { get; set; }
        public string? FilterTrangThai { get; set; }
        public int? FilterDanhMuc { get; set; }
        public string? FilterTuNgay { get; set; }
        public string? FilterDenNgay { get; set; }
        public string? Keyword { get; set; }
        public string Sort { get; set; } = "newest";

        // ─────────────────────────────────────────────────────────
        //  Phân trang
        // ─────────────────────────────────────────────────────────
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public int TongTrang { get; set; }
        public int TongLichHen { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Chi tiết lịch hẹn đang được chọn (sidebar detail)
        // ─────────────────────────────────────────────────────────
        public LichHenViewModel? LichHenChiTiet { get; set; }
        public int? SelectedId { get; set; }

        // ─────────────────────────────────────────────────────────
        //  Danh sách KTV khả dụng cho form đổi KTV
        // ─────────────────────────────────────────────────────────
        public List<SelectListItem> DanhSachKTV { get; set; } = new();

        // ─────────────────────────────────────────────────────────
        //  Helpers cho calendar rendering
        // ─────────────────────────────────────────────────────────

        /// <summary>Lấy danh sách lịch hẹn theo ngày cụ thể trong tháng.</summary>
        public List<LichHenViewModel> GetLichHenTheoNgay(int day)
        {
            var date = new DateOnly(CalendarNam, CalendarThang, day);
            return DanhSachLichHen.FindAll(x => x.NgayHen == date);
        }

        /// <summary>Kiểm tra ngày hôm nay trong context calendar.</summary>
        public bool IsToday(int day)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            return today.Year == CalendarNam && today.Month == CalendarThang && today.Day == day;
        }

        /// <summary>Kiểm tra ngày được chọn (SelectedId event).</summary>
        public bool IsSelectedDay(int day)
        {
            if (LichHenChiTiet?.NgayHen == null) return false;
            return LichHenChiTiet.NgayHen.Value.Year == CalendarNam
                && LichHenChiTiet.NgayHen.Value.Month == CalendarThang
                && LichHenChiTiet.NgayHen.Value.Day == day;
        }
    }
}
