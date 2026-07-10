using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;

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
                Email       = model.Email?.Trim(),
                DiaChi      = model.DiaChi?.Trim(),
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
        public IActionResult DangNhap()
        {
            return View();
        }

        [HttpPost]
        public IActionResult DangNhap(DangNhapViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            // Tìm khách hàng
            var khachHang = _context.KhachHangs
                .FirstOrDefault(x => x.TenDangNhap == model.TaiKhoan || x.SoDienThoai == model.TaiKhoan);

            if (khachHang != null && khachHang.MatKhau == model.MatKhau)
            {
                HttpContext.Session.SetString("Role", "KhachHang");
                HttpContext.Session.SetInt32("IdKhachHang", khachHang.IdKhachHang);
                return RedirectToAction("Dashboard", "KhachHang");
            }

            // Tìm nhân viên
            var nhanVien = _context.NhanViens
                .FirstOrDefault(x => x.TenDangNhap == model.TaiKhoan || x.SoDienThoai == model.TaiKhoan);

            if (nhanVien != null && nhanVien.MatKhau == model.MatKhau)
            {
                HttpContext.Session.SetString("Role", nhanVien.VaiTro);
                HttpContext.Session.SetInt32("IdNhanVien", nhanVien.IdNhanVien);

                return nhanVien.VaiTro == "Admin"
                    ? RedirectToAction("Dashboard", "Admin")
                    : RedirectToAction("Dashboard", "Staff");
            }

            ViewBag.Error = "Tên đăng nhập hoặc mật khẩu không đúng.";
            return View(model);
        }

        // ===================== ĐĂNG XUẤT =====================

        public IActionResult DangXuat()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("DangNhap", "Auth");
        }
    }
}
