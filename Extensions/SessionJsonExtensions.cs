using System.Text.Json;

namespace SupportTicketSysterm.Extensions
{
    public static class SessionJsonExtensions
    {
        public static void SetObject<T>(this ISession session, string key, T value)
        {
            session.SetString(key, JsonSerializer.Serialize(value));
        }

        public static T? GetObject<T>(this ISession session, string key)
        {
            var value = session.GetString(key);
            return string.IsNullOrWhiteSpace(value)
                ? default
                : JsonSerializer.Deserialize<T>(value);
        }
    }
}
