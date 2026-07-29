using System;

namespace SupportTicketSysterm.DTO
{
    public class CustomerDto
    {
        public int IdKhachHang { get; set; }
        public string MaKh { get; set; } = "";
        public string HoTen { get; set; } = "";
        public string Email { get; set; } = "";
        public string SoDienThoai { get; set; } = "";
    }

    public class EmployeeDto
    {
        public int IdNhanVien { get; set; }
        public string HoTen { get; set; } = "";
        public string ChucVu { get; set; } = "";
        public string AnhDaiDien { get; set; } = "";
        public string SoDienThoai { get; set; } = "";
    }

    public class AppointmentDto
    {
        public int IdLichHen { get; set; }
        public string NgayHen { get; set; } = "";
        public string GioBatDau { get; set; } = "";
        public string GioKetThuc { get; set; } = "";
        public string DiaChiHoTro { get; set; } = "";
        public string GhiChu { get; set; } = "";
        public string TrangThai { get; set; } = "";
    }

    public class AttachmentDto
    {
        public int IdFile { get; set; }
        public string TenFile { get; set; } = "";
        public string DuongDan { get; set; } = "";
        public string LoaiFile { get; set; } = "";
        public string NgayUpload { get; set; } = "";
    }

    public class MessageDto
    {
        public int IdTinNhan { get; set; }
        public string LoaiNguoiGui { get; set; } = "";
        public string NoiDung { get; set; } = "";
        public string ThoiGian { get; set; } = "";
        public string TrangThai { get; set; } = "";
    }

    public class RatingDto
    {
        public int IdDanhGia { get; set; }
        public int SoSao { get; set; }
        public string NhanXet { get; set; } = "";
        public string NgayDanhGia { get; set; } = "";
    }
}
