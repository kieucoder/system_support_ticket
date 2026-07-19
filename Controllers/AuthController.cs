using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Extensions;
using SupportTicketSysterm.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using SupportTicketSysterm.Services;
using System.Text.RegularExpressions;

namespace SupportTicketSysterm.Controllers
{
    public class AuthController : Controller
    {
        private const string PendingRegistrationSessionKey = "PendingRegistration";
        private readonly TechSupportContext _context;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        private readonly IOtpService _otpService;
        private readonly IAuthService _authService;

        public AuthController(
            TechSupportContext context,
            ILogger<AuthController> logger,
            IEmailService emailService,
            IOtpService otpService,
            IAuthService authService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
            _otpService = otpService;
            _authService = authService;
        }

        // ===================== ĐĂNG KÝ =====================

        #region Đăng ký 
        [HttpGet]
        public IActionResult DangKy()
        {
            var pendingRegistration = GetPendingRegistration();
            var model = new DangKyViewModel
            {
                HoTen = pendingRegistration?.HoTen ?? string.Empty,
                SoDienThoai = pendingRegistration?.SoDienThoai ?? string.Empty,
                Email = pendingRegistration?.Email ?? string.Empty,
                DiaChi = pendingRegistration?.DiaChi,
                NgaySinh = pendingRegistration?.NgaySinh
            };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuiOTP([FromForm] DangKyViewModel model)
        {
            NormalizeRegistrationModel(model);
            await _otpService.DeleteExpiredOtpAsync();

            ModelState.Remove(nameof(DangKyViewModel.OTP));
            ModelState.Remove(nameof(DangKyViewModel.TenDangNhap));
            
            // Server side validation
            if (!await ValidateRegistrationModelServerSideAsync(model))
            {
                return BuildRegistrationValidationResponse(model);
            }

            // Check hourly OTP request limit
            if (await _otpService.IsHourlyLimitExceededAsync(model.Email.Trim()))
            {
                return BuildOtpErrorResponse(model, "Bạn đã vượt quá giới hạn gửi OTP (tối đa 5 lần một giờ). Vui lòng thử lại sau.");
            }

            // Check resend cooldown
            var (allowed, remainingSeconds) = await _otpService.CanResendOtpAsync(model.Email.Trim(), 60);
            if (!allowed)
            {
                return BuildOtpErrorResponse(model, $"Vui lòng chờ {remainingSeconds} giây trước khi gửi lại OTP.");
            }

            // Generate & Save OTP
            var otp = await _otpService.GenerateOtpAsync();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var saved = await _otpService.SaveOtpAsync(model.Email.Trim(), otp, ipAddress);
            if (!saved)
            {
                _logger.LogError("Không thể lưu OTP cho email {Email}", model.Email);
                return BuildOtpErrorResponse(model, "Không thể khởi tạo mã OTP. Vui lòng thử lại.");
            }

            // Send Email OTP
            try
            {
                await _emailService.SendOtpEmailAsync(model.Email.Trim(), model.HoTen.Trim(), otp);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gửi Email OTP thất bại tới {Email}. Chi tiết: {Message}", model.Email, ex.Message);
                await _otpService.InvalidatePreviousOtpAsync(model.Email.Trim());
                // Trả về thông điệp lỗi thực tế từ SMTP để dễ debug trên frontend
                var smtpError = $"Không thể gửi OTP: {ex.Message}";
                return BuildOtpErrorResponse(model, smtpError);
            }

            // Store in Session (Pending Registration)
            var nowUtc = DateTime.UtcNow;
            var pendingRegistration = new PendingRegistrationModel
            {
                HoTen = model.HoTen.Trim(),
                SoDienThoai = model.SoDienThoai.Trim(),
                Email = model.Email.Trim(),
                DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim(),
                NgaySinh = model.NgaySinh,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.MatKhau),
                OtpSentAtUtc = nowUtc,
                OtpExpiresAtUtc = nowUtc.AddMinutes(5)
            };
            SetPendingRegistration(pendingRegistration);

            _logger.LogInformation("OTP gửi thành công tới {Email}", model.Email);

            return Json(new
            {
                success = true,
                message = "Mã OTP đã được gửi thành công đến Email của bạn."
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DangKy(DangKyViewModel model)
        {
            return await GuiOTP(model);
        }

        [HttpGet]
        public IActionResult NhapOtp()
        {
            var pendingRegistration = GetPendingRegistration();
            if (pendingRegistration == null)
            {
                TempData["Error"] = "Phiên đăng ký đã hết hạn. Vui lòng nhập lại thông tin.";
                return RedirectToAction(nameof(DangKy));
            }

            var viewModel = BuildOtpViewModel(pendingRegistration);
            return View(viewModel);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> XacNhanOtp(DangKyViewModel model)
        {
            var pendingRegistration = GetPendingRegistration();
            if (pendingRegistration == null)
            {
                return Content("<div class='alert-danger'>Phiên đăng ký đã hết hạn. Vui lòng tải lại trang và nhập lại thông tin.</div>", "text/html");
            }

            if (string.IsNullOrWhiteSpace(model.OTP) || model.OTP.Length < 6)
            {
                return Content("<div class='alert-danger'>Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.</div>", "text/html");
            }

            // Verify OTP
            var verifyResult = await _otpService.VerifyOtpAsync(pendingRegistration.Email, model.OTP.Trim());
            if (!verifyResult.IsSuccess)
            {
                _logger.LogWarning("OTP xác thực thất bại cho {Email} với trạng thái {Status}", pendingRegistration.Email, verifyResult.Status);
                return Content($"<div class='alert-danger'>{verifyResult.Message}</div>", "text/html");
            }

            // Save to database
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate once again
                if (await _context.KhachHangs.AnyAsync(x => x.Email == pendingRegistration.Email))
                {
                    return Content("<div class='alert-danger'>Email này đã được đăng ký trước đó.</div>", "text/html");
                }
                if (await _context.KhachHangs.AnyAsync(x => x.SoDienThoai == pendingRegistration.SoDienThoai))
                {
                    return Content("<div class='alert-danger'>Số điện thoại này đã được đăng ký trước đó.</div>", "text/html");
                }

                var khachHang = new KhachHang
                {
                    MaKh = TaoMaKhachHang(),
                    HoTen = pendingRegistration.HoTen,
                    SoDienThoai = pendingRegistration.SoDienThoai,
                    Email = pendingRegistration.Email,
                    DiaChi = pendingRegistration.DiaChi,
                    NgaySinh = pendingRegistration.NgaySinh.HasValue ? DateOnly.FromDateTime(pendingRegistration.NgaySinh.Value) : null,
                    MatKhau = pendingRegistration.PasswordHash,
                    TrangThai = "Đã kích hoạt",
                    NgayTao = DateOnly.FromDateTime(DateTime.Now)
                };

                _context.KhachHangs.Add(khachHang);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                ClearPendingRegistration();

                // Send Success Email
                try
                {
                    await _emailService.SendRegisterSuccessEmailAsync(
                        khachHang.Email, 
                        khachHang.HoTen, 
                        khachHang.SoDienThoai, 
                        DateTime.Now.ToString("dd/MM/yyyy HH:mm")
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Gửi Email đăng ký thành công thất bại tới {Email}", khachHang.Email);
                }

                // Automatically sign in the user
                await SignInCustomerAsync(khachHang);

                _logger.LogInformation("Tạo tài khoản khách hàng thành công sau OTP cho {Email}", khachHang.Email);
                TempData["Success"] = "Đăng ký và xác thực OTP thành công. Chào mừng bạn!";

                // Return redirect to home
                return RedirectToAction("TrangChu", "Customers");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi tạo tài khoản sau khi OTP hợp lệ cho {Email}", pendingRegistration.Email);
                return Content("<div class='alert-danger'>Không thể hoàn tất đăng ký tài khoản do lỗi hệ thống. Vui lòng thử lại sau.</div>", "text/html");
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuiLaiOtp()
        {
            var pendingRegistration = GetPendingRegistration();
            if (pendingRegistration == null)
            {
                return Json(new { success = false, redirectUrl = Url.Action(nameof(DangKy)), message = "Phiên đăng ký đã hết hạn." });
            }

            // Check hourly limit
            if (await _otpService.IsHourlyLimitExceededAsync(pendingRegistration.Email))
            {
                return Json(new { success = false, message = "Bạn đã vượt quá giới hạn gửi OTP (tối đa 5 lần một giờ). Vui lòng thử lại sau." });
            }

            // Check resend cooldown
            var (allowed, remainingSeconds) = await _otpService.CanResendOtpAsync(pendingRegistration.Email, 60);
            if (!allowed)
            {
                return Json(new
                {
                    success = false,
                    message = $"Vui lòng chờ {remainingSeconds} giây trước khi gửi lại OTP.",
                    resendCooldownSeconds = remainingSeconds
                });
            }

            // Generate & Save
            var otp = await _otpService.GenerateOtpAsync();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var saved = await _otpService.SaveOtpAsync(pendingRegistration.Email, otp, ipAddress);
            if (!saved)
            {
                return Json(new { success = false, message = "Không thể tạo OTP mới. Vui lòng thử lại." });
            }

            // Send Email OTP
            try
            {
                await _emailService.SendOtpEmailAsync(pendingRegistration.Email, pendingRegistration.HoTen, otp);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gửi lại Email OTP thất bại tới {Email}", pendingRegistration.Email);
                await _otpService.InvalidatePreviousOtpAsync(pendingRegistration.Email);
                return Json(new { success = false, message = "Không thể gửi email chứa mã OTP mới." });
            }

            pendingRegistration.OtpSentAtUtc = DateTime.UtcNow;
            pendingRegistration.OtpExpiresAtUtc = DateTime.UtcNow.AddMinutes(5);
            SetPendingRegistration(pendingRegistration);

            _logger.LogInformation("Đã gửi lại OTP thành công tới {Email}", pendingRegistration.Email);
            return Json(new
            {
                success = true,
                message = "Mã OTP mới đã được gửi.",
                expirySeconds = 300,
                resendCooldownSeconds = 60
            });
        }
        #endregion

        /// <summary>Tự sinh mã KH001, KH002, ...</summary>
        private string TaoMaKhachHang()
        {
            var danhSachMa = _context.KhachHangs.Select(x => x.MaKh).ToList();
            int maxSo = 0;
            foreach (var ma in danhSachMa)
            {
                if (!string.IsNullOrEmpty(ma) && ma.StartsWith("KH") && ma.Length > 2)
                    if (int.TryParse(ma.Substring(2), out int so) && so > maxSo)
                        maxSo = so;
            }
            return $"KH{maxSo + 1:D3}";
        }

        private void NormalizeRegistrationModel(DangKyViewModel model)
        {
            model.HoTen = model.HoTen?.Trim() ?? string.Empty;
            model.Email = model.Email?.Trim() ?? string.Empty;
            model.TenDangNhap = string.IsNullOrWhiteSpace(model.TenDangNhap) ? model.Email : model.TenDangNhap.Trim();
            model.DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim();
            model.SoDienThoai = Regex.Replace(model.SoDienThoai ?? string.Empty, @"\s+", string.Empty);
        }

        private async Task<bool> ValidateRegistrationModelServerSideAsync(DangKyViewModel model)
        {
            var hasErrors = false;

            // 1. Email format and existence
            if (string.IsNullOrWhiteSpace(model.Email))
            {
                ModelState.AddModelError(nameof(model.Email), "Email không được để trống.");
                hasErrors = true;
            }
            else
            {
                try
                {
                    var addr = new System.Net.Mail.MailAddress(model.Email);
                    if (addr.Address != model.Email)
                    {
                        ModelState.AddModelError(nameof(model.Email), "Email không đúng định dạng.");
                        hasErrors = true;
                    }
                }
                catch
                {
                    ModelState.AddModelError(nameof(model.Email), "Email không đúng định dạng.");
                    hasErrors = true;
                }

                if (await _context.KhachHangs.AnyAsync(x => x.Email == model.Email))
                {
                    ModelState.AddModelError(nameof(model.Email), "Email này đã được đăng ký.");
                    hasErrors = true;
                }
            }

            // 2. PhoneNumber format and existence
            if (string.IsNullOrWhiteSpace(model.SoDienThoai))
            {
                ModelState.AddModelError(nameof(model.SoDienThoai), "Số điện thoại không được để trống.");
                hasErrors = true;
            }
            else if (!Regex.IsMatch(model.SoDienThoai, @"^(0[3|5|7|8|9])[0-9]{8}$"))
            {
                ModelState.AddModelError(nameof(model.SoDienThoai), "Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và đủ 10 số).");
                hasErrors = true;
            }
            else if (await _context.KhachHangs.AnyAsync(x => x.SoDienThoai == model.SoDienThoai))
            {
                ModelState.AddModelError(nameof(model.SoDienThoai), "Số điện thoại này đã được đăng ký.");
                hasErrors = true;
            }

            // 3. Username check (if provided and different from Email)
            if (!string.IsNullOrWhiteSpace(model.TenDangNhap) && model.TenDangNhap != model.Email)
            {
                if (await _context.NhanViens.AnyAsync(x => x.TenDangNhap == model.TenDangNhap))
                {
                    ModelState.AddModelError(nameof(model.TenDangNhap), "Tên đăng nhập đã tồn tại trong hệ thống.");
                    hasErrors = true;
                }
            }

            // 4. Password strength
            if (string.IsNullOrWhiteSpace(model.MatKhau))
            {
                ModelState.AddModelError(nameof(model.MatKhau), "Mật khẩu không được để trống.");
                hasErrors = true;
            }
            else
            {
                var hasNumber = new Regex(@"[0-9]+");
                var hasUpperChar = new Regex(@"[A-Z]+");
                var hasMiniMaxChars = new Regex(@".{8,}");
                var hasLowerChar = new Regex(@"[a-z]+");
                var hasSymbols = new Regex(@"[!@#$%^&*()_+=\[{\]};:<>|./?,-]+");

                if (!hasMiniMaxChars.IsMatch(model.MatKhau) || 
                    !hasUpperChar.IsMatch(model.MatKhau) || 
                    !hasLowerChar.IsMatch(model.MatKhau) || 
                    !hasNumber.IsMatch(model.MatKhau) || 
                    !hasSymbols.IsMatch(model.MatKhau))
                {
                    ModelState.AddModelError(nameof(model.MatKhau), "Mật khẩu phải tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.");
                    hasErrors = true;
                }
            }

            // 5. Password Confirmation
            if (model.MatKhau != model.XacNhanMatKhau)
            {
                ModelState.AddModelError(nameof(model.XacNhanMatKhau), "Mật khẩu xác nhận không khớp.");
                hasErrors = true;
            }

            // 6. Birthdate validation
            if (model.NgaySinh.HasValue)
            {
                var age = DateTime.Today.Year - model.NgaySinh.Value.Year;
                if (model.NgaySinh.Value > DateTime.Today)
                {
                    ModelState.AddModelError(nameof(model.NgaySinh), "Ngày sinh không được ở tương lai.");
                    hasErrors = true;
                }
                else if (age < 12 || age > 100)
                {
                    ModelState.AddModelError(nameof(model.NgaySinh), "Tuổi của bạn phải từ 12 đến 100 tuổi.");
                    hasErrors = true;
                }
            }

            return !hasErrors;
        }

        private IActionResult BuildRegistrationValidationResponse(DangKyViewModel model)
        {
            if (IsAjaxRequest())
            {
                var errors = ModelState
                    .Where(k => k.Value != null && k.Value.Errors.Any())
                    .ToDictionary(
                        k => k.Key,
                        k => k.Value!.Errors.Select(e => e.ErrorMessage).FirstOrDefault());

                return Json(new { success = false, errors });
            }

            return View(nameof(DangKy), model);
        }

        private IActionResult BuildOtpErrorResponse(DangKyViewModel model, string message)
        {
            if (IsAjaxRequest())
            {
                return Json(new { success = false, message });
            }

            ModelState.AddModelError(string.Empty, message);
            return View(nameof(DangKy), model);
        }

        private PendingRegistrationModel? GetPendingRegistration()
        {
            return HttpContext.Session.GetObject<PendingRegistrationModel>(PendingRegistrationSessionKey);
        }

        private void SetPendingRegistration(PendingRegistrationModel model)
        {
            HttpContext.Session.SetObject(PendingRegistrationSessionKey, model);
        }

        private void ClearPendingRegistration()
        {
            HttpContext.Session.Remove(PendingRegistrationSessionKey);
        }

        private NhapOtpViewModel BuildOtpViewModel(PendingRegistrationModel pendingRegistration)
        {
            var nowUtc = DateTime.UtcNow;
            var expirySeconds = Math.Max(0, (int)(pendingRegistration.OtpExpiresAtUtc - nowUtc).TotalSeconds);
            var resendCooldownSeconds = Math.Max(0, 60 - (int)(nowUtc - pendingRegistration.OtpSentAtUtc).TotalSeconds);

            return new NhapOtpViewModel
            {
                HoTen = pendingRegistration.HoTen,
                PhoneNumber = pendingRegistration.SoDienThoai,
                Email = pendingRegistration.Email,
                ExpirySeconds = expirySeconds,
                ResendCooldownSeconds = resendCooldownSeconds
            };
        }

        private bool IsAjaxRequest()
        {
            return string.Equals(Request.Headers["X-Requested-With"], "XMLHttpRequest", StringComparison.OrdinalIgnoreCase);
        }

        private async Task SignInCustomerAsync(KhachHang khachHang)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, khachHang.IdKhachHang.ToString()),
                new Claim(ClaimTypes.Name, khachHang.HoTen?.Trim() ?? string.Empty),
                new Claim(ClaimTypes.Role, "KhachHang"),
                new Claim("UserId", khachHang.IdKhachHang.ToString()),
                new Claim("HoTen", khachHang.HoTen?.Trim() ?? string.Empty),
                new Claim("VaiTro", "KhachHang")
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                new AuthenticationProperties { IsPersistent = true });

            HttpContext.Session.SetInt32("UserId", khachHang.IdKhachHang);
            HttpContext.Session.SetInt32("IdKhachHang", khachHang.IdKhachHang);
            HttpContext.Session.SetString("HoTen", khachHang.HoTen?.Trim() ?? string.Empty);
            HttpContext.Session.SetString("Role", "KhachHang");
            HttpContext.Session.SetString("VaiTro", "KhachHang");

            var guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
            if (guestLienHeId != null)
            {
                var guestLienHe = await _context.LienHes.FindAsync(guestLienHeId.Value);
                if (guestLienHe != null && guestLienHe.IdKhachHang == null)
                {
                    guestLienHe.IdKhachHang = khachHang.IdKhachHang;
                    _context.LienHes.Update(guestLienHe);
                    await _context.SaveChangesAsync();
                }

                HttpContext.Session.Remove("GuestLienHeId");
                HttpContext.Session.SetString("AutoOpenChat", "true");
            }
        }

        // ===================== ĐĂNG NHẬP =====================

        [HttpGet]
        public IActionResult DangNhap(string? returnUrl = null)
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("UserId");
                if (int.TryParse(userIdClaim, out int parsedId))
                {
                    HttpContext.Session.SetInt32("UserId", parsedId);
                    HttpContext.Session.SetInt32("IdKhachHang", parsedId);
                }
                var nameClaim = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("HoTen");
                if (!string.IsNullOrEmpty(nameClaim))
                {
                    HttpContext.Session.SetString("HoTen", nameClaim);
                }

                var role = User.FindFirstValue(ClaimTypes.Role) ?? HttpContext.Session.GetString("Role");
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }
                if (role == "Admin" || role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
                {
                    return RedirectToAction("Dashboard", "Staff");
                }
                else
                {
                    return RedirectToAction("TrangChu", "Customers");
                }
            }
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DangNhap(DangNhapViewModel model, string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            string taiKhoan = model.TenDangNhap?.Trim() ?? "";
            string matKhau = model.MatKhau;

            _logger.LogInformation("Bắt đầu xử lý đăng nhập. Tài khoản nhập: {TaiKhoan}", taiKhoan);

            // ==========================================
            // 1. KIỂM TRA NHÂN VIÊN (Email hoặc Tên đăng nhập)
            // ==========================================
            var nhanVien = await _context.NhanViens
                .FirstOrDefaultAsync(x => x.Email == taiKhoan || x.TenDangNhap == taiKhoan);

            if (nhanVien != null)
            {
                _logger.LogInformation("Tìm thấy nhân viên. ID: {Id}, Vai trò: {VaiTro}, Trạng thái: {TrangThai}", 
                    nhanVien.IdNhanVien, nhanVien.VaiTro, nhanVien.TrangThai);

                bool dungMatKhau = false;
                try
                {
                    string dbHash = nhanVien.MatKhau?.Trim() ?? "";
                    if (dbHash.StartsWith("$2a$") || dbHash.StartsWith("$2b$") || dbHash.StartsWith("$2y$"))
                    {
                        dungMatKhau = BCrypt.Net.BCrypt.Verify(matKhau, dbHash);
                    }
                    else
                    {
                        dungMatKhau = dbHash == matKhau;
                    }
                    _logger.LogInformation("Kết quả xác thực mật khẩu nhân viên: {DungMatKhau}", dungMatKhau);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi xác thực mật khẩu nhân viên. Sử dụng so sánh trực tiếp làm fallback.");
                    dungMatKhau = nhanVien.MatKhau == matKhau;
                }

                if (!dungMatKhau)
                {
                    _logger.LogWarning("Mật khẩu nhân viên không chính xác.");
                    ModelState.AddModelError(string.Empty, "Email/Số điện thoại hoặc mật khẩu không đúng.");
                    return View(model);
                }

                var trangThai = nhanVien.TrangThai?.Trim() ?? "";
                if (trangThai == "Khóa" || trangThai == "Đã khóa" || trangThai == "Tạm khóa" || trangThai == "Ngừng hoạt động")
                {
                    _logger.LogWarning("Tài khoản nhân viên bị khóa. Trạng thái: {TrangThai}", trangThai);
                    ModelState.AddModelError(string.Empty, "Tài khoản của bạn đã bị khóa.");
                    return View(model);
                }

                // Đăng nhập thành công -> Tạo Claims
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, nhanVien.IdNhanVien.ToString()),
                    new Claim(ClaimTypes.Name, nhanVien.HoTen?.Trim() ?? ""),
                    new Claim(ClaimTypes.Role, nhanVien.VaiTro?.Trim() ?? ""),
                    new Claim("UserId", nhanVien.IdNhanVien.ToString()),
                    new Claim("HoTen", nhanVien.HoTen?.Trim() ?? ""),
                    new Claim("VaiTro", nhanVien.VaiTro?.Trim() ?? "")
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties { IsPersistent = model.RememberMe };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                // Lưu Session
                HttpContext.Session.SetInt32("UserId", nhanVien.IdNhanVien);
                HttpContext.Session.SetString("HoTen", nhanVien.HoTen?.Trim() ?? "");
                HttpContext.Session.SetString("VaiTro", nhanVien.VaiTro?.Trim() ?? "");
                HttpContext.Session.SetString("Role", nhanVien.VaiTro?.Trim() ?? "");

                _logger.LogInformation("Nhân viên đăng nhập thành công. Điều hướng về Dashboard.");

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }
                return RedirectToAction("Dashboard", "Staff");
            }

            // ==========================================
            // 2. KIỂM TRA KHÁCH HÀNG (Email hoặc Số điện thoại)
            // ==========================================
            var khachHang = await _context.KhachHangs
                .FirstOrDefaultAsync(x => x.Email == taiKhoan || x.SoDienThoai == taiKhoan);

            if (khachHang != null)
            {
                _logger.LogInformation("Tìm thấy khách hàng. ID: {Id}, Trạng thái: {TrangThai}", 
                    khachHang.IdKhachHang, khachHang.TrangThai);

                bool dungMatKhau = false;
                try
                {
                    string dbHash = khachHang.MatKhau?.Trim() ?? "";
                    if (dbHash.StartsWith("$2a$") || dbHash.StartsWith("$2b$") || dbHash.StartsWith("$2y$"))
                    {
                        dungMatKhau = BCrypt.Net.BCrypt.Verify(matKhau, dbHash);
                    }
                    else
                    {
                        dungMatKhau = dbHash == matKhau;
                    }
                    _logger.LogInformation("Kết quả xác thực mật khẩu khách hàng: {DungMatKhau}", dungMatKhau);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi xác thực mật khẩu khách hàng. Sử dụng so sánh trực tiếp làm fallback.");
                    dungMatKhau = khachHang.MatKhau == matKhau;
                }

                if (!dungMatKhau)
                {
                    _logger.LogWarning("Mật khẩu khách hàng không chính xác.");
                    ModelState.AddModelError(string.Empty, "Email/Số điện thoại hoặc mật khẩu không đúng.");
                    return View(model);
                }

                var trangThai = khachHang.TrangThai?.Trim() ?? "";
                if (trangThai == "Chờ xác thực")
                {
                    _logger.LogWarning("Tài khoản khách hàng chưa xác thực.");
                    ModelState.AddModelError(string.Empty, "Tài khoản của bạn chưa được xác thực qua OTP.");
                    return View(model);
                }
                if (trangThai == "Khóa" || trangThai == "Đã khóa" || trangThai == "Tạm khóa" || trangThai == "Ngừng hoạt động")
                {
                    _logger.LogWarning("Tài khoản khách hàng bị khóa. Trạng thái: {TrangThai}", trangThai);
                    ModelState.AddModelError(string.Empty, "Tài khoản của bạn đã bị khóa.");
                    return View(model);
                }

                // Đăng nhập thành công -> Tạo Claims
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, khachHang.IdKhachHang.ToString()),
                    new Claim(ClaimTypes.Name, khachHang.HoTen?.Trim() ?? ""),
                    new Claim(ClaimTypes.Role, "KhachHang"),
                    new Claim("UserId", khachHang.IdKhachHang.ToString()),
                    new Claim("HoTen", khachHang.HoTen?.Trim() ?? ""),
                    new Claim("VaiTro", "KhachHang")
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties { IsPersistent = model.RememberMe };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                // Lưu Session
                HttpContext.Session.SetInt32("UserId", khachHang.IdKhachHang);
                HttpContext.Session.SetInt32("IdKhachHang", khachHang.IdKhachHang);
                HttpContext.Session.SetString("HoTen", khachHang.HoTen?.Trim() ?? "");
                HttpContext.Session.SetString("Role", "KhachHang");
                HttpContext.Session.SetString("VaiTro", "KhachHang");

                // Migrate guest chat conversation to this logged-in account
                var guestLienHeId = HttpContext.Session.GetInt32("GuestLienHeId");
                if (guestLienHeId != null)
                {
                    var guestLienHe = await _context.LienHes.FindAsync(guestLienHeId.Value);
                    if (guestLienHe != null && guestLienHe.IdKhachHang == null)
                    {
                        guestLienHe.IdKhachHang = khachHang.IdKhachHang;
                        _context.LienHes.Update(guestLienHe);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Migrated guest conversation {IdLienHe} to customer {IdKhachHang} during login", guestLienHe.IdLienHe, khachHang.IdKhachHang);
                    }
                    HttpContext.Session.Remove("GuestLienHeId");
                    HttpContext.Session.SetString("AutoOpenChat", "true");
                }

                _logger.LogInformation("Khách hàng đăng nhập thành công. Điều hướng về Trang chủ khách hàng.");

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    // If returnUrl has query string, append autoOpen=true or handle it
                    var redirectUrl = returnUrl;
                    if (!redirectUrl.Contains("openChat="))
                    {
                        redirectUrl = redirectUrl.Contains("?") ? $"{redirectUrl}&openChat=true" : $"{redirectUrl}?openChat=true";
                    }
                    return Redirect(redirectUrl);
                }
                return RedirectToAction("TrangChu", "Customers", new { openChat = true });
            }

