using System;
using System.Collections.Generic;
using SupportTicketSysterm.Models;

namespace SupportTicketSysterm.ViewModels
{
    public class ChatViewModel
    {
        public int? SelectedIdLienHe { get; set; }
        public int CurrentUserId { get; set; }
        public string CurrentUserRole { get; set; } // "KhachHang", "NhanVien", "Admin"
        public List<ConversationViewModel> Conversations { get; set; } = new List<ConversationViewModel>();
        public ConversationViewModel ActiveConversation { get; set; }
        public List<MessageViewModel> Messages { get; set; } = new List<MessageViewModel>();
    }
}
