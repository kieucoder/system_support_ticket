using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SupportTicketSysterm.ViewModels.Services
{
    public class SpeedSmsService : ISpeedSmsService
    {
        private readonly HttpClient _httpClient;
        private readonly string _accessToken;
        private readonly string _sender;
        private readonly ILogger<SpeedSmsService> _logger;

        public SpeedSmsService(HttpClient httpClient, IConfiguration configuration, ILogger<SpeedSmsService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            var section = configuration.GetSection("SpeedSMS");
            _accessToken = section["AccessToken"] ?? "";
            _sender = section["Sender"] ?? "";
        }

        public async Task<bool> SendOtpAsync(string phone, string otp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(_accessToken))
                {
                    _logger.LogError("SpeedSMS AccessToken is null or empty.");
                    return false;
                }

                string formattedPhone = phone.Trim();
                if (formattedPhone.StartsWith("0"))
                {
                    formattedPhone = "+84" + formattedPhone.Substring(1);
                }
                else if (formattedPhone.StartsWith("84") && !formattedPhone.StartsWith("+"))
                {
                    formattedPhone = "+" + formattedPhone;
                }
                else if (!formattedPhone.StartsWith("+"))
                {
                    formattedPhone = "+" + formattedPhone;
                }

                _logger.LogInformation("Sending OTP to phone {Phone} using SpeedSMS", formattedPhone);

                string url = "https://api.speedsms.vn/index.php/sms/send";

                // Setup basic authentication header
                string authString = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_accessToken}:x"));
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authString);

                // If sender is placeholder "BrandName", clear it to use sub-gateway default
                string senderValue = string.IsNullOrWhiteSpace(_sender) || _sender == "BrandName" ? "" : _sender;

                // Prepare JSON request body using dictionary so we can omit sender when not provided
                var requestData = new Dictionary<string, object>
                {
                    ["to"] = new[] { formattedPhone },
                    ["content"] = $"Tech Support - Ma OTP dang ky tai khoan cua ban la: {otp}. Ma co hieu luc trong 5 phut. Khong chia se ma nay.",
                    ["sms_type"] = 2
                };

                if (!string.IsNullOrEmpty(senderValue))
                {
                    requestData["sender"] = senderValue;
                }

                string jsonContent = JsonSerializer.Serialize(requestData);
                _logger.LogInformation("SpeedSMS Request Content: {JsonContent}", jsonContent);

                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, httpContent);
                string responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("SpeedSMS HTTP Response: Status={Status}, Body={Body}", response.StatusCode, responseBody);

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseBody);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("code", out var codeProp))
                    {
                        string codeValue = codeProp.GetString() ?? "";
                        if (codeValue == "00")
                        {
                            _logger.LogInformation("SpeedSMS OTP sent successfully. Code: 00");
                            return true;
                        }
                    }
                    if (root.TryGetProperty("status", out var statusProp))
                    {
                        string statusValue = statusProp.GetString() ?? "";
                        if (statusValue == "success")
                        {
                            _logger.LogInformation("SpeedSMS OTP sent successfully. Status: success");
                            return true;
                        }
                    }
                }

                _logger.LogError("SpeedSMS send failed: Status={Status}, Body={Body}", response.StatusCode, responseBody);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception when sending OTP via SpeedSMS");
                return false;
            }
        }
    }
}
