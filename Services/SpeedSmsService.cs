using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SupportTicketSysterm.Models;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class SpeedSmsService : ISmsService
    {
        private const string SendSmsEndpoint = "https://api.speedsms.vn/index.php/sms/send";
        private readonly HttpClient _httpClient;
        private readonly SpeedSmsOptions _options;
        private readonly ILogger<SpeedSmsService> _logger;

        public SpeedSmsService(HttpClient httpClient, IOptions<SpeedSmsOptions> options, ILogger<SpeedSmsService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value;
        }

        public async Task<bool> SendOtpAsync(string phoneNumber, string otp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(_options.AccessToken))
                {
                    _logger.LogError("Chưa cấu hình SpeedSMS AccessToken.");
                    return false;
                }

                var requestData = new System.Collections.Generic.Dictionary<string, object>
                {
                    ["to"] = new[] { NormalizePhoneNumber(phoneNumber) },
                    ["content"] = $"TechSupport OTP cua ban la {otp}. Ma co hieu luc trong 5 phut. Khong chia se ma nay cho bat ky ai.",
                    ["sms_type"] = 2
                };

                if (!string.IsNullOrWhiteSpace(_options.Sender))
                {
                    requestData["sender"] = _options.Sender.Trim();
                }

                using var request = new HttpRequestMessage(HttpMethod.Post, SendSmsEndpoint)
                {
                    Content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json")
                };
                var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.AccessToken}:x"));
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);

                var response = await _httpClient.SendAsync(request);
                string responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("SpeedSMS response cho {Phone}: {StatusCode} - {ResponseBody}", phoneNumber, response.StatusCode, responseBody);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Gửi OTP thất bại cho {Phone}. HTTP {StatusCode}", phoneNumber, response.StatusCode);
                    return false;
                }

                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;
                var code = root.TryGetProperty("code", out var codeProp) ? codeProp.GetString() : null;
                var status = root.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : null;

                var success = string.Equals(code, "00", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(status, "success", StringComparison.OrdinalIgnoreCase);

                if (success)
                {
                    _logger.LogInformation("OTP gửi thành công qua SpeedSMS tới {Phone}", phoneNumber);
                    return true;
                }

                var message = root.TryGetProperty("message", out var messageProp) ? messageProp.GetString() : "Không có chi tiết lỗi";
                _logger.LogError("Gửi OTP thất bại cho {Phone}. Code={Code}, Status={Status}, Message={Message}", phoneNumber, code, status, message);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Có lỗi khi gọi SpeedSMS để gửi OTP tới {Phone}", phoneNumber);
                return false;
            }
        }

        private static string NormalizePhoneNumber(string phoneNumber)
        {
            var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

            if (digits.StartsWith("84"))
            {
                return digits;
            }

            if (digits.StartsWith("0"))
            {
                return digits;
            }

            return $"+{digits}";
        }
    }
}
