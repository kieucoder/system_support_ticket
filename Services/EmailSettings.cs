namespace SupportTicketSysterm.Services
{
    public class EmailSettings
    {
        public string DisplayName { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Username { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty; // Support both casings
        public string Password { get; set; } = string.Empty;
        public bool SSL { get; set; }
        public bool EnableSSL { get; set; } // Support both casings
    }
}
