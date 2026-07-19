using System;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.ViewModels
{
    public class PhanHoiDanhGiaViewModel
    {
        public int IdDanhGia { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập nội dung phản hồi của nhân viên.")]
        [MaxLength(1000, ErrorMessage = "Phản hồi không được vượt quá 1000 ký tự.")]
        public string PhanHoiNhanVien { get; set; } = null!;

        public int? IdNhanVienPhanHoi { get; set; }
        public DateTime? NgayPhanHoi { get; set; }

        public DanhGiaChiTietViewModel? ReviewDetails { get; set; }
    }
}
