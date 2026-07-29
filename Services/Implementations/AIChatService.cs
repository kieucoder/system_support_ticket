using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.DTO;
using SupportTicketSysterm.Gemini;
using SupportTicketSysterm.Services.Interfaces;

namespace SupportTicketSysterm.Services.Implementations
{
    public class AIChatService : IAIChatService
    {
        private readonly IntentDetector _intentDetector;
        private readonly ITicketLookupService _ticketLookupService;
        private readonly ILogger<AIChatService> _logger;

        public AIChatService(
            IntentDetector intentDetector,
            ITicketLookupService ticketLookupService,
            ILogger<AIChatService> logger)
        {
            _intentDetector = intentDetector;
            _ticketLookupService = ticketLookupService;
            _logger = logger;
        }

        public async Task<LookupTicketResponse> ProcessChatMessageAsync(LookupTicketRequest request, int? idKhachHang)
        {
            try
            {
                _logger.LogInformation("Processing AI Chat request from Customer {IdKhachHang}: '{Message}'", idKhachHang, request.Message);

                // Step 1: Detect Intent & Extract Ticket Code via Gemini / Regex
                var intentResult = await _intentDetector.DetectIntentAsync(request.Message, request.ContextTicketCode);

                _logger.LogInformation("Intent Detected: {Intent}, TicketCode: {TicketCode}, Confidence: {Confidence}",
                    intentResult.Intent, intentResult.TicketCode, intentResult.Confidence);

                // Request enrichment
                request.TicketCode = intentResult.TicketCode ?? request.TicketCode;

                // Step 2: Dispatch to TicketLookupService for Database Lookup & Security Check
                var response = await _ticketLookupService.LookupAsync(request, idKhachHang);
                response.Intent = intentResult.Intent;

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled Exception in AIChatService");
                return new LookupTicketResponse
                {
                    Success = false,
                    Message = "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.",
                    Intent = "Error"
                };
            }
        }
    }
}