            _logger.LogWarning("Không tìm thấy tài khoản khớp với thông tin nhập: {TaiKhoan}", taiKhoan);

            // 3. Sai tài khoản / mật khẩu
            ModelState.AddModelError(string.Empty, "Email/Số điện thoại hoặc mật khẩu không đúng.");
            return View(model);
        }



        // ===================== ĐĂNG XUẤT =====================

        [HttpGet]
        public async Task<IActionResult> DangXuat()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            return RedirectToAction("TrangChu", "Customers");
        }

        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            return RedirectToAction("TrangChu", "Customers");
        }

        [HttpGet]
        public IActionResult AccessDenied()
        {
            return View();
        }


        
        // ===================== QUÊN MẬT KHẨU =====================

        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(SupportTicketSysterm.ViewModels.ForgotPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var (success, message) = await _authService.ForgotPasswordAsync(model.Email, ipAddress);

            if (!success)
            {
                ModelState.AddModelError(string.Empty, message);
                return View(model);
            }

            TempData["SuccessMessage"] = message;
            return RedirectToAction(nameof(VerifyOtp), new { email = model.Email });
        }

        [HttpGet]
        public IActionResult VerifyOtp(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return RedirectToAction(nameof(ForgotPassword));
            }

            var model = new SupportTicketSysterm.ViewModels.VerifyOtpViewModel
            {
                Email = email
            };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyOtp(SupportTicketSysterm.ViewModels.VerifyOtpViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var (success, message) = await _authService.VerifyForgotPasswordOtpAsync(model.Email, model.OtpCode);

            if (!success)
            {
                ModelState.AddModelError(string.Empty, message);
                return View(model);
            }

            TempData["SuccessMessage"] = "Xác thực mã OTP thành công. Vui lòng thiết lập mật khẩu mới.";
            return RedirectToAction(nameof(ResetPassword), new { email = model.Email, otpCode = model.OtpCode });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuiLaiOtpForgotPassword(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return Json(new { success = false, message = "Email không hợp lệ." });
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var (success, message) = await _authService.ForgotPasswordAsync(email, ipAddress);

            return Json(new { success, message });
        }

        [HttpGet]
        public IActionResult ResetPassword(string email, string otpCode)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(otpCode))
            {
                return RedirectToAction(nameof(ForgotPassword));
            }

            var model = new SupportTicketSysterm.ViewModels.ResetPasswordViewModel
            {
                Email = email,
                OtpCode = otpCode
            };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(SupportTicketSysterm.ViewModels.ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var (success, message) = await _authService.ResetPasswordAsync(model.Email, model.OtpCode, model.NewPassword);

            if (!success)
            {
                ModelState.AddModelError(string.Empty, message);
                return View(model);
            }

            TempData["Success"] = "Khôi phục mật khẩu tài khoản thành công. Vui lòng đăng nhập bằng mật khẩu mới.";
            return RedirectToAction(nameof(DangNhap));
        }



    }
}
