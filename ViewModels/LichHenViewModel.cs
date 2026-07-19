using System;

namespace SupportTicketSysterm.ViewModels
{
    public class LichHenViewModel
    {
        public int IdLichHen { get; set; }
        public DateOnly? NgayHen { get; set; }
        public TimeOnly? GioHen { get; set; }
        public string? DiaChi { get; set; }
        public string? TrangThai { get; set; }
        public string? GhiChu { get; set; }
        public string? HoTenNhanVien { get; set; }
        public string? SoDienThoai { get; set; }

        // Compatibility properties to support other parts of the application
        public TimeOnly? GioBatDau { get => GioHen; set => GioHen = value; }
        public TimeOnly? GioKetThuc { get; set; }
        public string? DiaChiHoTro { get => DiaChi; set => DiaChi = value; }
        public string? TenKyThuatVien { get => HoTenNhanVien; set => HoTenNhanVien = value; }
        public string? SoDienThoaiKyThuatVien { get => SoDienThoai; set => SoDienThoai = value; }
    }
}
