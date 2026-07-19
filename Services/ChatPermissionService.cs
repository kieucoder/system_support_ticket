using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Services
{
    public interface IChatPermissionService
    {
        bool CanChat(string? trangThai);
    }

    public class ChatPermissionService : IChatPermissionService
    {
        public bool CanChat(string? trangThai)
        {
            if (string.IsNullOrEmpty(trangThai)) return true;
            return trangThai != "Hoàn thành" && trangThai != "Đã hủy";
        }
    }
}
