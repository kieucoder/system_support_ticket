using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SupportTicketSysterm.DTO;
using SupportTicketSysterm.Services.Interfaces;

namespace SupportTicketSysterm.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AIChatController : ControllerBase
    {
        private readonly IAIChatService _aiChatService;
        private readonly ILogger<AIChatController> _logger;

        public AIChatController(
            IAIChatService aiChatService,
            ILogger<AIChatController> logger)
        {
            _aiChatService = aiChatService;
            _logger = logger;
        }

        // ==========================================
        // POST /api/ai/chat
        // ==========================================
        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] LookupTicketRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new LookupTicketResponse
                {
                    Success = false,
                    Message = "Nội dung tin nhắn không được để trống."
                });
            }

            // Retrieve Customer Session ID
            int? idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (!idKhachHang.HasValue)
            {
                // Fallback check for ClaimsPrincipal User ID if authenticated via Cookies
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out int parsedId))
                {
                    idKhachHang = parsedId;
                }
            }

            _logger.LogInformation("AIChatController POST /api/ai/chat called by Customer {IdKhachHang}", idKhachHang);

            var response = await _aiChatService.ProcessChatMessageAsync(request, idKhachHang);

            if (!response.Success)
            {
                if (response.Intent == "Unauthorized" || response.Intent == "Forbidden")
                {
                    return StatusCode(StatusCodes.Status403Forbidden, response);
                }
                if (response.Intent == "NotFound")
                {
                    return NotFound(response);
                }
            }

            return Ok(response);
        }
    }
}
