using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class GeminiDiagnosticResult
    {
        public bool IsApiKeyConfigured { get; set; }
        public string Model { get; set; }
        public string Endpoint { get; set; }
        public int HttpStatusCode { get; set; }
        public double ResponseTimeMs { get; set; }
        public string ResponseBody { get; set; }
        public string ExceptionDetails { get; set; }
        public bool Success { get; set; }
    }

    public interface IGeminiService
    {
        Task<string> SendPromptAsync(string systemInstruction, string userPrompt);
        Task<GeminiDiagnosticResult> TestConnectionAsync(string testPrompt);
    }
}
