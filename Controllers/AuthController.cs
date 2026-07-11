using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;

namespace SupportTicketSysterm.Controllers
{
    public class AuthController : Controller
    {
        private readonly TechSupportContext _context;

        public AuthController(TechSupportContext context)
        {
            _context = context;
        }

        // ===================== ĐĂNG KÝ =====================

        [HttpGet]
        public IActionResult DangKy()
        {
            return View();
        }

        [HttpPost]
        // Bỏ [ValidateAntiForgeryToken] để AJAX FormData không bị block 400
        public async Task<IActionResult> DangKy(DangKyViewModel model)
        {
            bool isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";

            // --- Bước 1: Kiểm tra ModelState ---
            if (!ModelState.IsValid)
            {
                if (isAjax)
                {
                    var errors = ModelState
                        .Where(k => k.Value != null && k.Value.Errors.Any())
                        .ToDictionary(
                            k => k.Key,
                            k => k.Value!.Errors.Select(e => e.ErrorMessage).FirstOrDefault()
                        );
                    return Json(new { success = false, errors });
                }
                return View(model);
            }

            // --- Bước 2: Kiểm tra trùng lặp ---
            bool usernameExists = await _context.KhachHangs
                .AnyAsync(x => x.TenDangNhap == model.TenDangNhap.Trim());
            if (usernameExists)
                ModelState.AddModelError("TenDangNhap", "Tên đăng nhập đã tồn tại trong hệ thống.");

            bool phoneExists = await _context.KhachHangs
                .AnyAsync(x => x.SoDienThoai == model.SoDienThoai.Trim());
            if (phoneExists)
                ModelState.AddModelError("SoDienThoai", "Số điện thoại đã tồn tại trong hệ thống.");

            if (!string.IsNullOrWhiteSpace(model.Email))
            {
                var emailTrimmed = model.Email.Trim().ToLower();
                bool emailExists = await _context.KhachHangs
                    .AnyAsync(x => x.Email != null && x.Email.Trim().ToLower() == emailTrimmed);
                if (emailExists)
                    ModelState.AddModelError("Email", "Địa chỉ email này đã được sử dụng.");
            }

            if (!ModelState.IsValid)
            {
                if (isAjax)
                {
                    var errors = ModelState
                        .Where(k => k.Value != null && k.Value.Errors.Any())
                        .ToDictionary(
                            k => k.Key,
                            k => k.Value!.Errors.Select(e => e.ErrorMessage).FirstOrDefault()
                        );
                    return Json(new { success = false, errors });
                }
                return View(model);
            }

            // --- Bước 3: Tạo và lưu vào SQL Server ---
            var khachHang = new KhachHang
            {
                MaKh        = TaoMaKhachHang(),
                HoTen       = model.HoTen.Trim(),
                SoDienThoai = model.SoDienThoai.Trim(),
                Email       = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim(),
                DiaChi      = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim(),
                NgaySinh    = model.NgaySinh,
                TenDangNhap = model.TenDangNhap.Trim(),
                MatKhau     = model.MatKhau,
                TrangThai   = "Hoạt động",
                NgayTao     = DateOnly.FromDateTime(DateTime.Now)
            };

            try
            {
                _context.KhachHangs.Add(khachHang);
                await _context.SaveChangesAsync();

                if (isAjax)
                    return Json(new { success = true, message = "Đăng ký tài khoản thành công!" });

                TempData["DangKyThanhCong"] = "Đăng ký tài khoản thành công! Vui lòng đăng nhập.";
                return RedirectToAction("DangNhap", "Auth");
            }
            catch (Exception ex)
            {
                var errMsg = ex.InnerException?.Message ?? ex.Message;
                if (isAjax)
                    return Json(new { success = false, message = "Lỗi hệ thống: " + errMsg });

                ModelState.AddModelError(string.Empty, "Lỗi hệ thống: " + errMsg);
                return View(model);
            }
        }

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

        // ===================== ĐĂNG NHẬP =====================

