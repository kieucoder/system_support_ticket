using System.Threading.Tasks;
using SupportTicketSysterm.Models.ViewModels;

namespace SupportTicketSysterm.Services
{
    public interface IDashboardService
    {
        Task<DashboardViewModel> GetDashboardDataAsync();
    }
}
