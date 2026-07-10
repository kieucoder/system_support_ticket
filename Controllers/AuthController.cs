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
        public IActionResult DangKy()
        {
            return View();
        }

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

            if (khachHang != null)
            {
                if (khachHang.MatKhau == model.MatKhau)
                {
                    HttpContext.Session.SetString("Role", "KhachHang");
                    HttpContext.Session.SetInt32("IdKhachHang", khachHang.IdKhachHang);

                    return RedirectToAction("Dashboard", "KhachHang");
                }
            }

            // Tìm nhân viên
            var nhanVien = _context.NhanViens
                .FirstOrDefault(x => x.TenDangNhap == model.TaiKhoan || x.SoDienThoai == model.TaiKhoan);

            if (nhanVien != null)
            {
                if (nhanVien.MatKhau == model.MatKhau)
                {
                    HttpContext.Session.SetString("Role", nhanVien.VaiTro);
                    HttpContext.Session.SetInt32("IdNhanVien", nhanVien.IdNhanVien);

                    if (nhanVien.VaiTro == "Admin")
                        return RedirectToAction("Dashboard", "Admin");

                    return RedirectToAction("Dashboard", "Staff");
                }
            }

            ViewBag.Error = "Tên đăng nhập hoặc mật khẩu không đúng.";

            return View(model);
        }


    }
}
