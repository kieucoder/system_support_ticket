using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using System.Security.Claims;

namespace SupportTicketSysterm.Controllers
{
    [Route("Customers")]
    [Route("KhachHang")]
    public class CustomersController : Controller
    {
        public readonly TechSupportContext _context;

        public CustomersController(TechSupportContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Route("")]
        [Route("TrangChu")]
        [AllowAnonymous]
        public IActionResult TrangChu()
        {
            return View();
        }


        [HttpGet]
        [Route("ThongTinCaNhan")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> ThongTinCaNhan()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdStr, out int id))
                {
                    userId = id;
                }
            }

            if (userId == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            var customer = await _context.KhachHangs
                .FirstOrDefaultAsync(x => x.IdKhachHang == userId);

            if (customer == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            // Phiếu hỗ trợ — Include đầy đủ dịch vụ và nhân viên phụ trách
            var tickets = await _context.PhieuHoTros
                .Include(p => p.IdDichVuNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Where(p => p.IdKhachHang == userId)
                .OrderByDescending(p => p.NgayTao)
                .ToListAsync();

            // Lịch hẹn — Include nhân viên và phiếu liên quan
            var appointments = await _context.LichHens
                .Include(a => a.IdNhanVienNavigation)
                .Include(a => a.IdPhieuNavigation)
                    .ThenInclude(p => p!.IdDichVuNavigation)
                .Where(a => a.IdPhieuNavigation != null
                         && a.IdPhieuNavigation!.IdKhachHang == userId)
                .OrderByDescending(a => a.NgayHen)
                .ToListAsync();

            var viewModel = new KhachHangViewModel
            {
                IdKhachHang  = customer.IdKhachHang,
                MaKh         = customer.MaKh,
                HoTen        = customer.HoTen,
                SoDienThoai  = customer.SoDienThoai,
                Email        = customer.Email,
                DiaChi       = customer.DiaChi,
                TrangThai    = customer.TrangThai,
                TenDangNhap  = customer.Email,
                NgayTao      = customer.NgayTao,
                NgaySinh     = customer.NgaySinh,
                DanhSachPhieu    = tickets,
                DanhSachLichHen  = appointments
            };

            return View(viewModel);
        }

        [HttpPost]
        [Route("CapNhatThongTin")]
        [Authorize(Roles = "KhachHang")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CapNhatThongTin(KhachHangViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                    return Json(new { success = false, message = errors });
                }

                var userId = HttpContext.Session.GetInt32("UserId");
                if (userId == null)
                {
                    var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (int.TryParse(userIdStr, out int id))
                    {
                        userId = id;
                    }
                }

                if (userId == null)
                {
                    return Json(new { success = false, message = "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn." });
                }

                var customer = await _context.KhachHangs.FirstOrDefaultAsync(x => x.IdKhachHang == userId);
                if (customer == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy thông tin khách hàng." });
                }

                // Check duplicate Email
                if (!string.IsNullOrWhiteSpace(model.Email))
                {
                    var emailLower = model.Email.Trim().ToLower();
                    var duplicateEmail = await _context.KhachHangs.AnyAsync(x => x.IdKhachHang != userId && x.Email != null && x.Email.ToLower() == emailLower);
                    if (duplicateEmail)
                    {
                        return Json(new { success = false, message = "Email này đã được sử dụng bởi một tài khoản khác." });
                    }
                }

                // Check duplicate Phone Number
                var phoneTrimmed = model.SoDienThoai.Trim();
                var duplicatePhone = await _context.KhachHangs.AnyAsync(x => x.IdKhachHang != userId && x.SoDienThoai == phoneTrimmed);
                if (duplicatePhone)
                {
                    return Json(new { success = false, message = "Số điện thoại này đã được sử dụng bởi một tài khoản khác." });
                }

                // Update only allowed fields
                customer.HoTen = model.HoTen.Trim();
                customer.SoDienThoai = phoneTrimmed;
                customer.Email = model.Email?.Trim();
                customer.DiaChi = model.DiaChi?.Trim();

                _context.KhachHangs.Update(customer);
                await _context.SaveChangesAsync();

                // Update session info
                HttpContext.Session.SetString("HoTen", customer.HoTen);

                return Json(new { success = true, message = "Cập nhật thông tin thành công." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DoiMatKhau([FromBody] DoiMatKhauViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new
                {
                    success = false,
                    message = "Dữ liệu không hợp lệ."
                });
            }

            // Lấy Id khách hàng đang đăng nhập
            int? idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");

            if (idKhachHang == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Phiên đăng nhập đã hết."
                });
            }

            var khachHang = await _context.KhachHangs
                .FirstOrDefaultAsync(x => x.IdKhachHang == idKhachHang);

            if (khachHang == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy khách hàng."
                });
            }

            // Kiểm tra mật khẩu cũ
            bool checkPassword = BCrypt.Net.BCrypt.Verify(
                model.MatKhauCu,
                khachHang.MatKhau);

            if (!checkPassword)
            {
                return Json(new
                {
                    success = false,
                    message = "Mật khẩu hiện tại không đúng."
                });
            }

            // Không cho trùng mật khẩu cũ
            if (model.MatKhauCu == model.MatKhauMoi)
            {
                return Json(new
                {
                    success = false,
                    message = "Mật khẩu mới phải khác mật khẩu cũ."
                });
            }

            // Hash mật khẩu mới
            khachHang.MatKhau = BCrypt.Net.BCrypt.HashPassword(model.MatKhauMoi);

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Đổi mật khẩu thành công."
            });
        }




    }
}
