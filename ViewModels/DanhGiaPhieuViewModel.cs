using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SupportTicketSysterm.ViewModels
{
    public class DanhGiaPhieuViewModel
    {
        public int IdPhieu { get; set; }

        public string? MaPhieu { get; set; }

        public string? TieuDe { get; set; }

        public string? TenKhachHang { get; set; }

        public string? TenDanhMuc { get; set; }

        public string? TenDichVu { get; set; }

        public string? TenNhanVien { get; set; }

        public string? TrangThai { get; set; }

        public string? NgayHoanThanhText { get; set; }

        public bool IsCompleted { get; set; } = true;

        public bool IsAlreadyRated { get; set; } = false;

        public string? MessageAlert { get; set; }

        [Required(ErrorMessage = "Vui lòng đánh giá Chất lượng dịch vụ.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Chất lượng dịch vụ từ 1 đến 5 sao.")]
        public int ChatLuongDichVu { get; set; } = 5;

        [Required(ErrorMessage = "Vui lòng đánh giá Thái độ nhân viên.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Thái độ nhân viên từ 1 đến 5 sao.")]
        public int ThaiDoNhanVien { get; set; } = 5;

        [Required(ErrorMessage = "Vui lòng đánh giá Tốc độ xử lý.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Tốc độ xử lý từ 1 đến 5 sao.")]
        public int TocDoXuLy { get; set; } = 5;

        [Required(ErrorMessage = "Vui lòng đánh giá Khả năng giải quyết.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Khả năng giải quyết từ 1 đến 5 sao.")]
        public int KhaNangGiaiQuyet { get; set; } = 5;

        [Required(ErrorMessage = "Vui lòng đánh giá Mức độ hài lòng.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Mức độ hài lòng từ 1 đến 5 sao.")]
        public int MucDoHaiLong { get; set; } = 5;

        public double DiemTrungBinh
        {
            get
            {
                return Math.Round((ChatLuongDichVu + ThaiDoNhanVien + TocDoXuLy + KhaNangGiaiQuyet + MucDoHaiLong) / 5.0, 1);
            }
        }

        [MaxLength(1000, ErrorMessage = "Nhận xét không được vượt quá 1000 ký tự.")]
        public string? NhanXet { get; set; }

        public DateTime? NgayDanhGia { get; set; }

        public List<IFormFile>? Files { get; set; } = new();
    }
}
