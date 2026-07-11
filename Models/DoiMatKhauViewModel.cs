using System.ComponentModel.DataAnnotations;

namespace SupportTicketSysterm.Models
{
    public class DoiMatKhauViewModel
    {
        [Required]
        public string MatKhauCu { get; set; }

        [Required]
        [MinLength(6)]
        public string MatKhauMoi { get; set; }

        [Required]
        [Compare("MatKhauMoi")]
        public string XacNhanMatKhau { get; set; }
    }
}
