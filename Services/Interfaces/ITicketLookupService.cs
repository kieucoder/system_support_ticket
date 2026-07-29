using System.Threading.Tasks;
using SupportTicketSysterm.DTO;

namespace SupportTicketSysterm.Services.Interfaces
{
    public interface ITicketLookupService
    {
        Task<LookupTicketResponse> LookupAsync(LookupTicketRequest request, int? idKhachHang);
    }
}
