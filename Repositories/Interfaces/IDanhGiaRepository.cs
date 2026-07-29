using System.Collections.Generic;
using System.Threading.Tasks;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Repositories.Interfaces
{
    public interface IDanhGiaRepository
    {
        Task<DanhGium?> GetByIdAsync(int idDanhGia);
        Task<DanhGium?> GetByIdWithDetailsAsync(int idDanhGia);
        Task<List<DanhGium>> GetAllWithDetailsAsync();
        Task UpdateResponseAsync(int idDanhGia, string phanHoi, int idNhanVienPhanHoi);
    }
}
