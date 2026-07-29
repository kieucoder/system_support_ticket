using System;

namespace SupportTicketSysterm.Models
{
    public class ConversationViewModel
    {
        public int IdLienHe { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string TenKhachHang { get; set; } = string.Empty;
        public string TenNhanVien { get; set; } = string.Empty;
        public int? IdPhieu { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string TieuDePhieu { get; set; } = string.Empty;
        public string TenDanhMuc { get; set; } = string.Empty;
        public string DichVuPhieu { get; set; } = string.Empty;
        public DateTime? ThoiGianGui { get; set; }
        public int SoTinChuaDoc { get; set; } // Unread for staff
        public int TinChuaDocKhach { get; set; } // Unread for customer
        public string LastMessage { get; set; } = string.Empty;

        // Trạng thái đồng bộ trực tiếp từ PhieuHoTro.TrangThai
        private string _trangThai = "Chờ tiếp nhận";
        public string TrangThai
        {
            get => StandardizeStatus(_trangThai);
            set => _trangThai = value;
        }

        public string TrangThaiPhieu
        {
            get => TrangThai;
            set => _trangThai = value;
        }

        public static string StandardizeStatus(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return "Chờ tiếp nhận";
            var trimmed = raw.Trim();
            return trimmed switch
            {
                "0" or "Chờ tiếp nhận" or "ChoTiepNhan" or "Chờ xử lý" or "ChoXuLy" or "Chờ" or "Cho" or "waiting" => "Chờ tiếp nhận",
                "1" or "Đang xử lý" or "DangXuLy" or "Đang trao đổi" or "DangTraoDoi" or "processing" => "Đang xử lý",
                "2" or "Chờ lịch hẹn" or "ChoLichHen" or "appointment" => "Chờ lịch hẹn",
                "3" or "Hoàn thành" or "HoanThanh" or "Đã đóng" or "DaDong" or "closed" or "completed" => "Hoàn thành",
                "4" or "Đã hủy" or "DaHuy" or "Hủy" or "Huy" or "cancelled" or "canceled" => "Đã hủy",
                _ => trimmed
            };
        }

        public string TrangThaiText => TrangThai switch
        {
            "Chờ tiếp nhận" => "🟡 Chờ tiếp nhận",
            "Đang xử lý" => "🔵 Đang xử lý",
            "Chờ lịch hẹn" => "🟣 Chờ lịch hẹn",
            "Hoàn thành" => "🟢 Hoàn thành",
            "Đã hủy" => "🔴 Đã hủy",
            _ => "🟡 Chờ tiếp nhận"
        };

        public string TrangThaiColor => TrangThai switch
        {
            "Chờ tiếp nhận" => "warning",
            "Đang xử lý" => "primary",
            "Chờ lịch hẹn" => "purple",
            "Hoàn thành" => "success",
            "Đã hủy" => "danger",
            _ => "warning"
        };

        public string BadgeCssClass => TrangThaiColor switch
        {
            "warning" => "badge-status-warning",
            "primary" => "badge-status-primary",
            "purple" => "badge-status-purple",
            "success" => "badge-status-success",
            "danger" => "badge-status-danger",
            _ => "badge-status-warning"
        };

        // Flags điều khiển giao diện & khóa chat
        public bool IsReadOnly => TrangThai == "Hoàn thành" || TrangThai == "Đã hủy";
        public bool CanSendMessage => !IsReadOnly;
        public bool CanUploadFile => !IsReadOnly;
        public bool CanReceive => TrangThai == "Chờ tiếp nhận";
        public bool CanCreateAppointment => TrangThai == "Đang xử lý";
        public bool CanUpdateAppointment => TrangThai == "Chờ lịch hẹn";
        public bool CanComplete => TrangThai == "Đang xử lý" || TrangThai == "Chờ lịch hẹn";
        public bool CanCancel => TrangThai == "Chờ tiếp nhận" || TrangThai == "Đang xử lý" || TrangThai == "Chờ lịch hẹn";
        public bool CanViewRating => TrangThai == "Hoàn thành";
    }
}
