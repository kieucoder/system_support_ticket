using System;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using SupportTicketSysterm.Services;

namespace SupportTicketSysterm.Gemini
{
    public class IntentDetector
    {
        private readonly IGeminiService _geminiService;

        public IntentDetector(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        public async Task<GeminiIntentResult> DetectIntentAsync(string message, string? contextTicketCode = null)
        {
            var result = new GeminiIntentResult();

            if (string.IsNullOrWhiteSpace(message))
            {
                result.Intent = "General";
                return result;
            }

            // Fast Regex Match for Ticket Codes (e.g. PH000125, PH20260719001, PH123)
            var match = Regex.Match(message, @"(PH\d{3,15})", RegexOptions.IgnoreCase);
            if (match.Success)
            {
                result.Intent = "LookupTicket";
                result.TicketCode = match.Value.ToUpper();
                result.Confidence = 0.99;
                return result;
            }

            // Keyword Based Fast Classification
            var msgLower = message.ToLower();
            if (msgLower.Contains("nhân viên") || msgLower.Contains("phụ trách") || msgLower.Contains("kỹ thuật viên"))
            {
                result.Intent = "GetAssignedEmployee";
                result.TicketCode = contextTicketCode;
                result.Confidence = 0.95;
                return result;
            }

            if (msgLower.Contains("lịch hẹn") || msgLower.Contains("lịch") || msgLower.Contains("khi nào đến"))
            {
                result.Intent = "GetAppointmentInfo";
                result.TicketCode = contextTicketCode;
                result.Confidence = 0.95;
                return result;
            }

            if (msgLower.Contains("gần nhất") || msgLower.Contains("mới nhất") || msgLower.Contains("phiếu của tôi") || msgLower.Contains("tiến độ"))
            {
                result.Intent = "LookupLatestTicket";
                result.TicketCode = contextTicketCode;
                result.Confidence = 0.95;
                return result;
            }

            // Fallback: Gemini AI Structured Intent Detection
            try
            {
                var systemInstruction = @"Bạn là bộ phân tích ý định (Intent Detector) của Chatbox AI TechSupport.
Nhiệm vụ: Phân tích tin nhắn của người dùng và trả về DUY NHẤT một chuỗi JSON chuẩn có cấu trúc:
{
  ""intent"": ""LookupTicket"" | ""LookupLatestTicket"" | ""GetAssignedEmployee"" | ""GetAppointmentInfo"" | ""General"",
  ""ticketCode"": ""Mã_Phiếu_Nếu_Có_Hoặc_Null"",
  ""confidence"": 0.95
}";

                var userPrompt = $"Tin nhắn người dùng: \"{message}\"\nMã phiếu context hiện tại: \"{contextTicketCode}\"";
                var aiResponse = await _geminiService.SendPromptAsync(systemInstruction, userPrompt);

                var jsonMatch = Regex.Match(aiResponse, @"\{.*\}", RegexOptions.Singleline);
                if (jsonMatch.Success)
                {
                    using (var doc = JsonDocument.Parse(jsonMatch.Value))
                    {
                        var root = doc.RootElement;
                        if (root.TryGetProperty("intent", out var intentProp))
                            result.Intent = intentProp.GetString() ?? "LookupTicket";

                        if (root.TryGetProperty("ticketCode", out var codeProp) && codeProp.ValueKind == JsonValueKind.String)
                        {
                            var codeStr = codeProp.GetString();
                            if (!string.IsNullOrWhiteSpace(codeStr) && codeStr.ToLower() != "null")
                                result.TicketCode = codeStr.ToUpper();
                        }
                    }
                }
            }
            catch
            {
                // Fallback to Context Ticket Code if available
                if (!string.IsNullOrEmpty(contextTicketCode))
                {
                    result.Intent = "LookupTicket";
                    result.TicketCode = contextTicketCode;
                }
            }

            if (string.IsNullOrEmpty(result.TicketCode) && !string.IsNullOrEmpty(contextTicketCode))
            {
                result.TicketCode = contextTicketCode;
            }

            return result;
        }
    }
}
