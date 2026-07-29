using System.Threading.Tasks;
using SupportTicketSysterm.ViewModels;

namespace SupportTicketSysterm.Services
{
    public interface IDanhGiaService
    {
        Task<bool> CanUserReplyRatingAsync(int idDanhGia, int userId, string role);
        Task<DanhGiaChiTietViewModel?> GetRatingForReplyAsync(int idDanhGia, int userId, string role);
        Task<(bool Success, string Message, int StatusCode)> SaveReplyAsync(int idDanhGia, string phanHoi, int userId, string role);
        Task<DanhGiaListViewModel> GetRatingListForUserAsync(int userId, string role, string keyword, string status, string sort, int page, int pageSize);
    }
}
