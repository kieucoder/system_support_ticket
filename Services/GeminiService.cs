using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["Gemini:ApiKey"] ?? "";
            _model = configuration["Gemini:Model"] ?? "gemini-1.5-flash"; // fallbacks

            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("Gemini API key is empty or not configured under 'Gemini:ApiKey'. Please configure it in appsettings.json.");
            }
        }

        private string BuildEndpoint()
        {
            return $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
        }

        private string MapHttpStatusCodeToErrorMessage(int statusCode, string responseBody)
        {
            switch (statusCode)
            {
                case 400:
                    return $"[Lỗi {statusCode} - Invalid Argument] Yêu cầu gửi đi không hợp lệ. Chi tiết phản hồi: {responseBody}";
                case 401:
                    return $"[Lỗi {statusCode} - Unauthorized] API Key khóa truy cập Gemini không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình.";
                case 403:
                    return $"[Lỗi {statusCode} - Forbidden] Khóa API của bạn chưa được kích hoạt hoặc không được phép gọi dịch vụ Generative Language API.";
                case 404:
                    return $"[Lỗi {statusCode} - Not Found] Model cấu hình '{_model}' không tồn tại hoặc không được tìm thấy ở phiên bản v1beta.";
                case 429:
                    return $"[Lỗi {statusCode} - Rate Limit] Tài khoản của bạn đã vượt quá giới hạn tần suất yêu cầu của Google. Vui lòng đợi và thử lại sau.";
                case 500:
                    return $"[Lỗi {statusCode} - Internal Error] Máy chủ Google Gemini gặp sự cố kỹ thuật nội bộ.";
                case 503:
                    return $"[Lỗi {statusCode} - Service Unavailable] Dịch vụ Google Gemini hiện đang quá tải hoặc tạm thời ngưng hoạt động.";
                default:
                    return $"[Lỗi {statusCode} - HTTP Error] Kết nối tới máy chủ AI thất bại với trạng thái {statusCode}. Chi tiết: {responseBody}";
            }
        }

        public async Task<string> SendPromptAsync(string systemInstruction, string userPrompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogError("Gemini API Key is missing. Cannot call Gemini Service.");
                return "Hệ thống AI chưa được cấu hình khóa truy cập (API Key) trong appsettings.json.";
            }

            var endpoint = BuildEndpoint();
            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new { text = userPrompt }
                        }
                    }
                },
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new { text = systemInstruction }
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            HttpResponseMessage response = null;
            int maxRetries = 3;
            int delayMs = 1000;
            string lastErrorDetails = "";
            int lastStatusCode = 0;

            _logger.LogInformation("Calling Gemini... Model: {Model}, Endpoint: {Endpoint}", _model, endpoint);

            var stopwatch = Stopwatch.StartNew();

            for (int i = 0; i < maxRetries; i++)
            {
                stopwatch.Restart();
                // Create a fresh StringContent for every retry
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                try
                {
                    response = await _httpClient.PostAsync(endpoint, content);
                    stopwatch.Stop();

                    var responseBody = await response.Content.ReadAsStringAsync();
                    lastStatusCode = (int)response.StatusCode;
                    lastErrorDetails = responseBody;

                    // Log response details
                    _logger.LogInformation("Gemini API Attempt {Attempt} returned StatusCode: {Status}, Response Time: {TimeMs}ms, Body: {Body}", 
                        i + 1, lastStatusCode, stopwatch.Elapsed.TotalMilliseconds, responseBody);

                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }
                }
                catch (Exception ex)
                {
                    stopwatch.Stop();
                    _logger.LogWarning(ex, "Gemini API Attempt {Attempt} encountered exception. Response Time: {TimeMs}ms", i + 1, stopwatch.Elapsed.TotalMilliseconds);
                    lastErrorDetails = ex.Message;
                }

                if (i < maxRetries - 1)
                {
                    await Task.Delay(delayMs);
                    delayMs *= 2;
                }
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                var errorMsg = MapHttpStatusCodeToErrorMessage(lastStatusCode, lastErrorDetails);
                _logger.LogError("Gemini API call failed after {MaxRetries} retries. Final message: {Message}", maxRetries, errorMsg);
                return errorMsg;
            }

            try
            {
                var jsonResponse = await response.Content.ReadAsStringAsync();
                using (var doc = JsonDocument.Parse(jsonResponse))
                {
                    var root = doc.RootElement;
                    if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                    {
                        var firstCandidate = candidates[0];
                        if (firstCandidate.TryGetProperty("content", out var candidateContent))
                        {
                            if (candidateContent.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                            {
                                var text = parts[0].GetProperty("text").GetString();
                                return text ?? "Tôi đã nhận được yêu cầu nhưng không thể trích xuất câu trả lời.";
                            }
                        }
                    }
                }

                return "Không tìm thấy nội dung phản hồi từ máy chủ AI.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception parsing Gemini response payload");
                return "Lỗi phân tích cú pháp phản hồi từ AI. Chi tiết: " + ex.Message;
            }
        }

        public async Task<GeminiDiagnosticResult> TestConnectionAsync(string testPrompt)
        {
            var result = new GeminiDiagnosticResult
            {
                IsApiKeyConfigured = !string.IsNullOrEmpty(_apiKey),
                Model = _model,
                Endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent"
            };

            if (!result.IsApiKeyConfigured)
            {
                result.Success = false;
                result.ExceptionDetails = "API Key is empty or missing in configuration.";
                return result;
            }

            var endpoint = BuildEndpoint();
            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new { text = testPrompt }
                        }
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var stopwatch = Stopwatch.StartNew();
            try
            {
                var response = await _httpClient.PostAsync(endpoint, content);
                stopwatch.Stop();

                result.HttpStatusCode = (int)response.StatusCode;
                result.ResponseTimeMs = stopwatch.Elapsed.TotalMilliseconds;
                result.ResponseBody = await response.Content.ReadAsStringAsync();
                result.Success = response.IsSuccessStatusCode;

                if (!result.Success)
                {
                    result.ExceptionDetails = $"HTTP request failed with status code {response.StatusCode}.";
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                result.Success = false;
                result.ResponseTimeMs = stopwatch.Elapsed.TotalMilliseconds;
                result.ExceptionDetails = ex.ToString();
            }

            return result;
        }
    }
}
