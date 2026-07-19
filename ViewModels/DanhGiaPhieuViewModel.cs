using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace SupportTicketSysterm.ViewModels
{
    public class DanhGiaPhieuViewModel
    {
        public int IdPhieu { get; set; }

        public string? MaPhieu { get; set; }

        public string? TieuDe { get; set; }

        public string? TenDanhMuc { get; set; }

        public string? TenDichVu { get; set; }

        public string? TenNhanVien { get; set; }

        public string? TrangThai { get; set; }

        [Required(ErrorMessage = "Vui lòng đánh giá Chất lượng dịch vụ.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Chất lượng dịch vụ từ 1 đến 5 sao.")]
        public int ChatLuongDichVu { get; set; }

        [Required(ErrorMessage = "Vui lòng đánh giá Thái độ nhân viên.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Thái độ nhân viên từ 1 đến 5 sao.")]
        public int ThaiDoNhanVien { get; set; }

        [Required(ErrorMessage = "Vui lòng đánh giá Tốc độ xử lý.")]
        [Range(1, 5, ErrorMessage = "Vui lòng đánh giá Tốc độ xử lý từ 1 đến 5 sao.")]
        public int TocDoXuLy { get; set; }

        [MaxLength(1000, ErrorMessage = "Nhận xét không được vượt quá 1000 ký tự.")]
        public string? NhanXet { get; set; }

        public List<IFormFile>? Files { get; set; } = new();
    }
}
