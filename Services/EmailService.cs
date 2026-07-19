using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SupportTicketSysterm.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            // ── Đọc cấu hình ──────────────────────────────────────────────────────
            var host     = _emailSettings.Host?.Trim();
            var port     = _emailSettings.Port;
            var fromAddr = (!string.IsNullOrWhiteSpace(_emailSettings.From)
                            ? _emailSettings.From
                            : !string.IsNullOrWhiteSpace(_emailSettings.Username)
                                ? _emailSettings.Username
                                : _emailSettings.UserName)?.Trim();
            var smtpUser = (!string.IsNullOrWhiteSpace(_emailSettings.Username)
                            ? _emailSettings.Username
                            : _emailSettings.UserName)?.Trim();
            var password  = _emailSettings.Password?.Trim();
            var fromName  = (!string.IsNullOrWhiteSpace(_emailSettings.DisplayName)
                             ? _emailSettings.DisplayName
                             : "TechSupport")?.Trim();

            // ── Log cấu hình để debug ─────────────────────────────────────────────
            _logger.LogInformation(
                "[EmailService] Chuẩn bị gửi email tới {ToEmail}. Host={Host}, Port={Port}, From={From}, SmtpUser={SmtpUser}",
                toEmail, host, port, fromAddr, smtpUser);

            if (string.IsNullOrWhiteSpace(host))
                throw new InvalidOperationException("EmailSettings.Host chưa được cấu hình.");
            if (string.IsNullOrWhiteSpace(fromAddr))
                throw new InvalidOperationException("EmailSettings.From / UserName chưa được cấu hình.");
            if (string.IsNullOrWhiteSpace(smtpUser))
                throw new InvalidOperationException("EmailSettings.UserName chưa được cấu hình.");
            if (string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException("EmailSettings.Password chưa được cấu hình.");

            // ── Xây dựng MimeMessage ──────────────────────────────────────────────
            var emailMessage = new MimeMessage();
            emailMessage.From.Add(new MailboxAddress(fromName, fromAddr));
            emailMessage.To.Add(new MailboxAddress(string.Empty, toEmail));
            emailMessage.Subject = subject;
            emailMessage.Body   = new BodyBuilder { HtmlBody = htmlMessage }.ToMessageBody();

            // ── Kết nối SMTP ──────────────────────────────────────────────────────
            // Port 587 → StartTls (STARTTLS / OPPORTUNISTIC TLS)
            // Port 465 → SslOnConnect (SSL/TLS thuần)
            var socketOptions = port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            _logger.LogInformation(
                "[EmailService] Kết nối SMTP: {Host}:{Port} ({SocketOption})",
                host, port, socketOptions);

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(host, port, socketOptions);
                _logger.LogInformation("[EmailService] Kết nối SMTP thành công.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[EmailService] ❌ Không thể kết nối SMTP {Host}:{Port}. Chi tiết: {Message}",
                    host, port, ex.Message);
                throw new Exception($"Không thể kết nối máy chủ SMTP ({host}:{port}): {ex.Message}", ex);
            }

            try
            {
                await client.AuthenticateAsync(smtpUser, password);
                _logger.LogInformation("[EmailService] Xác thực SMTP thành công cho tài khoản {SmtpUser}.", smtpUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[EmailService] ❌ Xác thực SMTP thất bại. User={SmtpUser}. Chi tiết: {Message}",
                    smtpUser, ex.Message);
                await client.DisconnectAsync(true);
                throw new Exception($"Xác thực SMTP thất bại (user={smtpUser}): {ex.Message}. " +
                                    "Hãy kiểm tra App Password Gmail.", ex);
            }

            try
            {
                await client.SendAsync(emailMessage);
                await client.DisconnectAsync(true);
                _logger.LogInformation(
                    "[EmailService] ✅ Gửi email thành công tới {ToEmail}. Subject: {Subject}",
                    toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[EmailService] ❌ Gửi email thất bại tới {ToEmail}. Chi tiết: {Message}",
                    toEmail, ex.Message);
                await client.DisconnectAsync(true);
                throw new Exception($"Gửi email thất bại tới {toEmail}: {ex.Message}", ex);
            }
        }

        public async Task SendOtpEmailAsync(string toEmail, string fullName, string otpCode)
        {
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "EmailTemplates", "OtpEmail.html");
            string templateContent;

            if (File.Exists(templatePath))
            {
                templateContent = await File.ReadAllTextAsync(templatePath);
                _logger.LogInformation("[EmailService] Dùng template OtpEmail.html cho {ToEmail}.", toEmail);
            }
            else
            {
                _logger.LogWarning("[EmailService] Không tìm thấy OtpEmail.html, dùng fallback template.");
                templateContent = "<h2>Xác thực Email</h2><p>Xin chào <strong>{FullName}</strong>,</p>" +
                                  "<p>Mã OTP của bạn là: <strong style='font-size:24px;letter-spacing:4px'>{OTP}</strong>." +
                                  " Hiệu lực trong <strong>5 phút</strong>.</p>" +
                                  "<p>Vui lòng không chia sẻ mã này với bất kỳ ai.</p>";
            }

            string body = templateContent
                .Replace("{FullName}", fullName)
                .Replace("{OTP}", otpCode);

            await SendEmailAsync(toEmail, "Xác thực địa chỉ Email - TechSupport", body);
        }

        public async Task SendRegisterSuccessEmailAsync(string toEmail, string fullName, string phoneNumber, string registerDate)
        {
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "EmailTemplates", "RegisterSuccess.html");
            string templateContent;

            if (File.Exists(templatePath))
            {
                templateContent = await File.ReadAllTextAsync(templatePath);
            }
            else
            {
                templateContent = "<h2>Đăng ký thành công</h2><p>Xin chào {FullName}, tài khoản của bạn đã được kích hoạt thành công.</p>";
            }

            string body = templateContent
                .Replace("{FullName}", fullName)
                .Replace("{Email}", toEmail)
                .Replace("{PhoneNumber}", phoneNumber)
                .Replace("{RegisterDate}", registerDate);

            await SendEmailAsync(toEmail, "Đăng ký tài khoản thành công - TechSupport", body);
        }

        public async Task SendForgotPasswordEmailAsync(string toEmail, string fullName, string otpCode, string expiredTime)
        {
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "EmailTemplates", "ForgotPassword.html");
            string templateContent;

            if (File.Exists(templatePath))
            {
                templateContent = await File.ReadAllTextAsync(templatePath);
            }
            else
            {
                templateContent = "<h2>Khôi phục mật khẩu</h2><p>Xin chào {FullName},</p>" +
                                  "<p>Mã OTP đặt lại mật khẩu của bạn là: <strong>{OTP}</strong>. Hiệu lực trong {ExpiredTime}.</p>";
            }

            var currentYear = DateTime.Now.Year.ToString();
            var loginUrl    = "http://localhost:5000/Auth/DangNhap";

            string body = templateContent
                .Replace("{FullName}", fullName)
                .Replace("{OTP}", otpCode)
                .Replace("{ExpiredTime}", expiredTime)
                .Replace("{CurrentYear}", currentYear)
                .Replace("{LoginUrl}", loginUrl);

            await SendEmailAsync(toEmail, "Khôi phục mật khẩu tài khoản - TechSupport", body);
        }
    }
}