        [HttpGet]
        public IActionResult DangNhap(string? returnUrl = null)
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? HttpContext.Session.GetString("Role");
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }
                if (role == "Admin" || role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
                {
                    return RedirectToAction("Dashboard", "Staff");
                }
                else if (role == "KhachHang")
                {
                    return RedirectToAction("TrangChu", "KhachHang");
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

            var username = model.TenDangNhap?.Trim();
            var password = model.MatKhau;

            // 1. Kiểm tra trong bảng Nhân viên
            var nhanVien = await _context.NhanViens
                .FirstOrDefaultAsync(x => x.TenDangNhap == username && x.MatKhau == password);

            if (nhanVien != null)
            {
                var trangThai = nhanVien.TrangThai?.Trim();
                var hoTenTrimmed = nhanVien.HoTen?.Trim() ?? "";
                var vaiTroTrimmed = nhanVien.VaiTro?.Trim() ?? "";

                // Kiểm tra trạng thái hoạt động
                if (trangThai == "Khóa" || trangThai == "Ngừng hoạt động" || trangThai == "Tạm khóa" || trangThai == "Đã khóa")
                {
                    ModelState.AddModelError(string.Empty, "Tài khoản của bạn đã bị khóa.");
                    return View(model);
                }

                // Thiết lập Claims cho Cookie Authentication
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, nhanVien.IdNhanVien.ToString()),
                    new Claim(ClaimTypes.Name, hoTenTrimmed),
                    new Claim(ClaimTypes.Role, vaiTroTrimmed),
                    new Claim("UserId", nhanVien.IdNhanVien.ToString()),
                    new Claim("HoTen", hoTenTrimmed),
                    new Claim("VaiTro", vaiTroTrimmed)
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe
                };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                // Lưu thông tin vào Session để hiển thị
                HttpContext.Session.SetInt32("UserId", nhanVien.IdNhanVien);
                HttpContext.Session.SetString("HoTen", hoTenTrimmed);
                HttpContext.Session.SetString("Role", vaiTroTrimmed);
                HttpContext.Session.SetString("VaiTro", vaiTroTrimmed);

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }
                return RedirectToAction("Dashboard", "Staff");
            }

            // 2. Kiểm tra trong bảng Khách hàng
            var khachHang = await _context.KhachHangs
                .FirstOrDefaultAsync(x => x.TenDangNhap == username && x.MatKhau == password);

            if (khachHang != null)
            {
                var trangThai = khachHang.TrangThai?.Trim();
                var hoTenTrimmed = khachHang.HoTen?.Trim() ?? "";

                // Kiểm tra trạng thái hoạt động
                if (trangThai == "Khóa" || trangThai == "Ngừng hoạt động" || trangThai == "Tạm khóa" || trangThai == "Đã khóa")
                {
                    ModelState.AddModelError(string.Empty, "Tài khoản của bạn đã bị khóa.");
                    return View(model);
                }

                // Thiết lập Claims cho Cookie Authentication
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, khachHang.IdKhachHang.ToString()),
                    new Claim(ClaimTypes.Name, hoTenTrimmed),
                    new Claim(ClaimTypes.Role, "KhachHang"),
                    new Claim("UserId", khachHang.IdKhachHang.ToString()),
                    new Claim("HoTen", hoTenTrimmed),
                    new Claim("VaiTro", "KhachHang")
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe
                };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                // Lưu thông tin vào Session để hiển thị
                HttpContext.Session.SetInt32("UserId", khachHang.IdKhachHang);
                HttpContext.Session.SetString("HoTen", hoTenTrimmed);
                HttpContext.Session.SetString("Role", "KhachHang");
                HttpContext.Session.SetString("VaiTro", "KhachHang");

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }
                return RedirectToAction("TrangChu", "KhachHang");
            }

            // 3. Sai tài khoản / mật khẩu
            ModelState.AddModelError(string.Empty, "Tên đăng nhập hoặc mật khẩu không chính xác.");
            return View(model);
        }

        // ===================== ĐĂNG XUẤT =====================

        [HttpGet]
        public async Task<IActionResult> DangXuat()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}
