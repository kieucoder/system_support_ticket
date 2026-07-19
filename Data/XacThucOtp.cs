using System;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Data
{
    public class XacThucOtp
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string MaOtp { get; set; } = null!;

        [Required]
        public DateTime ThoiGianHetHan { get; set; }

        [Required]
        public DateTime ThoiGianTao { get; set; }

        public bool DaSuDung { get; set; } = false;



        public int SoLanThu { get; set; } = 0;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }
    }
}
