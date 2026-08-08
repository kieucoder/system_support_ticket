using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using Microsoft.AspNetCore.Authorization;
using SupportTicketSysterm.Models;
using Microsoft.CodeAnalysis.Scripting;
using SupportTicketSysterm.ViewModels;
using System.Security.Claims;

using SupportTicketSysterm.Services;
using SupportTicketSysterm.Models.ViewModels;

using Microsoft.AspNetCore.Identity;

namespace SupportTicketSysterm.Controllers
{
    [Authorize(Roles = "Admin,NhanVien,Nhân viên,Nhân viên hỗ trợ")]
    public class StaffController : Controller
    {
        private readonly TechSupportContext _context;
        private readonly IDashboardService _dashboardService;
        private readonly IDanhGiaService _danhGiaService;
        private readonly ILichHenService _lichHenService;
        private readonly IPasswordHasher<KhachHang> _khachHangPasswordHasher;
        private readonly IPasswordHasher<NhanVien> _nhanVienPasswordHasher;

        public StaffController(
            TechSupportContext context,
            IDashboardService dashboardService,
            IDanhGiaService danhGiaService,
            ILichHenService lichHenService,
            IPasswordHasher<KhachHang> khachHangPasswordHasher,
            IPasswordHasher<NhanVien> nhanVienPasswordHasher)
        {
            _context = context;
            _dashboardService = dashboardService;
            _danhGiaService = danhGiaService;
            _lichHenService = lichHenService;
            _khachHangPasswordHasher = khachHangPasswordHasher;
            _nhanVienPasswordHasher = nhanVienPasswordHasher;
        }


        private (int? UserId, string Role) GetStaffSessionInfo()
        {
            var userId = HttpContext.Session.GetInt32("IdNhanVien") 
                      ?? HttpContext.Session.GetInt32("UserId") 
                      ?? HttpContext.Session.GetInt32("NhanVienId");

            if (!userId.HasValue && User?.Identity?.IsAuthenticated == true)
            {
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(idClaim, out int parsedId)) userId = parsedId;
            }

            var role = HttpContext.Session.GetString("Role") 
                    ?? User?.FindFirst(ClaimTypes.Role)?.Value 
                    ?? "NhanVien";

            return (userId, role);
        }

        public async Task<IActionResult> Dashboard()
        {
            var (userId, role) = GetStaffSessionInfo();
            var model = await _dashboardService.GetDashboardDataAsync(userId, role);
            return View(model);
        }



        [Authorize(Roles = "Admin,Quản trị viên,AdminManager")]
        [HttpGet]
        public IActionResult QuanLyDanhMuc(
            string keyword,
            string status,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.DanhMucs.AsQueryable();

            //==========================
            // Tìm kiếm
            //==========================
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.TenDanhMuc.Contains(keyword));
            }

            //==========================
            // Lọc trạng thái
            //==========================
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.TrangThai == status);
            }

            //==========================
            // Sắp xếp
            //==========================
            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;

                case "az":
                    query = query.OrderBy(x => x.TenDanhMuc);
                    break;

                case "za":
                    query = query.OrderByDescending(x => x.TenDanhMuc);
                    break;

                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            int totalItems = query.Count();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            var today = DateOnly.FromDateTime(DateTime.Today);
            var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);

            ViewBag.TotalCategories = _context.DanhMucs.Count();
            ViewBag.ActiveCategories = _context.DanhMucs.Count(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động");
            ViewBag.InactiveCategories = ViewBag.TotalCategories - ViewBag.ActiveCategories;
            ViewBag.NewThisMonth = _context.DanhMucs.Count(x => x.NgayTao != null && x.NgayTao >= firstDayOfMonth);

            ViewBag.Keyword = keyword;
            ViewBag.Status = status;
            ViewBag.Sort = sort;

            return View(items);
        }

        [HttpGet]
        public IActionResult DanhSachDanhMuc(
            string keyword,
            string status,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.DanhMucs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.TenDanhMuc.Contains(keyword));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.TrangThai == status);
            }

            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;
                case "az":
                    query = query.OrderBy(x => x.TenDanhMuc);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.TenDanhMuc);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            int totalItems = query.Count();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            return PartialView("_DanhSachDanhMuc", items);
        }

        [HttpGet]
        public IActionResult ThongKeDanhMuc()
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);

            ViewBag.TotalCategories = _context.DanhMucs.Count();
            ViewBag.ActiveCategories = _context.DanhMucs.Count(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động");
            ViewBag.InactiveCategories = ViewBag.TotalCategories - ViewBag.ActiveCategories;
            ViewBag.NewThisMonth = _context.DanhMucs.Count(x => x.NgayTao != null && x.NgayTao >= firstDayOfMonth);

            return PartialView("_ThongKeDanhMuc");
        }

        //Thêm Danh Mục
        [HttpGet]
        public IActionResult ThemDanhMuc()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ThemDanhMuc(DanhMuc model)
        {
            ModelState.Remove("DichVus");

            if (ModelState.IsValid)
            {
                model.NgayTao = DateOnly.FromDateTime(DateTime.Now);
                _context.DanhMucs.Add(model);
                _context.SaveChanges();

                return Json(new { success = true, message = "✔ Thêm danh mục thành công" });
            }

            var errorList = new List<string>();
            foreach (var val in ModelState.Values)
            {
                foreach (var error in val.Errors)
                {
                    errorList.Add(error.ErrorMessage);
                }
            }
            return Json(new { success = false, message = "Không thể thêm danh mục: " + string.Join("; ", errorList) });
        }

        //Sửa Danh Mục
        [HttpGet]
        public IActionResult SuaDanhMuc(int id)
        {
            var danhMuc = _context.DanhMucs.Find(id);
            if (danhMuc == null)
            {
                return NotFound();
            }
            return Json(danhMuc);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult SuaDanhMuc(DanhMuc model)
        {
            ModelState.Remove("DichVus");

            if (ModelState.IsValid)
            {
                var danhMuc = _context.DanhMucs.Find(model.IdDanhMuc);
                if (danhMuc == null)
                {
                    return Json(new { success = false, message = "Danh mục không tồn tại." });
                }

                danhMuc.TenDanhMuc = model.TenDanhMuc;
                danhMuc.MoTa = model.MoTa;
                danhMuc.TrangThai = model.TrangThai;

                if (danhMuc.TrangThai == "Tạm khóa")
                {
                    var childServices = _context.DichVus.Where(x => x.IdDanhMuc == model.IdDanhMuc).ToList();
                    foreach (var svc in childServices)
                    {
                        svc.TrangThai = "Tạm khóa";
                    }
                }

                _context.SaveChanges();

                return Json(new { success = true, message = "✔ Cập nhật danh mục thành công" });
            }

            var errorList = new List<string>();
            foreach (var val in ModelState.Values)
            {
                foreach (var error in val.Errors)
                {
                    errorList.Add(error.ErrorMessage);
                }
            }
            return Json(new { success = false, message = "Không thể cập nhật danh mục: " + string.Join("; ", errorList) });
        }

        //Xóa Danh Mục
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult XoaDanhMuc(int id)
        {
            var danhMuc = _context.DanhMucs.Find(id);
            if (danhMuc == null)
            {
                return Json(new { success = false, message = "Danh mục không tồn tại." });
            }

            if (_context.DichVus.Any(x => x.IdDanhMuc == id))
            {
                return Json(new { success = false, message = "Không thể xóa danh mục vì đã có dữ liệu dịch vụ liên kết." });
            }

            try
            {
                _context.DanhMucs.Remove(danhMuc);
                _context.SaveChanges();
                return Json(new { success = true, message = "✔ Xóa danh mục thành công" });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Có lỗi xảy ra trong quá trình xóa." });
            }
        }

        //Khóa/Mở khóa Danh Mục
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult KhoaDanhMuc(int id)
        {
            var model = _context.DanhMucs.Find(id);
            if (model == null)
            {
                return Json(new { success = false, message = "Danh mục không tồn tại." });
            }

            var isActive = model.TrangThai == "Hoạt động" || model.TrangThai == "Hoạt Động";
            model.TrangThai = isActive ? "Tạm khóa" : "Hoạt động";

            if (model.TrangThai == "Tạm khóa")
            {
                var childServices = _context.DichVus.Where(x => x.IdDanhMuc == id).ToList();
                foreach (var svc in childServices)
                {
                    svc.TrangThai = "Tạm khóa";
                }
            }

            _context.SaveChanges();

            var msg = model.TrangThai == "Tạm khóa" ? "✔ Khóa danh mục thành công" : "✔ Mở khóa thành công";
            return Json(new { success = true, message = msg, newStatus = model.TrangThai });
        }



        //Quản lý khách hàng 
        [HttpGet]
        [Route("Staff/QuanLyKH")]
        public IActionResult QuanLyKH(string keyword,
            string status,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
        {
            string vaiTro = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("VaiTro") ?? "";
            bool canManage = vaiTro.Equals("Admin", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Quản trị viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("NhanVien", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên hỗ trợ", StringComparison.OrdinalIgnoreCase);
            ViewBag.IsAdmin = canManage;
            ViewBag.CanManageCustomers = canManage;

            var query = _context.KhachHangs.AsQueryable();

            // Tìm kiếm (tên, số điện thoại, email)
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.HoTen.Contains(keyword)
                                      || (x.SoDienThoai != null && x.SoDienThoai.Contains(keyword))
                                      || (x.Email != null && x.Email.Contains(keyword)));
            }

            // Lọc trạng thái (bỏ qua nếu chọn "Tất cả" - all)
            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.TrangThai == status);
            }

            // Sắp xếp
            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;

                case "az":
                    query = query.OrderBy(x => x.HoTen);
                    break;

                case "za":
                    query = query.OrderByDescending(x => x.HoTen);
                    break;

                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            int totalItems = query.Count();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var today = DateOnly.FromDateTime(DateTime.Today);
            var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);

            ViewBag.TotalCustomers = _context.KhachHangs.Count();
            ViewBag.ActiveCustomers = _context.KhachHangs.Count(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động");
            ViewBag.InactiveCustomers = ViewBag.TotalCustomers - ViewBag.ActiveCustomers;
            ViewBag.NewThisMonth = _context.KhachHangs.Count(x => x.NgayTao != null && x.NgayTao >= firstDayOfMonth);

            ViewBag.Keyword = keyword;
            ViewBag.Status = status;
            ViewBag.Sort = sort;

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            return View(items);
        }

        [HttpGet]
        [Route("Staff/DanhSachKhachHang")]
        public IActionResult DanhSachKhachHang(string keyword, string status, string sort = "newest", int page = 1, int pageSize = 10)
        {
            string vaiTro = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("VaiTro") ?? "";
            bool canManage = vaiTro.Equals("Admin", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Quản trị viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("NhanVien", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên hỗ trợ", StringComparison.OrdinalIgnoreCase);
            ViewBag.IsAdmin = canManage;
            ViewBag.CanManageCustomers = canManage;

            var query = _context.KhachHangs.AsQueryable();

            // Tìm kiếm (tên, số điện thoại, email)
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.HoTen.Contains(keyword)
                                      || (x.SoDienThoai != null && x.SoDienThoai.Contains(keyword))
                                      || (x.Email != null && x.Email.Contains(keyword)));
            }

            // Lọc trạng thái (bỏ qua nếu chọn "Tất cả" - all)
            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.TrangThai == status);
            }

            // Sắp xếp
            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;

                case "az":
                    query = query.OrderBy(x => x.HoTen);
                    break;

                case "za":
                    query = query.OrderByDescending(x => x.HoTen);
                    break;

                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            int totalItems = query.Count();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            return PartialView("_DanhSachKhachHang", items);
        }
        //Tạo mã khách hàng tự động tăng
        private string TaoMaKhachHang()
        {
            var tatCaMa = _context.KhachHangs
                                  .Select(x => x.MaKh)
                                  .ToList();

            int maxSo = 0;
            foreach (var ma in tatCaMa)
            {
                if (!string.IsNullOrEmpty(ma) && ma.StartsWith("KH") && ma.Length > 2)
                {
                    if (int.TryParse(ma.Substring(2), out int so))
                    {
                        if (so > maxSo)
                        {
                            maxSo = so;
                        }
                    }
                }
            }

            int soTiepTheo = maxSo + 1;
            return $"KH{soTiepTheo:D3}";
        }

        //Thêm khách hàng
        [HttpGet]
        public IActionResult ThemKhachHang()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ThemKhachHang(KhachHang model)
        {
            string vaiTro = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("VaiTro") ?? "";
            bool canManage = vaiTro.Equals("Admin", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Quản trị viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("NhanVien", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên hỗ trợ", StringComparison.OrdinalIgnoreCase);
            if (!canManage)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, error = "AccessDenied", message = "Bạn không có quyền thực hiện thao tác thêm khách hàng." });
                }
                TempData["Error"] = "Bạn không có quyền thực hiện thao tác thêm khách hàng.";
                return RedirectToAction(nameof(QuanLyKH));
            }

            ModelState.Remove("MaKh");
            ModelState.Remove("LienHes");
            ModelState.Remove("PhieuHoTros");
            ModelState.Remove("TaiKhoanOtps");

            // Cắt khoảng trắng của Email nếu có
            if (model.Email != null)
            {
                model.Email = model.Email.Trim();
            }


            // Ràng buộc cơ sở dữ liệu: Kiểm tra trùng số điện thoại
            if (!string.IsNullOrEmpty(model.SoDienThoai) && _context.KhachHangs.Any(x => x.SoDienThoai == model.SoDienThoai))
            {
                ModelState.AddModelError("SoDienThoai", "Số điện thoại đã tồn tại trong hệ thống.");
            }

            // Ràng buộc cơ sở dữ liệu: Kiểm tra trùng email (không phân biệt chữ hoa/thường, cắt khoảng trắng đầu/cuối)
            if (!string.IsNullOrEmpty(model.Email))
            {
                var trimmedEmail = model.Email.Trim().ToLower();
                if (_context.KhachHangs.Any(x => x.Email != null && x.Email.Trim().ToLower() == trimmedEmail))
                {
                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = false, error = "EmailDuplicate", message = "Email này đã được đăng ký trong hệ thống. Vui lòng sử dụng Email khác." });
                    }
                    ModelState.AddModelError("Email", "Email này đã được đăng ký trong hệ thống. Vui lòng sử dụng Email khác.");
                }
            }

            // Kiểm tra tính hợp lệ của mật khẩu tối thiểu 6 ký tự
            if (!string.IsNullOrEmpty(model.MatKhau) && model.MatKhau.Length < 6)
            {
                ModelState.AddModelError("MatKhau", "Mật khẩu phải từ 6 ký tự trở lên.");
            }

            // Nếu có lỗi ModelState khác khi gửi bằng AJAX
            if (!ModelState.IsValid && Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, error = "ValidationError", message = string.Join("<br/>", errors) });
            }

            if (ModelState.IsValid)
            {
                try
                {
                    model.MaKh = TaoMaKhachHang();
                    model.NgayTao = DateOnly.FromDateTime(DateTime.Now);
                    model.MatKhau = _khachHangPasswordHasher.HashPassword(model, string.IsNullOrWhiteSpace(model.MatKhau) ? "123456" : model.MatKhau);

                    _context.KhachHangs.Add(model);
                    _context.SaveChanges();

                    TempData["Success"] = "Thêm khách hàng thành công!";
                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = true, message = "Thêm khách hàng thành công!" });
                    }
                    return RedirectToAction(nameof(QuanLyKH));
                }
                catch (Exception ex)
                {
                    var errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                    ModelState.AddModelError(string.Empty, $"Lỗi khi lưu cơ sở dữ liệu: {errorMsg}");

                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = false, error = "DatabaseError", message = $"Lỗi khi lưu cơ sở dữ liệu: {errorMsg}" });
                    }
                }
            }

            // Nếu thất bại (lỗi validation hoặc exception) cho luồng gửi truyền thống
            var errorList = new List<string>();
            foreach (var val in ModelState.Values)
            {
                foreach (var error in val.Errors)
                {
                    errorList.Add(error.ErrorMessage);
                }
            }
            TempData["Error"] = "Không thể thêm khách hàng: " + string.Join("; ", errorList);

            var ds = _context.KhachHangs.ToList();
            return View("QuanLyKH", ds);
        }

        // Lấy thông tin KH để sửa
        [HttpGet]
        [Route("Staff/LayThongTinKH")]
        public IActionResult LayThongTinKH(string id)
        {
            KhachHang? kh = null;
            if (int.TryParse(id, out int numericId))
            {
                kh = _context.KhachHangs.Find(numericId);
            }
            if (kh == null && !string.IsNullOrEmpty(id))
            {
                kh = _context.KhachHangs.FirstOrDefault(x => x.MaKh == id);
            }

            if (kh == null)
            {
                return Json(new { success = false, message = "Khách hàng không tồn tại." });
            }

            return Json(new
            {
                success = true,
                data = new
                {
                    idKhachHang = kh.IdKhachHang,
                    maKh = kh.MaKh,
                    hoTen = kh.HoTen,
                    soDienThoai = kh.SoDienThoai,
                    email = kh.Email,
                    ngaySinh = kh.NgaySinh?.ToString("yyyy-MM-dd"),
                    trangThai = kh.TrangThai,
                    diaChi = kh.DiaChi
                }
            });
        }

        // Sửa thông tin khách hàng
        [HttpPost]
        [Route("Staff/SuaKhachHang")]
        [ValidateAntiForgeryToken]
        public IActionResult SuaKhachHang(KhachHang model)
        {
            string vaiTro = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("VaiTro") ?? "";
            bool canManage = vaiTro.Equals("Admin", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Quản trị viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("NhanVien", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên hỗ trợ", StringComparison.OrdinalIgnoreCase);
            if (!canManage)
            {
                return Json(new { success = false, message = "Bạn không có quyền chỉnh sửa thông tin khách hàng." });
            }

            var customer = _context.KhachHangs.Find(model.IdKhachHang);
            if (customer == null)
            {
                return Json(new { success = false, message = "Khách hàng không tồn tại." });
            }

            if (string.IsNullOrWhiteSpace(model.HoTen))
            {
                return Json(new { success = false, message = "Họ tên không được để trống." });
            }

            if (string.IsNullOrWhiteSpace(model.SoDienThoai))
            {
                return Json(new { success = false, message = "Số điện thoại không được để trống." });
            }

            // Kiểm tra trùng SĐT với KH khác
            if (_context.KhachHangs.Any(x => x.IdKhachHang != model.IdKhachHang && x.SoDienThoai == model.SoDienThoai.Trim()))
            {
                return Json(new { success = false, message = "Số điện thoại đã tồn tại ở khách hàng khác." });
            }

            // Kiểm tra trùng Email với KH khác
            if (!string.IsNullOrWhiteSpace(model.Email))
            {
                var trimmedEmail = model.Email.Trim().ToLower();
                if (_context.KhachHangs.Any(x => x.IdKhachHang != model.IdKhachHang && x.Email != null && x.Email.Trim().ToLower() == trimmedEmail))
                {
                    return Json(new { success = false, message = "Email này đã được đăng ký cho khách hàng khác." });
                }
            }

            // Kiểm tra độ dài mật khẩu nếu có nhập đổi
            if (!string.IsNullOrWhiteSpace(model.MatKhau) && model.MatKhau.Length < 6)
            {
                return Json(new { success = false, message = "Mật khẩu mới phải từ 6 ký tự trở lên." });
            }

            try
            {
                customer.HoTen = model.HoTen.Trim();
                customer.SoDienThoai = model.SoDienThoai.Trim();
                customer.Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim();
                customer.NgaySinh = model.NgaySinh;
                customer.TrangThai = model.TrangThai ?? "Hoạt động";
                customer.DiaChi = string.IsNullOrWhiteSpace(model.DiaChi) ? null : model.DiaChi.Trim();

                if (!string.IsNullOrWhiteSpace(model.MatKhau))
                {
                    customer.MatKhau = _khachHangPasswordHasher.HashPassword(customer, model.MatKhau);
                }

                _context.SaveChanges();
                return Json(new { success = true, message = "Cập nhật thông tin khách hàng thành công!" });
            }
            catch (Exception ex)
            {
                var errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = $"Lỗi khi lưu cơ sở dữ liệu: {errorMsg}" });
            }
        }

        // Xóa khách hàng (Đã vô hiệu hóa theo yêu cầu hệ thống)
        [HttpPost]
        [Route("Staff/XoaKhachHang")]
        [Route("KhachHang/XoaKhachHang")]
        [ValidateAntiForgeryToken]
        public IActionResult XoaKhachHang(string id)
        {
            return Json(new { success = false, message = "Chức năng xóa khách hàng hiện đã bị vô hiệu hóa trên hệ thống." });
        }

        [HttpPost]
        [Route("Staff/KhoaKhachHang")]
        [Route("KhachHang/KhoaKhachHang")]
        [ValidateAntiForgeryToken]
        public IActionResult KhoaKhachHang(string? id, int? idKhachHang)
        {
            string vaiTro = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("VaiTro") ?? "";
            bool canManage = vaiTro.Equals("Admin", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Quản trị viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("NhanVien", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên hỗ trợ", StringComparison.OrdinalIgnoreCase);
            if (!canManage)
            {
                return Json(new { success = false, message = "Bạn không có quyền thay đổi trạng thái tài khoản khách hàng." });
            }

            KhachHang? customer = null;
            if (idKhachHang.HasValue)
            {
                customer = _context.KhachHangs.Find(idKhachHang.Value);
            }
            if (customer == null && !string.IsNullOrEmpty(id))
            {
                if (int.TryParse(id, out int numericId))
                {
                    customer = _context.KhachHangs.Find(numericId);
                }
                if (customer == null)
                {
                    customer = _context.KhachHangs.FirstOrDefault(x => x.MaKh == id);
                }
            }

            if (customer == null)
            {
                return Json(new { success = false, message = "Khách hàng không tồn tại." });
            }

            if (customer.TrangThai == "Hoạt động")
            {
                customer.TrangThai = "Đã khóa";
            }
            else
            {
                customer.TrangThai = "Hoạt động";
            }

            _context.SaveChanges();

            return Json(new { success = true, message = "Cập nhật trạng thái thành công!", newStatus = customer.TrangThai });
        }

        // GET: /Staff/ChiTietKhachHang/{id} hoặc /Staff/ChiTietKH/{id}
        [HttpGet]
        [Route("Staff/ChiTietKhachHang/{id}")]
        [Route("Staff/ChiTietKH/{id?}")]
        [Route("Staff/ChiTietKH")]
        public async Task<IActionResult> ChiTietKhachHang(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return Json(new { success = false, message = "Mã hoặc ID khách hàng không hợp lệ." });
            }

            string vaiTro = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("VaiTro") ?? "";
            bool canManage = vaiTro.Equals("Admin", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Quản trị viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("NhanVien", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên", StringComparison.OrdinalIgnoreCase) || vaiTro.Equals("Nhân viên hỗ trợ", StringComparison.OrdinalIgnoreCase);
            ViewBag.IsAdmin = canManage;
            ViewBag.CanManageCustomers = canManage;

            KhachHang? khachHang = null;
            if (int.TryParse(id, out int numericId))
            {
                khachHang = await _context.KhachHangs
                                    .Include(x => x.PhieuHoTros)
                                        .ThenInclude(p => p.LichHens)
                                    .Include(x => x.PhieuHoTros)
                                        .ThenInclude(p => p.DanhGium)
                                    .FirstOrDefaultAsync(x => x.IdKhachHang == numericId);
            }

            if (khachHang == null)
            {
                khachHang = await _context.KhachHangs
                                    .Include(x => x.PhieuHoTros)
                                        .ThenInclude(p => p.LichHens)
                                    .Include(x => x.PhieuHoTros)
                                        .ThenInclude(p => p.DanhGium)
                                    .FirstOrDefaultAsync(x => x.MaKh == id);
            }

            if (khachHang == null)
            {
                return Json(new { success = false, message = "Không tìm thấy khách hàng." });
            }

            // Gán giá trị TenDangNhap hiển thị nếu chưa có
            if (string.IsNullOrWhiteSpace(khachHang.TenDangNhap))
            {
                khachHang.TenDangNhap = !string.IsNullOrWhiteSpace(khachHang.Email) 
                    ? khachHang.Email.Split('@')[0] 
                    : (khachHang.MaKh ?? khachHang.SoDienThoai ?? "khachhang");
            }

            return PartialView("_ChiTietKhachHang", khachHang);
        }

        [HttpGet]
        public IActionResult ChiTietKH(string id)
        {
            return RedirectToAction("ChiTietKhachHang", new { id = id });
        }

        // Lấy danh sách lịch sử phiếu hỗ trợ của khách hàng
        [HttpGet]
        [Route("Staff/LichSuPhieuKH")]
        public IActionResult LichSuPhieuKH(string id)
        {
            KhachHang? khachHang = null;
            if (int.TryParse(id, out int numericId))
            {
                khachHang = _context.KhachHangs.FirstOrDefault(x => x.IdKhachHang == numericId);
            }
            if (khachHang == null && !string.IsNullOrEmpty(id))
            {
                khachHang = _context.KhachHangs.FirstOrDefault(x => x.MaKh == id);
            }

            if (khachHang == null)
            {
                return Json(new { success = false, message = "Khách hàng không tồn tại." });
            }

            var tickets = _context.PhieuHoTros
                .AsNoTracking()
                .Include(p => p.IdDichVuNavigation)
                .Include(p => p.IdNhanVienNavigation)
                .Where(p => p.IdKhachHang == khachHang.IdKhachHang)
                .OrderByDescending(p => p.NgayTao)
                .Select(p => new
                {
                    idPhieu = p.IdPhieu,
                    maPhieu = !string.IsNullOrEmpty(p.MaPhieu) ? p.MaPhieu : $"PHT{p.IdPhieu:D6}",
                    tieuDe = p.TieuDe ?? "Hỗ trợ kỹ thuật",
                    tenDichVu = p.IdDichVuNavigation != null ? p.IdDichVuNavigation.TenDichVu : "Dịch vụ chung",
                    mucUuTien = p.MucDoUuTien ?? 2,
                    trangThai = p.TrangThai ?? "Chờ xử lý",
                    ngayTao = p.NgayTao.HasValue ? p.NgayTao.Value.ToString("dd/MM/yyyy") : "--",
                    ngayCapNhat = p.NgayCapNhat.HasValue ? p.NgayCapNhat.Value.ToString("dd/MM/yyyy") : "--",
                    tenNhanVien = p.IdNhanVienNavigation != null ? p.IdNhanVienNavigation.HoTen : "Chưa phân công",
                    moTa = p.NoiDung ?? "Không có mô tả chi tiết."
                })
                .ToList();

            return Json(new
            {
                success = true,
                customer = new
                {
                    idKhachHang = khachHang.IdKhachHang,
                    maKh = khachHang.MaKh,
                    hoTen = khachHang.HoTen,
                    soDienThoai = khachHang.SoDienThoai,
                    email = khachHang.Email
                },
                tickets = tickets
            });
        }


        //Thêm dịch vụ 
        //==================================================
        // QUẢN LÝ DỊCH VỤ KỸ THUẬT
        //==================================================

        [Authorize(Roles = "Admin,Quản trị viên,AdminManager")]
        [HttpGet]
        public async Task<IActionResult> QuanLyDichVu(
            string keyword,
            string status,
            int? category,
            string sort = "newest",
            int page = 1,
            int pageSize = 5)
        {
            // Dropdown Danh mục cho bộ lọc
            ViewBag.DanhMucs = await _context.DanhMucs
                                    .Where(x => x.TrangThai == "Hoạt động")
                                    .OrderBy(x => x.TenDanhMuc)
                                    .ToListAsync();

            // Tính toán stats ban đầu
            ViewBag.TotalServices = await _context.DichVus.CountAsync();
            ViewBag.ActiveServices = await _context.DichVus.CountAsync(x => x.TrangThai == "Hoạt động");
            ViewBag.InactiveServices = await _context.DichVus.CountAsync(x => x.TrangThai == "Tạm khóa");
            ViewBag.UsedCategories = await _context.DichVus
                                             .Select(x => x.IdDanhMuc)
                                             .Distinct()
                                             .CountAsync();

            var query = _context.DichVus
                                .Include(x => x.IdDanhMucNavigation)
                                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(x => x.TenDichVu.Contains(keyword) || (x.MoTa != null && x.MoTa.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.TrangThai == status);
            }

            if (category.HasValue)
            {
                query = query.Where(x => x.IdDanhMuc == category);
            }

            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;
                case "az":
                    query = query.OrderBy(x => x.TenDichVu);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.TenDichVu);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            ViewBag.Keyword = keyword;
            ViewBag.Status = status;
            ViewBag.Category = category;
            ViewBag.Sort = sort;

            return View(items);
        }

        [HttpGet]
        public async Task<IActionResult> DanhSachDichVu(
            string keyword,
            string status,
            int? category,
            string sort = "newest",
            int page = 1,
            int pageSize = 5)
        {
            var query = _context.DichVus
                                .Include(x => x.IdDanhMucNavigation)
                                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.Trim();
                query = query.Where(x => x.TenDichVu.Contains(keyword) || (x.MoTa != null && x.MoTa.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.TrangThai == status);
            }

            if (category.HasValue)
            {
                query = query.Where(x => x.IdDanhMuc == category);
            }

            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;
                case "az":
                    query = query.OrderBy(x => x.TenDichVu);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.TenDichVu);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            return PartialView("_DanhSachDichVu", items);
        }

        [HttpGet]
        public async Task<IActionResult> ThongKeDichVu()
        {
            ViewBag.TotalServices = await _context.DichVus.CountAsync();
            ViewBag.ActiveServices = await _context.DichVus.CountAsync(x => x.TrangThai == "Hoạt động");
            ViewBag.InactiveServices = await _context.DichVus.CountAsync(x => x.TrangThai == "Tạm khóa");
            ViewBag.UsedCategories = await _context.DichVus
                                             .Select(x => x.IdDanhMuc)
                                             .Distinct()
                                             .CountAsync();

            return PartialView("_ThongKeDichVu");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ThemDichVu(DichVu model)
        {
            ModelState.Remove("IdDanhMucNavigation");

            if (ModelState.IsValid)
            {
                // Kiểm tra danh mục liên kết
                var dm = await _context.DanhMucs.FindAsync(model.IdDanhMuc);
                if (dm == null)
                {
                    return Json(new { success = false, message = "Danh mục sự cố không tồn tại." });
                }

                // Kiểm tra nếu danh mục đang bị khóa mà thêm dịch vụ Hoạt động
                if (model.TrangThai == "Hoạt động" && (dm.TrangThai == "Tạm khóa" || dm.TrangThai == "Khóa"))
                {
                    return Json(new { success = false, message = $"Không thể thêm dịch vụ ở trạng thái Hoạt động vì danh mục '{dm.TenDanhMuc}' đang bị khóa." });
                }
                // Kiểm tra trùng tên trong cùng danh mục
                bool exists = await _context.DichVus.AnyAsync(x => x.IdDanhMuc == model.IdDanhMuc && x.TenDichVu.Trim().ToLower() == model.TenDichVu.Trim().ToLower());
                if (exists)
                {
                    return Json(new { success = false, message = "Dịch vụ đã tồn tại trong danh mục này." });
                }

                model.NgayTao = DateOnly.FromDateTime(DateTime.Now);
                await _context.DichVus.AddAsync(model);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "✔ Thêm dịch vụ mới thành công" });
            }

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            return Json(new { success = false, message = "Lỗi validation: " + string.Join("; ", errors) });
        }

        [HttpGet]
        public async Task<IActionResult> SuaDichVu(int id)
        {
            var dichVu = await _context.DichVus.FindAsync(id);
            if (dichVu == null)
            {
                return NotFound();
            }
            return Json(new {
                idDichVu = dichVu.IdDichVu,
                tenDichVu = dichVu.TenDichVu,
                idDanhMuc = dichVu.IdDanhMuc,
                moTa = dichVu.MoTa,
                trangThai = dichVu.TrangThai
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SuaDichVu(DichVu model)
        {
            ModelState.Remove("IdDanhMucNavigation");

            if (ModelState.IsValid)
            {
                var original = await _context.DichVus.FindAsync(model.IdDichVu);
                if (original == null)
                {
                    return Json(new { success = false, message = "Dịch vụ không tồn tại." });
                }

                // Kiểm tra danh mục
                var dm = await _context.DanhMucs.FindAsync(model.IdDanhMuc);
                if (dm == null)
                {
                    return Json(new { success = false, message = "Danh mục sự cố không tồn tại." });
                }

                // Kiểm tra nếu danh mục đang bị khóa mà cập nhật dịch vụ thành Hoạt động
                if (model.TrangThai == "Hoạt động" && (dm.TrangThai == "Tạm khóa" || dm.TrangThai == "Khóa"))
                {
                    return Json(new { success = false, message = $"Không thể cập nhật dịch vụ ở trạng thái Hoạt động vì danh mục '{dm.TenDanhMuc}' đang bị khóa." });
                }
                // Kiểm tra trùng tên
                bool exists = await _context.DichVus.AnyAsync(x => x.IdDichVu != model.IdDichVu && x.IdDanhMuc == model.IdDanhMuc && x.TenDichVu.Trim().ToLower() == model.TenDichVu.Trim().ToLower());
                if (exists)
                {
                    return Json(new { success = false, message = "Tên dịch vụ đã tồn tại trong danh mục này." });
                }

                original.TenDichVu = model.TenDichVu;
                original.IdDanhMuc = model.IdDanhMuc;
                original.MoTa = model.MoTa;
                original.TrangThai = model.TrangThai;

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "✔ Cập nhật thông tin dịch vụ thành công" });
            }

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            return Json(new { success = false, message = "Lỗi validation: " + string.Join("; ", errors) });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> XoaDichVu(int id)
        {
            var dichVu = await _context.DichVus
                .Include(d => d.IdDanhMucNavigation)
                .FirstOrDefaultAsync(x => x.IdDichVu == id);

            if (dichVu == null)
            {
                return Json(new { success = false, message = "Không tìm thấy dịch vụ cần xóa." });
            }

            try
            {
                // 1. Kiểm tra nếu dịch vụ đã có phiếu hỗ trợ liên kết
                int countTickets = await _context.PhieuHoTros.CountAsync(x => x.IdDichVu == id);
                if (countTickets > 0)
                {
                    return Json(new
                    {
                        success = false,
                        message = $"Không thể xóa dịch vụ '{dichVu.TenDichVu}' vì đã có {countTickets} phiếu hỗ trợ liên kết với dịch vụ này."
                    });
                }

                // 2. Kiểm tra nếu dịch vụ đang bị tạm khóa / khóa
                bool isServiceLocked = dichVu.TrangThai == "Tạm khóa" || dichVu.TrangThai == "Khóa";
                if (isServiceLocked)
                {
                    return Json(new
                    {
                        success = false,
                        message = $"Không thể xóa dịch vụ '{dichVu.TenDichVu}' vì dịch vụ đang ở trạng thái bị khóa."
                    });
                }

                // 3. Kiểm tra nếu danh mục chứa dịch vụ bị tạm khóa / khóa
                bool isCatLocked = dichVu.IdDanhMucNavigation != null &&
                                  (dichVu.IdDanhMucNavigation.TrangThai == "Tạm khóa" || dichVu.IdDanhMucNavigation.TrangThai == "Khóa");
                if (isCatLocked)
                {
                    return Json(new
                    {
                        success = false,
                        message = $"Không thể xóa dịch vụ '{dichVu.TenDichVu}' vì danh mục '{dichVu.IdDanhMucNavigation?.TenDanhMuc}' đang bị khóa."
                    });
                }

                _context.DichVus.Remove(dichVu);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Xóa dịch vụ '{dichVu.TenDichVu}' thành công." });
            }
            catch (DbUpdateException)
            {
                return Json(new { success = false, message = $"Không thể xóa dịch vụ '{dichVu.TenDichVu}' do có ràng buộc dữ liệu liên quan khác trong hệ thống." });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Đã xảy ra lỗi trong quá trình xóa dịch vụ." });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> KhoaDichVu(int id)
        {
            var model = await _context.DichVus
                                      .Include(d => d.IdDanhMucNavigation)
                                      .FirstOrDefaultAsync(x => x.IdDichVu == id);
            if (model == null)
            {
                return Json(new { success = false, message = "Dịch vụ không tồn tại." });
            }

            var isActive = model.TrangThai == "Hoạt động";
            if (!isActive)
            {
                var dm = model.IdDanhMucNavigation;
                if (dm != null && (dm.TrangThai == "Tạm khóa" || dm.TrangThai == "Khóa"))
                {
                    return Json(new
                    {
                        success = false,
                        isCategoryLocked = true,
                        message = $"Không thể kích hoạt dịch vụ '{model.TenDichVu}' vì danh mục '{dm.TenDanhMuc}' đang bị khóa."
                    });
                }
            }
            model.TrangThai = isActive ? "Tạm khóa" : "Hoạt động";

            await _context.SaveChangesAsync();

            var msg = model.TrangThai == "Tạm khóa" ? "✔ Khóa dịch vụ thành công" : "✔ Kích hoạt dịch vụ thành công";
            return Json(new { success = true, message = msg, newStatus = model.TrangThai });
        }

        [HttpGet]
        public async Task<IActionResult> ChiTietDichVu(int id)
        {
            var model = await _context.DichVus
                                      .Include(d => d.IdDanhMucNavigation)
                                      .FirstOrDefaultAsync(x => x.IdDichVu == id);
            if (model == null)
            {
                return NotFound();
            }
            return PartialView("_ChiTietDichVu", model);
        }



        //quản lý nhân viên
        [Authorize(Roles = "Admin,Quản trị viên,AdminManager")]
        [HttpGet]
        public async Task<IActionResult> QuanLyNhanVien(string keyword, string status, string sort = "newest")
        {
            var query = _context.NhanViens
                .Include(x => x.PhieuHoTros)
                    .ThenInclude(p => p.DanhGium)
                .Include(x => x.PhieuHoTros)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.HoTen.Contains(keyword) || (x.SoDienThoai != null && x.SoDienThoai.Contains(keyword)) || (x.Email != null && x.Email.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.TrangThai == status);
            }

            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao);
                    break;
                case "az":
                    query = query.OrderBy(x => x.HoTen);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.HoTen);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao);
                    break;
            }

            var today = DateOnly.FromDateTime(DateTime.Today);
            var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);

            ViewBag.TotalEmployees = await _context.NhanViens.CountAsync();
            ViewBag.ActiveEmployees = await _context.NhanViens.CountAsync(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động");
            ViewBag.InactiveEmployees = ViewBag.TotalEmployees - ViewBag.ActiveEmployees;
            ViewBag.NewThisMonth = await _context.NhanViens.CountAsync(x => x.NgayTao != null && x.NgayTao >= firstDayOfMonth);

            ViewBag.Keyword = keyword;
            ViewBag.Status = status;
            ViewBag.Sort = sort;

            var nhanViens = await query.ToListAsync();
            var modelList = nhanViens.Select(x => new NhanVienViewModel
            {
                IdNhanVien = x.IdNhanVien,
                HoTen = x.HoTen?.Trim() ?? "",
                SoDienThoai = x.SoDienThoai?.Trim() ?? "",
                Email = x.Email?.Trim() ?? "",
                DiaChi = x.DiaChi?.Trim(),
                TenDangNhap = x.TenDangNhap?.Trim() ?? "",
                VaiTro = x.VaiTro?.Trim() ?? "",
                MatKhau = x.MatKhau?.Trim() ?? "",
                TrangThai = x.TrangThai?.Trim() ?? "",
                NgayTao = x.NgayTao
            }).ToList();

            var todayDt = DateTime.Today;
            var initialStaffList = nhanViens.Select(x =>
            {
                var staffIdStr = "STAFF" + x.IdNhanVien.ToString("D3");

                // Calculate performance stats
                var total = x.PhieuHoTros.Count;
                var completed = x.PhieuHoTros.Count(p => p.TrangThai == "completed" || p.TrangThai == "Đã hoàn thành" || p.TrangThai == "Hoàn thành");
                var processing = x.PhieuHoTros.Count(p => p.TrangThai == "processing" || p.TrangThai == "Đang xử lý");
                var waiting = x.PhieuHoTros.Count(p => p.TrangThai == "waiting" || p.TrangThai == "Chờ tiếp nhận" || p.TrangThai == "Chờ xử lý");

                // Calculate ratings
                var ratedTickets = x.PhieuHoTros.Where(p => p.DanhGium != null).ToList();
                double avgService = ratedTickets.Any(p => p.DanhGium!.ChatLuongDichVu.HasValue)
                    ? ratedTickets.Where(p => p.DanhGium!.ChatLuongDichVu.HasValue).Average(p => p.DanhGium!.ChatLuongDichVu!.Value)
                    : 5.0;
                double avgAttitude = ratedTickets.Any(p => p.DanhGium!.ThaiDoNhanVien.HasValue)
                    ? ratedTickets.Where(p => p.DanhGium!.ThaiDoNhanVien.HasValue).Average(p => p.DanhGium!.ThaiDoNhanVien!.Value)
                    : 5.0;
                double avgSpeed = ratedTickets.Any(p => p.DanhGium!.TocDoXuLy.HasValue)
                    ? ratedTickets.Where(p => p.DanhGium!.TocDoXuLy.HasValue).Average(p => p.DanhGium!.TocDoXuLy!.Value)
                    : 5.0;

                int servicePercent = (int)Math.Round(avgService * 20);
                int attitudePercent = (int)Math.Round(avgAttitude * 20);
                int speedPercent = (int)Math.Round(avgSpeed * 20);

                double overallRating = ratedTickets.Any(p => p.DanhGium!.ChatLuongDichVu.HasValue)
                    ? Math.Round(ratedTickets.Where(p => p.DanhGium!.ChatLuongDichVu.HasValue).Average(p => p.DanhGium!.ChatLuongDichVu!.Value), 1)
                    : 5.0;

                // Extract comments
                var comments = ratedTickets
                    .Where(p => !string.IsNullOrEmpty(p.DanhGium!.NhanXet))
                    .Select(p => new
                    {
                        user = p.IdKhachHangNavigation != null ? p.IdKhachHangNavigation.HoTen?.Trim() : "Khách hàng ẩn danh",
                        rating = p.DanhGium!.ChatLuongDichVu ?? 5,
                        text = p.DanhGium!.NhanXet?.Trim()
                    })
                    .ToList();

                // 6-month performance counts (Month-5 to current Month)
                var monthlyPerformance = new List<int>();
                for (int i = 5; i >= 0; i--)
                {
                    var targetDate = todayDt.AddMonths(-i);
                    var count = x.PhieuHoTros.Count(p => p.NgayTao != null && p.NgayTao.Value.Year == targetDate.Year && p.NgayTao.Value.Month == targetDate.Month);
                    monthlyPerformance.Add(count);
                }

                return new
                {
                    id = staffIdStr,
                    fullname = x.HoTen?.Trim() ?? "",
                    avatar = (string?)null,
                    role = x.VaiTro?.Trim() ?? "",
                    status = x.TrangThai?.Trim() ?? "",
                    phone = x.SoDienThoai?.Trim() ?? "",
                    email = x.Email?.Trim() ?? "",
                    username = x.TenDangNhap?.Trim() ?? "",
                    address = x.DiaChi?.Trim() ?? "Chưa cập nhật",
                    createdDate = x.NgayTao?.ToString("yyyy-MM-dd") ?? "—",
                    perfStats = new
                    {
                        total = total,
                        completed = completed,
                        processing = processing,
                        waiting = waiting
                    },
                    ratingsDetail = new
                    {
                        service = servicePercent,
                        attitude = attitudePercent,
                        speed = speedPercent
                    },
                    rating = overallRating,
                    comments = comments,
                    monthlyPerformance = monthlyPerformance
                };
            }).ToList();

            ViewBag.InitialStaffJson = System.Text.Json.JsonSerializer.Serialize(initialStaffList);

            return View(modelList);
        }



        [HttpPost]
        [Route("Staff/ResetMatKhau")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetMatKhau(int id)
        {
            try
            {
                var nv = await _context.NhanViens.FindAsync(id);
                if (nv == null) return Json(new { success = false, message = "Nhân viên không tồn tại." });

                nv.MatKhau = _nhanVienPasswordHasher.HashPassword(nv, "Viettel@1234");
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = $"Đã reset mật khẩu của {nv.HoTen} thành: 'Viettel@1234'" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Route("Staff/ThemNhanVien")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ThemNhanVien(NhanVienViewModel model)
        {
            try
            {
                // Kiểm tra trùng username
                bool exists = await _context.NhanViens.AnyAsync(x => x.TenDangNhap == model.TenDangNhap);
                if (exists) return Json(new { success = false, message = $"Tên đăng nhập '{model.TenDangNhap}' đã tồn tại!" });

                // Kiểm tra trùng số điện thoại
                if (!string.IsNullOrEmpty(model.SoDienThoai))
                {
                    bool phoneExists = await _context.NhanViens.AnyAsync(x => x.SoDienThoai == model.SoDienThoai);
                    if (phoneExists) return Json(new { success = false, message = $"Số điện thoại '{model.SoDienThoai}' đã tồn tại!" });
                }

                // Kiểm tra trùng email
                if (!string.IsNullOrEmpty(model.Email))
                {
                    bool emailExists = await _context.NhanViens.AnyAsync(x => x.Email == model.Email);
                    if (emailExists) return Json(new { success = false, message = $"Email '{model.Email}' đã tồn tại!" });
                }

                var nv = new NhanVien
                {
                    HoTen = model.HoTen,
                    Email = model.Email,
                    SoDienThoai = model.SoDienThoai,
                    DiaChi = model.DiaChi,
                    TenDangNhap = model.TenDangNhap,
                    VaiTro = model.VaiTro,
                    TrangThai = model.TrangThai,
                    NgayTao = DateOnly.FromDateTime(DateTime.Now)
                };
                nv.MatKhau = _nhanVienPasswordHasher.HashPassword(nv, string.IsNullOrEmpty(model.MatKhau) ? "Viettel@1234" : model.MatKhau);

                _context.NhanViens.Add(nv);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"✔ Thêm mới nhân viên {nv.HoTen} thành công!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Route("Staff/LuuNhanVien")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LuuNhanVien(NhanVienViewModel model)
        {
            try
            {
                if (model.IdNhanVien > 0)
                {
                    // Chỉnh sửa
                    var nv = await _context.NhanViens.FindAsync(model.IdNhanVien);
                    if (nv == null) return Json(new { success = false, message = "Nhân viên không tồn tại." });

                    nv.HoTen = model.HoTen;
                    nv.Email = model.Email;
                    nv.SoDienThoai = model.SoDienThoai;
                    nv.DiaChi = model.DiaChi;
                    nv.VaiTro = model.VaiTro;
                    nv.TrangThai = model.TrangThai;

                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = $"Cập nhật nhân viên {nv.HoTen} thành công!" });
                }
                else
                {
                    // Thêm mới
                    // Kiểm tra trùng username
                    bool exists = await _context.NhanViens.AnyAsync(x => x.TenDangNhap == model.TenDangNhap);
                    if (exists) return Json(new { success = false, message = $"Tên đăng nhập '{model.TenDangNhap}' đã tồn tại!" });

                    var nv = new NhanVien
                    {
                        HoTen = model.HoTen,
                        Email = model.Email,
                        SoDienThoai = model.SoDienThoai,
                        DiaChi = model.DiaChi,
                        TenDangNhap = model.TenDangNhap,
                        VaiTro = model.VaiTro,
                        TrangThai = model.TrangThai,
                        NgayTao = DateOnly.FromDateTime(DateTime.Now)
                    };
                    nv.MatKhau = _nhanVienPasswordHasher.HashPassword(nv, string.IsNullOrEmpty(model.MatKhau) ? "Viettel@1234" : model.MatKhau);

                    _context.NhanViens.Add(nv);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = $"Thêm mới nhân viên {nv.HoTen} thành công!" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }


        [HttpGet]
        public async Task<IActionResult> LayChiTietNhanVien(int id)
        {
            var nv = await _context.NhanViens
                .Where(x => x.IdNhanVien == id)
                .FirstOrDefaultAsync();

            if (nv == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy nhân viên."
                });
            }

            var model = new NhanVienViewModel
            {
                IdNhanVien = nv.IdNhanVien,
                HoTen = nv.HoTen?.Trim() ?? "",
                Email = nv.Email?.Trim() ?? "",
                SoDienThoai = nv.SoDienThoai?.Trim() ?? "",
                DiaChi = nv.DiaChi?.Trim() ?? "",
                TenDangNhap = nv.TenDangNhap?.Trim() ?? "",
                VaiTro = nv.VaiTro?.Trim() ?? "",
                TrangThai = nv.TrangThai?.Trim() ?? "",
                NgayTao = nv.NgayTao,
                Avatar = null
            };

            return Json(new
            {
                success = true,
                data = model
            });
        }


        [HttpGet]
        public async Task<IActionResult> LayThongTinNhanVien(int id)
        {
            var nv = await _context.NhanViens
                .Where(x => x.IdNhanVien == id)
                .FirstOrDefaultAsync();

            if (nv == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy nhân viên."
                });
            }

            var model = new NhanVienViewModel
            {
                IdNhanVien = nv.IdNhanVien,
                HoTen = nv.HoTen?.Trim() ?? "",
                Email = nv.Email?.Trim() ?? "",
                SoDienThoai = nv.SoDienThoai?.Trim() ?? "",
                DiaChi = nv.DiaChi?.Trim() ?? "",
                TenDangNhap = nv.TenDangNhap?.Trim() ?? "",
                VaiTro = nv.VaiTro?.Trim() ?? "",
                TrangThai = nv.TrangThai?.Trim() ?? "",
                NgayTao = nv.NgayTao
            };

            return Json(new
            {
                success = true,
                data = model
            });
        }


        [HttpGet]
        public async Task<IActionResult> CapNhatNhanVien(int id)
        {
            var nv = await _context.NhanViens
                .Where(x => x.IdNhanVien == id)
                .Select(x => new
                {
                    x.IdNhanVien,
                    x.HoTen,
                    x.Email,
                    x.SoDienThoai,
                    x.DiaChi,
                    x.TenDangNhap,
                    x.VaiTro,
                    x.TrangThai
                })
                .FirstOrDefaultAsync();

            if (nv == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy nhân viên."
                });
            }

            return Json(new
            {
                success = true,
                data = nv
            });
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CapNhatNhanVien(NhanVienViewModel model)
        {
            try
            {
                ModelState.Remove("MatKhau");
                if (!ModelState.IsValid)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ."
                    });
                }

                var nv = await _context.NhanViens
                    .FirstOrDefaultAsync(x => x.IdNhanVien == model.IdNhanVien);

                if (nv == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Không tìm thấy nhân viên."
                    });
                }

                // Kiểm tra Email trùng
                if (!string.IsNullOrWhiteSpace(model.Email))
                {
                    bool emailExists = await _context.NhanViens.AnyAsync(x =>
                        x.Email == model.Email &&
                        x.IdNhanVien != model.IdNhanVien);

                    if (emailExists)
                    {
                        return Json(new
                        {
                            success = false,
                            message = "Email đã tồn tại."
                        });
                    }
                }

                // Kiểm tra SĐT trùng
                if (!string.IsNullOrWhiteSpace(model.SoDienThoai))
                {
                    bool phoneExists = await _context.NhanViens.AnyAsync(x =>
                        x.SoDienThoai == model.SoDienThoai &&
                        x.IdNhanVien != model.IdNhanVien);

                    if (phoneExists)
                    {
                        return Json(new
                        {
                            success = false,
                            message = "Số điện thoại đã tồn tại."
                        });
                    }
                }

                nv.HoTen = model.HoTen;
                nv.Email = model.Email;
                nv.SoDienThoai = model.SoDienThoai;
                nv.DiaChi = model.DiaChi;
                nv.VaiTro = model.VaiTro;
                nv.TrangThai = model.TrangThai;

                // Không cập nhật TenDangNhap
                // Không cập nhật MatKhau

                _context.NhanViens.Update(nv);

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Cập nhật nhân viên thành công."
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> LayThongTinResetMatKhau(int id)
        {
            var nv = await _context.NhanViens
                .Where(x => x.IdNhanVien == id)
                .Select(x => new
                {
                    x.IdNhanVien,
                    x.HoTen,
                    x.TenDangNhap
                })
                .FirstOrDefaultAsync();

            if (nv == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy nhân viên."
                });
            }

            return Json(new
            {
                success = true,
                data = nv
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetMatKhauNhanVien(NhanVienViewModel model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.MatKhauMoi) || model.MatKhauMoi.Length < 6)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Mật khẩu mới tối thiểu phải có 6 ký tự."
                    });
                }

                if (model.MatKhauMoi != model.XacNhanMatKhau)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Mật khẩu xác nhận không trùng khớp."
                    });
                }

                var nv = await _context.NhanViens.FirstOrDefaultAsync(x => x.IdNhanVien == model.IdNhanVien);
                if (nv == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Không tìm thấy nhân viên."
                    });
                }

                nv.MatKhau = _nhanVienPasswordHasher.HashPassword(nv, model.MatKhauMoi);
                _context.NhanViens.Update(nv);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Reset mật khẩu thành công."
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> LayThongTinKhoaNhanVien(int id)
        {
            var nv = await _context.NhanViens
                .Where(x => x.IdNhanVien == id)
                .Select(x => new
                {
                    x.IdNhanVien,
                    x.HoTen,
                    x.Email,
                    x.SoDienThoai,
                    x.VaiTro,
                    x.TrangThai
                })
                .FirstOrDefaultAsync();

            if (nv == null)
            {
                return Json(new
                {
                    success = false,
                    message = "Không tìm thấy nhân viên."
                });
            }

            return Json(new
            {
                success = true,
                data = nv
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> KhoaNhanVien(NhanVienViewModel model)
        {
            try
            {
                ModelState.Remove("HoTen");
                ModelState.Remove("SoDienThoai");
                ModelState.Remove("Email");
                ModelState.Remove("TenDangNhap");
                ModelState.Remove("VaiTro");
                ModelState.Remove("MatKhau");

                if (!ModelState.IsValid)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ."
                    });
                }

                var nv = await _context.NhanViens.FirstOrDefaultAsync(x => x.IdNhanVien == model.IdNhanVien);
                if (nv == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Không tìm thấy nhân viên."
                    });
                }

                var newStatus = model.TrangThai?.Trim();
                if (newStatus != "Hoạt động" && newStatus != "Tạm khóa")
                {
                    return Json(new
                    {
                        success = false,
                        message = "Trạng thái mới không hợp lệ."
                    });
                }

                nv.TrangThai = newStatus;
                _context.NhanViens.Update(nv);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Cập nhật trạng thái tài khoản thành công."
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> XoaNhanVien(int id)
        {
            var nv = await _context.NhanViens.FindAsync(id);
            if (nv == null)
            {
                return Json(new { success = false, message = "Không tìm thấy nhân viên." });
            }

            try
            {
                bool hasTickets = await _context.PhieuHoTros.AnyAsync(x => x.IdNhanVien == id);
                if (hasTickets)
                {
                    return Json(new { success = false, message = $"Không thể xóa nhân viên '{nv.HoTen}' vì đã có phiếu hỗ trợ liên kết với tài khoản này." });
                }

                _context.NhanViens.Remove(nv);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Xóa nhân viên '{nv.HoTen}' thành công." });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Không thể xóa nhân viên do có ràng buộc dữ liệu liên quan." });
            }
        }



        //Quản lý phiếu hỗ trợ 
        [HttpGet]
        [Route("Staff/QuanLyPhieu")]
        public async Task<IActionResult> QuanLyPhieu(
            string keyword,
            string status,
            string priority,
            int? service,
            int? staff,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
        {
            var (userId, role) = GetStaffSessionInfo();
            bool isStaffRole = (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && userId.HasValue;

            var query = _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .AsQueryable();

            if (isStaffRole)
            {
                query = query.Where(x => x.IdNhanVien == userId.Value);
            }
            else if (staff.HasValue)
            {
                query = query.Where(x => x.IdNhanVien == staff);
            }

            // Tìm kiếm
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.MaPhieu.Contains(keyword)
                    || x.TieuDe.Contains(keyword)
                    || x.IdKhachHangNavigation.HoTen.Contains(keyword));
            }

            // Lọc trạng thái
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.TrangThai == status);
            }

            // Lọc ưu tiên
            if (!string.IsNullOrWhiteSpace(priority))
            {
                if (int.TryParse(priority, out int prio))
                {
                    query = query.Where(x => x.MucDoUuTien == prio);
                }
            }

            // Lọc dịch vụ
            if (service.HasValue)
            {
                query = query.Where(x => x.IdDichVu == service);
            }

            // Sắp xếp (mới nhất lên đầu)
            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao).ThenBy(x => x.IdPhieu);
                    break;
                case "az":
                    query = query.OrderBy(x => x.TieuDe).ThenByDescending(x => x.IdPhieu);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.TieuDe).ThenByDescending(x => x.IdPhieu);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao).ThenByDescending(x => x.IdPhieu);
                    break;
            }

            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            // Map to ViewModel
            var viewModel = items.Select(p => new DanhSachPhieuViewModel
            {
                IdPhieu = p.IdPhieu,
                MaPhieu = p.MaPhieu,
                TieuDe = p.TieuDe,
                TenKhachHang = p.IdKhachHangNavigation?.HoTen ?? "",
                SoDienThoai = p.IdKhachHangNavigation?.SoDienThoai ?? "",
                TenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "",
                TenDanhMuc = p.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                TenNhanVien = p.IdNhanVienNavigation?.HoTen ?? "",
                TrangThai = p.TrangThai ?? "",
                MucDoUuTien = p.MucDoUuTien ?? 0,
                NgayTao = p.NgayTao,
                NgayCapNhat = p.NgayCapNhat,
                CanHen = p.CanLichHen == "Có",
                LoaiYeuCau = p.LoaiYeuCau ?? "",
                MoTa = p.NoiDung ?? ""
            }).ToList();

            // Dropdown data
            ViewBag.DichVus = await _context.DichVus
                .Where(x => x.TrangThai == "Hoạt động")
                .OrderBy(x => x.TenDichVu)
                .ToListAsync();

            ViewBag.NhanViens = await _context.NhanViens
                .Where(x => x.TrangThai == "Hoạt động")
                .OrderBy(x => x.HoTen)
                .ToListAsync();

            // Stats for KPI
            var baseKpiQuery = _context.PhieuHoTros.AsQueryable();
            if (isStaffRole)
            {
                baseKpiQuery = baseKpiQuery.Where(x => x.IdNhanVien == userId.Value);
            }

            ViewBag.TotalTickets = totalItems;
            ViewBag.WaitingTickets = await baseKpiQuery.CountAsync(x => x.TrangThai == "Chờ tiếp nhận" || x.TrangThai == "ChoTiepNhan");
            ViewBag.ProcessingTickets = await baseKpiQuery.CountAsync(x => x.TrangThai == "Đang xử lý" || x.TrangThai == "DangXuLy");
            ViewBag.CompletedTickets = await baseKpiQuery.CountAsync(x => x.TrangThai == "Hoàn thành" || x.TrangThai == "DaHoanThanh" || x.TrangThai == "Đã hoàn thành");
            ViewBag.CancelledTickets = await baseKpiQuery.CountAsync(x => x.TrangThai == "Đã hủy" || x.TrangThai == "DaHuy");
            ViewBag.UrgentTickets = await baseKpiQuery.CountAsync(x => x.MucDoUuTien == 4);
            ViewBag.AppointmentTickets = await baseKpiQuery.CountAsync(x => x.CanLichHen == "Có");

            // Chart data
            ViewBag.StatusChartData = new
            {
                waiting = ViewBag.WaitingTickets,
                processing = ViewBag.ProcessingTickets,
                completed = ViewBag.CompletedTickets,
                cancelled = ViewBag.CancelledTickets
            };

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            ViewBag.Keyword = keyword;
            ViewBag.Status = status;
            ViewBag.Priority = priority;
            ViewBag.Service = service;
            ViewBag.Staff = staff;
            ViewBag.Sort = sort;

            return View(viewModel);
        }

        [HttpGet]
        public async Task<IActionResult> GetDanhSachPhieu(
            string keyword,
            string status,
            string priority,
            int? service,
            int? staff,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
        {
            var (userId, role) = GetStaffSessionInfo();
            bool isStaffRole = (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && userId.HasValue;

            var query = _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .AsQueryable();

            if (isStaffRole)
            {
                query = query.Where(x => x.IdNhanVien == userId.Value);
            }
            else if (staff.HasValue)
            {
                query = query.Where(x => x.IdNhanVien == staff);
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.MaPhieu.Contains(keyword)
                    || x.TieuDe.Contains(keyword)
                    || x.IdKhachHangNavigation.HoTen.Contains(keyword));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.TrangThai == status);
            }

            if (!string.IsNullOrWhiteSpace(priority))
            {
                if (int.TryParse(priority, out int prio))
                {
                    query = query.Where(x => x.MucDoUuTien == prio);
                }
            }

            if (service.HasValue)
            {
                query = query.Where(x => x.IdDichVu == service);
            }

            if (staff.HasValue)
            {
                query = query.Where(x => x.IdNhanVien == staff);
            }

            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao).ThenBy(x => x.IdPhieu);
                    break;
                case "az":
                    query = query.OrderBy(x => x.TieuDe).ThenByDescending(x => x.IdPhieu);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.TieuDe).ThenByDescending(x => x.IdPhieu);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao).ThenByDescending(x => x.IdPhieu);
                    break;
            }

            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var viewModel = items.Select(p => new DanhSachPhieuViewModel
            {
                IdPhieu = p.IdPhieu,
                MaPhieu = p.MaPhieu,
                TieuDe = p.TieuDe,
                TenKhachHang = p.IdKhachHangNavigation?.HoTen ?? "",
                SoDienThoai = p.IdKhachHangNavigation?.SoDienThoai ?? "",
                TenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "",
                TenDanhMuc = p.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                TenNhanVien = p.IdNhanVienNavigation?.HoTen ?? "",
                TrangThai = p.TrangThai ?? "",
                MucDoUuTien = p.MucDoUuTien ?? 0,
                NgayTao = p.NgayTao,
                NgayCapNhat = p.NgayCapNhat,
                CanHen = p.CanLichHen == "Có",
                LoaiYeuCau = p.LoaiYeuCau ?? "",
                MoTa = p.NoiDung ?? ""
            }).ToList();

            ViewBag.TotalItems = totalItems;
            ViewBag.TotalPages = totalPages;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1;
            ViewBag.EndItem = Math.Min(page * pageSize, totalItems);

            return PartialView("_DanhSachPhieu", viewModel);
        }



        // Quản lý phiếu hỗ trợ (mô hình MVC chuẩn)
        [HttpGet]
        [Route("Staff/QuanLyPhieuHoTro")]
        public async Task<IActionResult> QuanLyPhieuHoTro(
            string keyword,
            string status,
            string priority,
            int? categoryId,
            int? serviceId,
            int? staffId,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
        {
            var (userId, role) = GetStaffSessionInfo();
            bool isStaffRole = (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ") && userId.HasValue;

            var baseQuery = _context.PhieuHoTros.AsNoTracking();
            if (isStaffRole)
            {
                baseQuery = baseQuery.Where(x => x.IdNhanVien == userId.Value);
            }

            // Tính toán số liệu thống kê (phát sinh từ DB trước khi áp bộ lọc)
            var totalTickets = await baseQuery.CountAsync();
            var waitingTickets = await baseQuery.CountAsync(x => x.TrangThai == "Chờ tiếp nhận" || x.TrangThai == "ChoTiepNhan");
            var processingTickets = await baseQuery.CountAsync(x => x.TrangThai == "Đang xử lý" || x.TrangThai == "DangXuLy");
            var completedTickets = await baseQuery.CountAsync(x => x.TrangThai == "Hoàn thành" || x.TrangThai == "DaHoanThanh" || x.TrangThai == "Đã hoàn thành");
            var cancelledTickets = await baseQuery.CountAsync(x => x.TrangThai == "Đã hủy" || x.TrangThai == "DaHuy");
            var urgentTickets = await baseQuery.CountAsync(x => x.MucDoUuTien == 4);
            var appointmentTickets = await baseQuery.CountAsync(x => x.CanLichHen == "Có");

            var query = _context.PhieuHoTros
                .AsNoTracking()
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .Include(x => x.LichHens)
                .Include(x => x.DanhGium)
                .AsQueryable();

            if (isStaffRole)
            {
                query = query.Where(x => x.IdNhanVien == userId.Value);
            }
            else if (staffId.HasValue)
            {
                query = query.Where(x => x.IdNhanVien == staffId.Value);
            }

            // Tìm kiếm LINQ
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(x =>
                    (x.MaPhieu != null && x.MaPhieu.ToLower().Contains(kw)) ||
                    (x.TieuDe != null && x.TieuDe.ToLower().Contains(kw)) ||
                    (x.IdKhachHangNavigation != null && x.IdKhachHangNavigation.HoTen.ToLower().Contains(kw)) ||
                    (x.IdKhachHangNavigation != null && x.IdKhachHangNavigation.SoDienThoai.Contains(kw))
                );
            }

            // Lọc trạng thái
            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                if (status == "waiting")
                    query = query.Where(x => x.TrangThai == "Chờ tiếp nhận" || x.TrangThai == "ChoTiepNhan");
                else if (status == "processing")
                    query = query.Where(x => x.TrangThai == "Đang xử lý" || x.TrangThai == "DangXuLy");
                else if (status == "feedback")
                    query = query.Where(x => x.TrangThai == "Chờ phản hồi" || x.TrangThai == "ChoKhachHangPhanHoi");
                else if (status == "completed")
                    query = query.Where(x => x.TrangThai == "Hoàn thành" || x.TrangThai == "DaHoanThanh" || x.TrangThai == "Đã hoàn thành");
                else if (status == "cancelled")
                    query = query.Where(x => x.TrangThai == "Đã hủy" || x.TrangThai == "DaHuy");
                else
                    query = query.Where(x => x.TrangThai == status);
            }

            // Lọc mức độ ưu tiên
            if (!string.IsNullOrWhiteSpace(priority) && priority != "all")
            {
                int? prioLevel = priority switch
                {
                    "Thấp" => 1,
                    "Trung Binh" => 2,
                    "Trung Bình" => 2,
                    "Cao" => 3,
                    "Khẩn Cấp" => 4,
                    "Khẩn cấp" => 4,
                    _ => null
                };
                if (prioLevel.HasValue)
                {
                    query = query.Where(x => x.MucDoUuTien == prioLevel.Value);
                }
            }

            // Lọc danh mục
            if (categoryId.HasValue)
            {
                query = query.Where(x => x.IdDichVuNavigation != null && x.IdDichVuNavigation.IdDanhMuc == categoryId.Value);
            }

            // Lọc dịch vụ
            if (serviceId.HasValue)
            {
                query = query.Where(x => x.IdDichVu == serviceId.Value);
            }

            // Lọc nhân viên phụ trách
            if (staffId.HasValue)
            {
                query = query.Where(x => x.IdNhanVien == staffId.Value);
            }

            // Sắp xếp (ưu tiên phiếu vừa tạo lên đầu danh sách)
            switch (sort)
            {
                case "oldest":
                    query = query.OrderBy(x => x.NgayTao).ThenBy(x => x.IdPhieu);
                    break;
                case "az":
                    query = query.OrderBy(x => x.TieuDe).ThenByDescending(x => x.IdPhieu);
                    break;
                case "za":
                    query = query.OrderByDescending(x => x.TieuDe).ThenByDescending(x => x.IdPhieu);
                    break;
                default:
                    query = query.OrderByDescending(x => x.NgayTao).ThenByDescending(x => x.IdPhieu);
                    break;
            }

            // Phân trang
            int totalItems = await query.CountAsync();
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            // Ánh xạ sang Row ViewModel
            var listPhieu = items.Select(p =>
            {
                var latestAppt = p.LichHens.OrderByDescending(lh => lh.NgayHen).FirstOrDefault();
                string chatLuongText = "Chưa đánh giá";
                if (p.DanhGium != null)
                {
                    chatLuongText = p.DanhGium.ChatLuongDichVu.HasValue ? p.DanhGium.ChatLuongDichVu.Value + " sao" : "Đã đánh giá";
                }

                return new PhieuHoTroRowViewModel
                {
                    IdPhieu = p.IdPhieu,
                    MaPhieu = p.MaPhieu,
                    TieuDe = p.TieuDe ?? "",
                    HoTenKhachHang = p.IdKhachHangNavigation?.HoTen ?? "",
                    SoDienThoai = p.IdKhachHangNavigation?.SoDienThoai ?? "",
                    TenDanhMuc = p.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                    TenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "",
                    NhanVienPhuTrach = p.IdNhanVienNavigation?.HoTen ?? "",
                    LoaiYeuCau = p.LoaiYeuCau ?? "",
                    MucDoUuTien = p.MucDoUuTien ?? 1,
                    TrangThai = p.TrangThai ?? "",
                    NgayTao = p.NgayTao,
                    NgayHen = latestAppt?.NgayHen,
                    ChatLuongDanhGia = chatLuongText
                };
            }).ToList();

            // Chuẩn bị dữ liệu cho Dropdowns trong filter
            ViewBag.DanhMucs = await _context.DanhMucs
                .Where(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động")
                .OrderBy(x => x.TenDanhMuc)
                .ToListAsync();

            ViewBag.DichVus = await _context.DichVus
                .Where(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động")
                .OrderBy(x => x.TenDichVu)
                .ToListAsync();

            ViewBag.NhanViens = await _context.NhanViens
                .Where(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động")
                .OrderBy(x => x.HoTen)
                .ToListAsync();

            // Tổng hợp view model chính
            var model = new QuanLyPhieuHoTroViewModel
            {
                DanhSachPhieu = listPhieu,
                TotalTickets = totalTickets,
                WaitingTickets = waitingTickets,
                ProcessingTickets = processingTickets,
                CompletedTickets = completedTickets,
                CancelledTickets = cancelledTickets,
                UrgentTickets = urgentTickets,
                AppointmentTickets = appointmentTickets,

                Keyword = keyword,
                Status = status,
                Priority = priority,
                CategoryId = categoryId,
                ServiceId = serviceId,
                StaffId = staffId,

                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = page,
                PageSize = pageSize,
                StartItem = totalItems == 0 ? 0 : (page - 1) * pageSize + 1,
                EndItem = Math.Min(page * pageSize, totalItems),
                Sort = sort
            };

            // Trả thêm dữ liệu biểu đồ
            ViewBag.StatusChartData = new
            {
                waiting = waitingTickets,
                processing = processingTickets,
                completed = completedTickets,
                cancelled = cancelledTickets
            };

            return View(model);
        }

        // GET: PhanCongNhanVien
        [HttpGet]
        [Route("Staff/PhanCongNhanVien/{id}")]
        public async Task<IActionResult> PhanCongNhanVien(int id)
        {
            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(d => d.IdDanhMucNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return NotFound();
            }

            var nhanViens = await _context.NhanViens
                .Where(n => n.VaiTro == "Nhân viên" && n.TrangThai == "Hoạt động")
                .OrderBy(n => n.HoTen)
                .ToListAsync();

            ViewBag.NhanViens = nhanViens;

            var model = new PhanCongNhanVienViewModel
            {
                IdPhieu = phieu.IdPhieu,
                MaPhieu = phieu.MaPhieu,
                TieuDe = phieu.TieuDe ?? "",
                KhachHang = phieu.IdKhachHangNavigation?.HoTen ?? "Chưa rõ",
                DichVu = phieu.IdDichVuNavigation?.TenDichVu ?? "Chưa rõ",
                TrangThaiHienTai = phieu.TrangThai ?? "Chờ tiếp nhận",
                NhanVienHienTai = phieu.IdNhanVienNavigation?.HoTen ?? "",
                IdNhanVien = phieu.IdNhanVien ?? 0
            };

            return PartialView("_PhanCongNhanVienModal", model);
        }

        // POST: PhanCongNhanVien
        [HttpPost]
        [Route("Staff/PhanCongNhanVien/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PhanCongNhanVien(int id, PhanCongNhanVienViewModel model)
        {
            if (id != model.IdPhieu)
            {
                return Json(new { success = false, message = "Dữ liệu không khớp." });
            }

            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Vui lòng chọn nhân viên phụ trách hợp lệ." });
            }

            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdNhanVienNavigation)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return Json(new { success = false, message = "Không tìm thấy phiếu hỗ trợ." });
            }

            var nhanVien = await _context.NhanViens
                .FirstOrDefaultAsync(n => n.IdNhanVien == model.IdNhanVien && n.VaiTro == "Nhân viên" && n.TrangThai == "Hoạt động");

            if (nhanVien == null)
            {
                return Json(new { success = false, message = "Nhân viên không tồn tại hoặc đã bị vô hiệu hóa." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var trangThaiCu = phieu.TrangThai;
                var trangThaiMoi = trangThaiCu;

                // Nếu trạng thái đang là Chờ tiếp nhận thì đổi thành Đang xử lý
                if (trangThaiCu == "Chờ tiếp nhận" || trangThaiCu == "ChoTiepNhan")
                {
                    trangThaiMoi = "Đang xử lý";
                }

                // Cập nhật phiếu
                phieu.IdNhanVien = model.IdNhanVien;
                phieu.TrangThai = trangThaiMoi;
                phieu.NgayCapNhat = DateOnly.FromDateTime(DateTime.Now);

                // Thêm lịch sử hỗ trợ
                var lichSu = new LichSuHoTro
                {
                    IdPhieu = phieu.IdPhieu,
                    TrangThaiCu = trangThaiCu,
                    TrangThaiMoi = trangThaiMoi,
                    NoiDungCapNhat = $"Hệ thống tự động phân công phiếu cho nhân viên {nhanVien.HoTen}.",
                    IdNhanVien = model.IdNhanVien,
                    NgayCapNhat = DateOnly.FromDateTime(DateTime.Now)
                };

                _context.LichSuHoTros.Add(lichSu);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                TempData["SuccessMessage"] = "Phân công nhân viên thành công.";
                TempData["Success"] = "Phân công nhân viên thành công.";

                return Json(new { success = true, message = "Phân công nhân viên thành công." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Json(new { success = false, message = "Lỗi trong quá trình phân công: " + ex.Message });
            }
        }

        // GET: CapNhatTrangThai
        [HttpGet]
        [Route("Staff/CapNhatTrangThai/{id}")]
        public async Task<IActionResult> CapNhatTrangThai(int id)
        {
            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.LichSuHoTros)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null) return NotFound();

            return View(phieu);
        }

        // POST: CapNhatTrangThai
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Route("Staff/CapNhatTrangThai/{id}")]
        public async Task<IActionResult> CapNhatTrangThai(int id, string trangThai, string? ghiChu)
        {
            var phieu = await _context.PhieuHoTros.FindAsync(id);
            if (phieu == null) return NotFound();

            if (phieu.TrangThai == "Đã hủy" || phieu.TrangThai == "DaHuy")
            {
                TempData["Error"] = "Không thể thay đổi trạng thái của phiếu hỗ trợ đã bị hủy.";
                return RedirectToAction("QuanLyPhieuHoTro");
            }

            var (userId, role) = GetStaffSessionInfo();
            if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                if (userId.HasValue && phieu.IdNhanVien != userId.Value)
                {
                    TempData["Error"] = "Bạn không có quyền truy cập phiếu hỗ trợ này.";
                    return RedirectToAction("QuanLyPhieuHoTro");
                }
            }

            var trangThaiCu = phieu.TrangThai;
            phieu.TrangThai = trangThai;
            phieu.NgayCapNhat = DateOnly.FromDateTime(DateTime.Today);

            var log = new LichSuHoTro
            {
                IdPhieu = id,
                IdNhanVien = userId ?? phieu.IdNhanVien,
                TrangThaiCu = trangThaiCu,
                TrangThaiMoi = trangThai,
                NoiDungCapNhat = string.IsNullOrWhiteSpace(ghiChu) ? $"Cập nhật trạng thái phiếu: {trangThai}" : ghiChu,
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Today)
            };
            _context.LichSuHoTros.Add(log);

            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = "Cập nhật trạng thái phiếu hỗ trợ thành công.";
            return RedirectToAction("QuanLyPhieuHoTro");
        }

        // GET: LichSuXuLy
        [HttpGet]
        [Route("Staff/LichSuXuLy/{id}")]
        public async Task<IActionResult> LichSuXuLy(int id)
        {
            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.LichSuHoTros)
                    .ThenInclude(x => x.IdNhanVienNavigation)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null) return NotFound();

            var (userId, role) = GetStaffSessionInfo();
            if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                if (userId.HasValue && phieu.IdNhanVien != userId.Value)
                {
                    TempData["Error"] = "Bạn không có quyền truy cập phiếu hỗ trợ này.";
                    return RedirectToAction("QuanLyPhieuHoTro");
                }
            }

            return View(phieu);
        }

        [HttpGet]
        [Route("Staff/_ChiTietPhieuHoTro/{id}")]
        public async Task<IActionResult> _ChiTietPhieuHoTro(int id)
        {
            var phieu = await _context.PhieuHoTros
                .AsNoTracking()
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .Include(x => x.LichSuHoTros)
                    .ThenInclude(x => x.IdNhanVienNavigation)
                .Include(x => x.FileDinhKems)
                .Include(x => x.LichHens)
                .Include(x => x.DanhGium)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return NotFound();
            }

            var (userId, role) = GetStaffSessionInfo();
            if (role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
            {
                if (userId.HasValue && phieu.IdNhanVien != userId.Value)
                {
                    TempData["Error"] = "Bạn không có quyền truy cập phiếu hỗ trợ này.";
                    return RedirectToAction("QuanLyPhieuHoTro");
                }
            }

            var latestAppt = phieu.LichHens.OrderByDescending(lh => lh.NgayHen).FirstOrDefault();

            var viewModel = new ChiTietPhieuViewModel
            {
                IdPhieu = phieu.IdPhieu,
                MaPhieu = phieu.MaPhieu ?? "",
                TieuDe = phieu.TieuDe ?? "",
                NoiDung = phieu.NoiDung ?? "",
                TrangThai = phieu.TrangThai ?? "",
                LoaiYeuCau = phieu.LoaiYeuCau ?? "",
                MucDoUuTien = phieu.MucDoUuTien ?? 1,
                NgayTao = phieu.NgayTao ?? DateOnly.FromDateTime(DateTime.Today),
                HoTen = phieu.IdKhachHangNavigation?.HoTen ?? "",
                SoDienThoai = phieu.IdKhachHangNavigation?.SoDienThoai ?? "",
                Email = phieu.IdKhachHangNavigation?.Email ?? "",
                DiaChiKhachHang = phieu.IdKhachHangNavigation?.DiaChi,
                TenDanhMuc = phieu.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                TenDichVu = phieu.IdDichVuNavigation?.TenDichVu ?? "",
                TenNhanVien = phieu.IdNhanVienNavigation?.HoTen ?? "",
                SoDienThoaiNV = phieu.IdNhanVienNavigation?.SoDienThoai ?? "",
                DiaChi = latestAppt?.DiaChiHoTro,
                NgayHen = latestAppt?.NgayHen,
                GioHen = latestAppt?.GioBatDau,
                SoSao = phieu.DanhGium?.ChatLuongDichVu,
                NhanXet = phieu.DanhGium?.NhanXet,
                DanhGia = phieu.DanhGium,

                LichHens = phieu.LichHens.OrderByDescending(lh => lh.NgayHen).Select(lh => new SupportTicketSysterm.ViewModels.LichHenViewModel
                {
                    IdLichHen = lh.IdLichHen,
                    NgayHen = lh.NgayHen,
                    GioBatDau = lh.GioBatDau,
                    GioKetThuc = lh.GioKetThuc,
                    DiaChiHoTro = lh.DiaChiHoTro,
                    TrangThai = lh.TrangThai,
                    GhiChu = lh.GhiChu,
                    TenKyThuatVien = lh.IdNhanVienNavigation?.HoTen,
                    SoDienThoaiKyThuatVien = lh.IdNhanVienNavigation?.SoDienThoai
                }).ToList(),

                LichSuXuLys = phieu.LichSuHoTros.OrderByDescending(s => s.NgayCapNhat).ThenByDescending(s => s.IdLichSu).Select(s => new LichSuXuLyViewModel
                {
                    IdLichSu = s.IdLichSu,
                    ThoiGian = s.NgayCapNhat?.ToString("dd/MM/yyyy"),
                    TenNhanVien = s.IdNhanVienNavigation?.HoTen ?? "Hệ thống",
                    NoiDung = s.NoiDungCapNhat,
                    TrangThaiCu = s.TrangThaiCu,
                    TrangThaiMoi = s.TrangThaiMoi,
                    NgayCapNhat = s.NgayCapNhat,
                    NoiDungCapNhat = s.NoiDungCapNhat,
                    IdNhanVienNavigation = s.IdNhanVienNavigation != null ? new NhanVienCompat { HoTen = s.IdNhanVienNavigation.HoTen } : null
                }).ToList(),

                FileDinhKems = phieu.FileDinhKems.Select(f => new FileDinhKemViewModel
                {
                    IdFile = f.IdFile,
                    TenFile = f.TenFile,
                    DuongDan = f.DuongDan,
                    LoaiFile = f.LoaiFile,
                    NgayUpload = f.NgayUpload?.ToString("dd/MM/yyyy HH:mm") ?? "—",
                    NguoiTai = f.IdTinNhanNavigation != null
                        ? (f.IdTinNhanNavigation.LoaiNguoiGui == "KhachHang" ? "Khách hàng" : "Nhân viên")
                        : "Khách hàng"
                }).ToList()
            };

            return View("_ChiTietPhieuHoTro", viewModel);
        }



        #region Phản hồi đánh giá khách hàng
        [HttpGet]
        public async Task<IActionResult> DanhSachDanhGia(
            string keyword,
            string status,
            string sort = "newest",
            int page = 1)
        {
            var (userId, role) = GetStaffSessionInfo();
            int pageSize = 5;
            var viewModel = await _danhGiaService.GetRatingListForUserAsync(userId ?? 0, role, keyword, status, sort, page, pageSize);
            return View(viewModel);
        }

        [HttpGet]
        public async Task<IActionResult> PhanHoiDanhGia(int id)
        {
            var (userId, role) = GetStaffSessionInfo();
            bool canReply = await _danhGiaService.CanUserReplyRatingAsync(id, userId ?? 0, role);
            if (!canReply)
            {
                TempData["Error"] = "Bạn không có quyền phản hồi đánh giá này.";
                return RedirectToAction(nameof(DanhSachDanhGia));
            }

            var reviewDetails = await _danhGiaService.GetRatingForReplyAsync(id, userId ?? 0, role);
            if (reviewDetails == null)
            {
                return NotFound();
            }

            var model = new PhanHoiDanhGiaViewModel
            {
                IdDanhGia = reviewDetails.IdDanhGia,
                PhanHoiNhanVien = reviewDetails.PhanHoiNhanVien ?? "",
                IdNhanVienPhanHoi = userId,
                NgayPhanHoi = reviewDetails.NgayPhanHoi,
                ReviewDetails = reviewDetails
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PhanHoiDanhGia(PhanHoiDanhGiaViewModel model)
        {
            var (userId, role) = GetStaffSessionInfo();
            if (!userId.HasValue || userId.Value <= 0)
            {
                return Challenge();
            }

            var (success, message, statusCode) = await _danhGiaService.SaveReplyAsync(model.IdDanhGia, model.PhanHoiNhanVien ?? "", userId.Value, role);
            if (!success)
            {
                if (statusCode == 403)
                {
                    return StatusCode(403, message);
                }
                TempData["Error"] = message;
                return RedirectToAction(nameof(DanhSachDanhGia));
            }

            TempData["SuccessMessage"] = message;
            return RedirectToAction(nameof(DanhSachDanhGia));
        }
        #endregion

        #region Quản lý lịch hẹn

        // ============================================================
        //  GET: ChiTietLichHen – Trang chi tiết lịch hẹn hỗ trợ kỹ thuật (Full Page)
        // ============================================================
        [HttpGet]
        [Route("Staff/ChiTietLichHen/{id:int?}")]
        [Route("Staff/ChiTietLichHen")]
        [Route("Staff/QuanLyLichHen/ChiTiet/{id:int?}")]
        public async Task<IActionResult> ChiTietLichHen(int? id)
        {
            if (!id.HasValue || id.Value <= 0)
            {
                TempData["ErrorMessage"] = "Không tìm thấy mã lịch hẹn.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            int currentUserId = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId") ?? 0;
            string currentUserRole = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? "NhanVien";
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            var appt = await _context.LichHens
                .Include(x => x.IdPhieuNavigation)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .Include(x => x.IdPhieuNavigation)
                    .ThenInclude(p => p.IdDichVuNavigation)
                        .ThenInclude(d => d.IdDanhMucNavigation)
                .Include(x => x.IdPhieuNavigation)
                    .ThenInclude(p => p.FileDinhKems)
                .Include(x => x.IdPhieuNavigation)
                    .ThenInclude(p => p.LichSuHoTros)
                        .ThenInclude(s => s.IdNhanVienNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .FirstOrDefaultAsync(x => x.IdLichHen == id.Value);

            if (appt == null)
            {
                TempData["ErrorMessage"] = $"Không tìm thấy thông tin lịch hẹn #{id.Value}.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            // Phân quyền RBAC: Nhân viên chỉ được xem lịch hẹn được phân công cho mình (trả về 403 Forbidden nếu không có quyền)
            bool isAssignedToUser = appt.IdNhanVien == currentUserId || (appt.IdPhieuNavigation != null && appt.IdPhieuNavigation.IdNhanVien == currentUserId);
            if (!isAdmin && !isAssignedToUser)
            {
                TempData["ErrorMessage"] = "403 Forbidden: Bạn không có quyền truy cập thông tin chi tiết lịch hẹn của nhân viên khác.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            var phieu = appt.IdPhieuNavigation;
            var khachHang = phieu?.IdKhachHangNavigation;
            var nhanVien = appt.IdNhanVienNavigation;

            var danhSachKTV = await _context.NhanViens
                .Where(n => n.TrangThai == "Hoạt động")
                .OrderBy(n => n.HoTen)
                .Select(n => new Microsoft.AspNetCore.Mvc.Rendering.SelectListItem
                {
                    Value = n.IdNhanVien.ToString(),
                    Text = $"{n.HoTen} ({n.SoDienThoai})"
                })
                .ToListAsync();

            var vm = new SupportTicketSysterm.Models.ViewModels.ChiTietLichHenViewModel
            {
                IdLichHen = appt.IdLichHen,
                TrangThai = appt.TrangThai,
                NgayHen = appt.NgayHen,
                GioBatDau = appt.GioBatDau,
                GioKetThuc = appt.GioKetThuc,
                DiaChiHoTro = appt.DiaChiHoTro,
                GhiChu = appt.GhiChu,
                NgayTao = appt.NgayTao,
                NguoiTao = appt.IdNhanVienNavigation?.HoTen ?? "Hệ thống",

                IdPhieu = phieu?.IdPhieu,
                MaPhieu = phieu?.MaPhieu ?? (phieu != null ? $"HD-{phieu.IdPhieu:D5}" : "--"),
                TieuDePhieu = phieu?.TieuDe,
                NoiDungPhieu = phieu?.NoiDung,
                MucDoUuTien = phieu?.MucDoUuTien,
                TrangThaiPhieu = phieu?.TrangThai,
                TenDichVu = phieu?.IdDichVuNavigation?.TenDichVu,
                TenDanhMuc = phieu?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc,

                IdKhachHang = khachHang?.IdKhachHang,
                TenKhachHang = khachHang?.HoTen ?? "Khách hàng",
                SoDienThoaiKH = khachHang?.SoDienThoai ?? "--",
                EmailKH = khachHang?.Email,
                DiaChiKH = khachHang?.DiaChi,

                IdNhanVien = nhanVien?.IdNhanVien,
                TenNhanVien = nhanVien?.HoTen ?? "Chưa phân công",
                SoDienThoaiNV = nhanVien?.SoDienThoai ?? "--",
                EmailNV = nhanVien?.Email,
                ChucVuNV = nhanVien?.VaiTro,

                DanhSachKTV = danhSachKTV,

                LichSuHoTros = phieu?.LichSuHoTros?
                    .OrderByDescending(s => s.IdLichSu)
                    .Select(s => new SupportTicketSysterm.Models.ViewModels.LichSuHoTroItemViewModel
                    {
                        IdLichSu = s.IdLichSu,
                        ThoiGian = s.NgayCapNhat.HasValue ? s.NgayCapNhat.Value.ToDateTime(TimeOnly.MinValue) : null,
                        NguoiThucHien = s.IdNhanVienNavigation?.HoTen ?? "Hệ thống",
                        TrangThaiCu = s.TrangThaiCu,
                        TrangThaiMoi = s.TrangThaiMoi,
                        NoiDung = s.NoiDungCapNhat
                    }).ToList() ?? new List<SupportTicketSysterm.Models.ViewModels.LichSuHoTroItemViewModel>(),

                FileDinhKems = phieu?.FileDinhKems?
                    .Select(f => new SupportTicketSysterm.Models.ViewModels.FileDinhKemItemViewModel
                    {
                        IdFile = f.IdFile,
                        TenFile = f.TenFile,
                        DuongDan = f.DuongDan,
                        LoaiFile = f.LoaiFile,
                        NgayUpload = f.NgayUpload
                    }).ToList() ?? new List<SupportTicketSysterm.Models.ViewModels.FileDinhKemItemViewModel>()
            };

            return View("ChiTietLichHen", vm);
        }

        // ============================================================
        //  GET: QuanLyLichHen – Trang chính quản lý lịch hẹn (100% Real SQL Server EF Core)
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> QuanLyLichHen(
            int? nhanVien,
            string? trangThai,
            int? danhMuc,
            string? tuNgay,
            string? denNgay,
            string? keyword,
            string sort = "newest",
            int page = 1,
            int pageSize = 20,
            int? thang = null,
            int? nam = null,
            int? selectedId = null)
        {
            // Lấy thông tin user hiện tại từ Session/User
            int currentUserId = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId") ?? 0;
            string currentUserRole = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? "NhanVien";
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            // Tháng / năm hiển thị calendar
            int calThang = thang ?? DateTime.Today.Month;
            int calNam = nam ?? DateTime.Today.Year;

            // ── LINQ: Query trực tiếp từ SQL Server EF Core với Include đầy đủ ──
            var query = _context.LichHens
                .Include(x => x.IdPhieuNavigation)
                    .ThenInclude(p => p.IdKhachHangNavigation)
                .Include(x => x.IdPhieuNavigation)
                    .ThenInclude(p => p.IdDichVuNavigation)
                        .ThenInclude(d => d.IdDanhMucNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .AsQueryable();

            // ── Phân quyền RBAC ──
            if (!isAdmin)
            {
                // Đối với nhân viên: chỉ lấy đúng các lịch hẹn phân công cho nhân viên đó
                query = query.Where(x => x.IdNhanVien == currentUserId || (x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdNhanVien == currentUserId));
                nhanVien = currentUserId;

                // Kiểm tra nếu selectedId truyền vào của nhân viên khác thì chặn lại
                if (selectedId.HasValue)
                {
                    bool isOwner = await _context.LichHens.AnyAsync(l => l.IdLichHen == selectedId.Value && (l.IdNhanVien == currentUserId || (l.IdPhieuNavigation != null && l.IdPhieuNavigation.IdNhanVien == currentUserId)));
                    if (!isOwner)
                    {
                        TempData["ErrorMessage"] = "Bạn không có quyền xem thông tin lịch hẹn của nhân viên khác.";
                        selectedId = null;
                    }
                }
            }
            else if (nhanVien.HasValue)
            {
                // Đối với Admin: nếu lọc theo KTV cụ thể
                query = query.Where(x => x.IdNhanVien == nhanVien.Value || (x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdNhanVien == nhanVien.Value));
            }

            if (!string.IsNullOrWhiteSpace(trangThai))
                query = query.Where(x => x.TrangThai == trangThai);

            if (danhMuc.HasValue)
                query = query.Where(x =>
                    x.IdPhieuNavigation != null &&
                    x.IdPhieuNavigation.IdDichVuNavigation != null &&
                    x.IdPhieuNavigation.IdDichVuNavigation.IdDanhMuc == danhMuc.Value);

            if (DateOnly.TryParse(tuNgay, out var dateFrom))
                query = query.Where(x => x.NgayHen >= dateFrom);

            if (DateOnly.TryParse(denNgay, out var dateTo))
                query = query.Where(x => x.NgayHen <= dateTo);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(x =>
                    (x.IdPhieuNavigation != null && x.IdPhieuNavigation.MaPhieu.ToLower().Contains(kw)) ||
                    (x.IdPhieuNavigation != null && x.IdPhieuNavigation.TieuDe != null && x.IdPhieuNavigation.TieuDe.ToLower().Contains(kw)) ||
                    (x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdKhachHangNavigation != null &&
                     x.IdPhieuNavigation.IdKhachHangNavigation.HoTen.ToLower().Contains(kw)) ||
                    (x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdKhachHangNavigation != null &&
                     x.IdPhieuNavigation.IdKhachHangNavigation.SoDienThoai.Contains(kw)));
            }

            // ── Sắp xếp ──
            query = sort switch
            {
                "oldest" => query.OrderBy(x => x.NgayHen).ThenBy(x => x.GioBatDau),
                "priority" => query.OrderByDescending(x => x.IdPhieuNavigation != null ? x.IdPhieuNavigation.MucDoUuTien : 0)
                                   .ThenBy(x => x.NgayHen),
                "az" => query.OrderBy(x => x.IdPhieuNavigation != null && x.IdPhieuNavigation.IdKhachHangNavigation != null
                                   ? x.IdPhieuNavigation.IdKhachHangNavigation.HoTen : ""),
                _ => query.OrderByDescending(x => x.NgayHen).ThenBy(x => x.GioBatDau)
            };

            // ── Thực thi query trực tiếp từ SQL Server (1 lần) ──
            var allItems = await query.ToListAsync();

            // ── KPI: tính từ lịch hẹn hôm nay ──
            var today = DateOnly.FromDateTime(DateTime.Today);
            var todayList = allItems.Where(x => x.NgayHen == today).ToList();

            // ── Map sang ViewModel ──
            SupportTicketSysterm.Models.LichHenViewModel MapToVm(Data.LichHen x) => new SupportTicketSysterm.Models.LichHenViewModel
            {
                IdLichHen = x.IdLichHen,
                TrangThai = x.TrangThai,
                NgayHen = x.NgayHen,
                GioBatDau = x.GioBatDau,
                GioKetThuc = x.GioKetThuc,
                DiaChiHoTro = x.DiaChiHoTro,
                GhiChu = x.GhiChu,
                IdPhieu = x.IdPhieu,
                MaPhieu = x.IdPhieuNavigation?.MaPhieu ?? string.Empty,
                TieuDe = x.IdPhieuNavigation?.TieuDe,
                MucDoUuTien = x.IdPhieuNavigation?.MucDoUuTien,
                TrangThaiPhieu = x.IdPhieuNavigation?.TrangThai,
                CanLichHen = x.IdPhieuNavigation?.CanLichHen,
                TenDichVu = x.IdPhieuNavigation?.IdDichVuNavigation?.TenDichVu,
                TenDanhMuc = x.IdPhieuNavigation?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc,
                IdKhachHang = x.IdPhieuNavigation?.IdKhachHang,
                TenKhachHang = x.IdPhieuNavigation?.IdKhachHangNavigation?.HoTen ?? string.Empty,
                SoDienThoaiKH = x.IdPhieuNavigation?.IdKhachHangNavigation?.SoDienThoai ?? string.Empty,
                EmailKH = x.IdPhieuNavigation?.IdKhachHangNavigation?.Email,
                DiaChiKH = x.IdPhieuNavigation?.IdKhachHangNavigation?.DiaChi,
                IdNhanVien = x.IdNhanVien ?? x.IdPhieuNavigation?.IdNhanVien,
                TenNhanVien = x.IdNhanVienNavigation?.HoTen ?? x.IdPhieuNavigation?.IdNhanVienNavigation?.HoTen ?? "Chưa phân công",
                SoDienThoaiNV = x.IdNhanVienNavigation?.SoDienThoai ?? x.IdPhieuNavigation?.IdNhanVienNavigation?.SoDienThoai ?? string.Empty,
                EmailNV = x.IdNhanVienNavigation?.Email ?? x.IdPhieuNavigation?.IdNhanVienNavigation?.Email,
            };

            var allVm = allItems.Select(MapToVm).ToList();
            var todayVm = todayList.Select(MapToVm).OrderBy(x => x.GioBatDau).ToList();

            // ── Phân trang ──
            int totalItems = allVm.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var pagedVm = allVm.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // ── Chi tiết lịch được chọn ──
            SupportTicketSysterm.Models.LichHenViewModel? chiTiet = null;
            if (selectedId.HasValue)
                chiTiet = allVm.FirstOrDefault(x => x.IdLichHen == selectedId.Value)
                       ?? allVm.FirstOrDefault();
            else if (todayVm.Any())
                chiTiet = todayVm.First();

            // ── Dropdown NhanVien (VaiTro=Nhân viên, TrangThai=Hoạt động) từ SQL Server ──
            var danhSachNhanVien = await _context.NhanViens
                .Where(n => n.TrangThai == "Hoạt động")
                .OrderBy(n => n.HoTen)
                .Select(n => new Microsoft.AspNetCore.Mvc.Rendering.SelectListItem
                {
                    Value = n.IdNhanVien.ToString(),
                    Text = n.HoTen
                })
                .ToListAsync();

            // ── Dropdown DanhMuc từ SQL Server ──
            var danhSachDanhMuc = await _context.DanhMucs
                .Where(d => d.TrangThai == "Hoạt động")
                .OrderBy(d => d.TenDanhMuc)
                .Select(d => new Microsoft.AspNetCore.Mvc.Rendering.SelectListItem
                {
                    Value = d.IdDanhMuc.ToString(),
                    Text = d.TenDanhMuc
                })
                .ToListAsync();

            // ── Danh sách KTV từ SQL Server ──
            var danhSachKTV = await _context.NhanViens
                .Where(n => n.TrangThai == "Hoạt động")
                .OrderBy(n => n.HoTen)
                .Select(n => new Microsoft.AspNetCore.Mvc.Rendering.SelectListItem
                {
                    Value = n.IdNhanVien.ToString(),
                    Text = $"{n.HoTen} ({n.SoDienThoai})"
                })
                .ToListAsync();

            var statSource = todayList.Any() ? todayList : allItems;

            // ── Build ViewModel ──
            var vm = new Models.LichHenCalendarViewModel
            {
                DanhSachLichHen = pagedVm,
                DanhSachHomNay = todayVm,
                CalendarThang = calThang,
                CalendarNam = calNam,
                TongHomNay = allItems.Count,
                ChoXacNhan = statSource.Count(x => x.TrangThai == "Chờ xác nhận" || x.TrangThai == "ChoXacNhan"),
                DaXacNhan = statSource.Count(x => x.TrangThai == "Đã xác nhận" || x.TrangThai == "DaXacNhan"),
                DangThucHien = statSource.Count(x => x.TrangThai == "Đang thực hiện" || x.TrangThai == "DangThucHien" || x.TrangThai == "Đang hỗ trợ"),
                HoanThanh = statSource.Count(x => x.TrangThai == "Hoàn thành" || x.TrangThai == "DaHoanThanh" || x.TrangThai == "Đã hoàn thành"),
                DaHuy = statSource.Count(x => x.TrangThai == "Đã hủy" || x.TrangThai == "DaHuy"),
                DanhSachNhanVien = danhSachNhanVien,
                DanhSachDanhMuc = danhSachDanhMuc,
                DanhSachKTV = danhSachKTV,
                FilterNhanVien = nhanVien,
                FilterTrangThai = trangThai,
                FilterDanhMuc = danhMuc,
                FilterTuNgay = tuNgay,
                FilterDenNgay = denNgay,
                Keyword = keyword,
                Sort = sort,
                Page = page,
                PageSize = pageSize,
                TongTrang = totalPages,
                TongLichHen = totalItems,
                LichHenChiTiet = chiTiet,
                SelectedId = selectedId ?? chiTiet?.IdLichHen,
            };

            return View(vm);
        }

        // ============================================================
        //  POST: XacNhanLich – Chuyển trạng thái → "Đã xác nhận"
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> XacNhanLich(int id)
        {
            int currentUserId = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId") ?? 0;
            string currentUserRole = HttpContext.Session.GetString("Role") ?? "NhanVien";

            try
            {
                var dto = new AssignLichHenDto
                {
                    IdLichHen = id,
                    IdNhanVien = currentUserId
                };
                await _lichHenService.AssignAndConfirmAppointmentAsync(dto, currentUserId, currentUserRole);
                string msg = "Đã xác nhận lịch hẹn thành công.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = true, message = msg, idLichHen = id, trangThaiCode = "DaXacNhan", trangThaiTitle = "Đã xác nhận" });
                }
                TempData["SuccessMessage"] = msg;
            }
            catch (Exception ex)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = ex.Message });
                }
                TempData["ErrorMessage"] = ex.Message;
            }

            return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
        }

        // ============================================================
        //  POST: BatDauHoTro – Chuyển trạng thái → "Đang thực hiện"
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> BatDauHoTro(int id)
        {
            int currentUserId = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId") ?? 0;
            string currentUserRole = HttpContext.Session.GetString("Role") ?? "NhanVien";

            try
            {
                await _lichHenService.StartSupportAppointmentAsync(id, currentUserId, currentUserRole);
                string msg = "Đã cập nhật trạng thái: Đang thực hiện.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = true, message = msg, idLichHen = id, trangThaiCode = "DangThucHien", trangThaiTitle = "Đang thực hiện" });
                }
                TempData["SuccessMessage"] = msg;
            }
            catch (Exception ex)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = ex.Message });
                }
                TempData["ErrorMessage"] = ex.Message;
            }

            string referer = Request.Headers["Referer"].ToString();
            if (!string.IsNullOrEmpty(referer) && referer.Contains("ChiTietLichHen", StringComparison.OrdinalIgnoreCase))
            {
                return RedirectToAction(nameof(ChiTietLichHen), new { id });
            }
            return RedirectToAction(nameof(QuanLyLichHen));
        }

        // ============================================================
        //  POST: HoanThanhLich – Hoàn thành lịch + cập nhật phiếu
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> HoanThanhLich(int id, string? ketQuaXuLy, string? thietBiThayThe, string? khuyenNghi, string? ghiChuBoSung)
        {
            var (userId, userRole) = GetStaffSessionInfo();
            int currentUserId = userId ?? 0;
            string currentUserRole = userRole;

            if (string.IsNullOrWhiteSpace(ketQuaXuLy))
            {
                string validationMsg = "Vui lòng nhập Kết quả xử lý kỹ thuật trước khi xác nhận hoàn thành.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = validationMsg });
                }
                TempData["ErrorMessage"] = validationMsg;
                string referUrl = Request.Headers["Referer"].ToString();
                if (!string.IsNullOrEmpty(referUrl) && referUrl.Contains("ChiTietLichHen", StringComparison.OrdinalIgnoreCase))
                {
                    return RedirectToAction(nameof(ChiTietLichHen), new { id });
                }
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            try
            {
                var sb = new List<string>();
                if (!string.IsNullOrWhiteSpace(ketQuaXuLy)) sb.Add($"Kết quả xử lý: {ketQuaXuLy.Trim()}");
                if (!string.IsNullOrWhiteSpace(thietBiThayThe)) sb.Add($"Thiết bị thay thế: {thietBiThayThe.Trim()}");
                if (!string.IsNullOrWhiteSpace(khuyenNghi)) sb.Add($"Khuyến nghị: {khuyenNghi.Trim()}");
                if (!string.IsNullOrWhiteSpace(ghiChuBoSung)) sb.Add($"Ghi chú: {ghiChuBoSung.Trim()}");
                string ghiChuCombined = string.Join(" | ", sb);

                await _lichHenService.CompleteAppointmentAsync(id, currentUserId, currentUserRole, ghiChuCombined);
                string msg = "Lịch hẹn đã hoàn thành thành công. Trạng thái phiếu hỗ trợ đã được chuyển sang Hoàn thành.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = true, message = msg, idLichHen = id, trangThaiCode = "DaHoanThanh", trangThaiTitle = "Hoàn thành" });
                }
                TempData["SuccessMessage"] = msg;
            }
            catch (Exception ex)
            {
                string logDetail = ex.InnerException?.Message != null ? $"{ex.Message} -> Inner: {ex.InnerException.Message}" : ex.Message;
                Console.WriteLine($"[HoanThanhLich Error] {logDetail}");

                string displayMsg = ex.Message;
                if (ex is DbUpdateException || ex.InnerException != null)
                {
                    displayMsg = "Không thể cập nhật lịch hẹn và phiếu hỗ trợ do lỗi cơ sở dữ liệu. Vui lòng kiểm tra lại thông tin.";
                }

                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = displayMsg });
                }
                TempData["ErrorMessage"] = displayMsg;
            }

            string refUrl = Request.Headers["Referer"].ToString();
            if (!string.IsNullOrEmpty(refUrl) && refUrl.Contains("ChiTietLichHen", StringComparison.OrdinalIgnoreCase))
            {
                return RedirectToAction(nameof(ChiTietLichHen), new { id });
            }
            return RedirectToAction(nameof(QuanLyLichHen));
        }

        // ============================================================
        //  POST: HuyLich – Hủy lịch hẹn (Chỉ Admin / Quản lý)
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> HuyLich(int id, string? lyDoHuy)
        {
            int currentUserId = HttpContext.Session.GetInt32("IdNhanVien") ?? HttpContext.Session.GetInt32("UserId") ?? 0;
            string currentUserRole = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? "NhanVien";
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                string errMsg = "403 Forbidden: Nhân viên không có quyền hủy lịch hẹn.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest") return Json(new { success = false, message = errMsg });
                TempData["ErrorMessage"] = errMsg;
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            try
            {
                var dto = new CancelLichHenDto
                {
                    IdLichHen = id,
                    LyDoHuy = lyDoHuy ?? "Quản trị viên hủy lịch."
                };
                await _lichHenService.CancelAppointmentAsync(dto, currentUserId, currentUserRole);
                string msg = "Đã hủy lịch hẹn thành công.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = true, message = msg, idLichHen = id, trangThaiCode = "DaHuy", trangThaiTitle = "Đã hủy" });
                }
                TempData["SuccessMessage"] = msg;
            }
            catch (Exception ex)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = ex.Message });
                }
                TempData["ErrorMessage"] = ex.Message;
            }

            return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
        }

        // ============================================================
        //  POST: DoiKyThuatVien – Đổi KTV phụ trách (Chỉ Admin)
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DoiKyThuatVien(int id, int idNhanVienMoi)
        {
            string currentUserRole = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? "NhanVien";
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                TempData["ErrorMessage"] = "403 Forbidden: Nhân viên không có quyền đổi kỹ thuật viên phụ trách.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            var lichHen = await _context.LichHens.FindAsync(id);
            if (lichHen == null) return NotFound();

            if (lichHen.TrangThai == "Đang thực hiện" ||
                lichHen.TrangThai == "Hoàn thành" ||
                lichHen.TrangThai == "Đã hủy")
            {
                TempData["ErrorMessage"] = "Không thể đổi kỹ thuật viên ở trạng thái này.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            // Kiểm tra trùng lịch KTV mới
            bool trungLich = await _context.LichHens.AnyAsync(x =>
                x.IdLichHen != id &&
                x.IdNhanVien == idNhanVienMoi &&
                x.NgayHen == lichHen.NgayHen &&
                x.TrangThai != "Đã hủy" &&
                x.GioBatDau < lichHen.GioKetThuc &&
                x.GioKetThuc > lichHen.GioBatDau);

            if (trungLich)
            {
                TempData["ErrorMessage"] = "Kỹ thuật viên mới đã có lịch hẹn trùng giờ này.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            lichHen.IdNhanVien = idNhanVienMoi;
            _context.Update(lichHen);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Đã bàn giao lịch hẹn sang kỹ thuật viên mới.";
            return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
        }

        // ============================================================
        //  POST: DoiLichHen – Dời ngày/giờ lịch hẹn (Chỉ Admin)
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DoiLichHen(int id, string ngayHen, string gioBatDau, string gioKetThuc)
        {
            string currentUserRole = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? "NhanVien";
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                TempData["ErrorMessage"] = "403 Forbidden: Nhân viên không có quyền thay đổi ngày giờ lịch hẹn.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            var lichHen = await _context.LichHens.FindAsync(id);
            if (lichHen == null) return NotFound();

            if (lichHen.TrangThai == "Hoàn thành" || lichHen.TrangThai == "Đã hủy")
            {
                TempData["ErrorMessage"] = "Không thể dời lịch đã kết thúc hoặc đã hủy.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            if (!DateOnly.TryParse(ngayHen, out var newNgay) ||
                !TimeOnly.TryParse(gioBatDau, out var newGioBD) ||
                !TimeOnly.TryParse(gioKetThuc, out var newGioKT))
            {
                TempData["ErrorMessage"] = "Định dạng ngày hoặc giờ không hợp lệ.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            if (newGioBD >= newGioKT)
            {
                TempData["ErrorMessage"] = "Giờ bắt đầu phải trước giờ kết thúc.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            // Kiểm tra trùng lịch cùng KTV
            bool trungLich = await _context.LichHens.AnyAsync(x =>
                x.IdLichHen != id &&
                x.IdNhanVien == lichHen.IdNhanVien &&
                x.NgayHen == newNgay &&
                x.TrangThai != "Đã hủy" &&
                x.GioBatDau < newGioKT &&
                x.GioKetThuc > newGioBD);

            if (trungLich)
            {
                TempData["ErrorMessage"] = "Kỹ thuật viên đã có lịch hẹn khác trong khung giờ này.";
                return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
            }

            lichHen.NgayHen = newNgay;
            lichHen.GioBatDau = newGioBD;
            lichHen.GioKetThuc = newGioKT;
            _context.Update(lichHen);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Đã cập nhật lịch hẹn sang khung giờ mới.";
            return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = id });
        }

        // ============================================================
        //  POST: ThemLichHen – Tạo lịch hẹn mới (Chỉ Admin)
        // ============================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ThemLichHen(Models.LichHenChiTietViewModel model)
        {
            string currentUserRole = HttpContext.Session.GetString("Role") ?? HttpContext.Session.GetString("VaiTro") ?? "NhanVien";
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("QuanTriVien") || currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                TempData["ErrorMessage"] = "403 Forbidden: Nhân viên không có quyền khởi tạo lịch hẹn mới.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            // Validate ngày / giờ
            if (!DateOnly.TryParse(model.NgayHenStr, out var ngayHen) ||
                !TimeOnly.TryParse(model.GioBatDauStr, out var gioBD) ||
                !TimeOnly.TryParse(model.GioKetThucStr, out var gioKT))
            {
                TempData["ErrorMessage"] = "Định dạng ngày hoặc giờ không hợp lệ.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            if (gioBD >= gioKT)
            {
                TempData["ErrorMessage"] = "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            // Kiểm tra phiếu có cho phép đặt lịch không
            var phieu = await _context.PhieuHoTros.FindAsync(model.IdPhieu);
            if (phieu == null)
            {
                TempData["ErrorMessage"] = "Phiếu hỗ trợ không tồn tại.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }
            if (phieu.CanLichHen == "Không")
            {
                TempData["ErrorMessage"] = "Phiếu hỗ trợ này không cho phép đặt lịch hẹn.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            // Kiểm tra trùng lịch KTV
            bool trungLich = await _context.LichHens.AnyAsync(x =>
                x.IdNhanVien == model.IdNhanVien &&
                x.NgayHen == ngayHen &&
                x.TrangThai != "Đã hủy" &&
                x.GioBatDau < gioKT &&
                x.GioKetThuc > gioBD);

            if (trungLich)
            {
                TempData["ErrorMessage"] = "Kỹ thuật viên đã có lịch hẹn trùng trong khung giờ này.";
                return RedirectToAction(nameof(QuanLyLichHen));
            }

            var newLichHen = new Data.LichHen
            {
                IdPhieu = model.IdPhieu,
                IdNhanVien = model.IdNhanVien,
                NgayHen = ngayHen,
                GioBatDau = gioBD,
                GioKetThuc = gioKT,
                DiaChiHoTro = model.DiaChiHoTro,
                GhiChu = model.GhiChu,
                TrangThai = "Chờ xác nhận"
            };

            _context.LichHens.Add(newLichHen);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = $"Đã tạo lịch hẹn mới thành công cho ngày {ngayHen:dd/MM/yyyy}.";
            return RedirectToAction(nameof(QuanLyLichHen), new { selectedId = newLichHen.IdLichHen });
        }

        [HttpGet]
        public async Task<IActionResult> TaiKhoanNhanVien()
        {
            var idNhanVien = HttpContext.Session.GetInt32("UserId") ?? HttpContext.Session.GetInt32("IdNhanVien");
            if (idNhanVien == null)
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("UserId")?.Value;
                if (int.TryParse(userIdClaim, out var parsedId))
                {
                    idNhanVien = parsedId;
                }
            }

            if (idNhanVien == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            var nv = await _context.NhanViens
                .FirstOrDefaultAsync(x => x.IdNhanVien == idNhanVien);

            if (nv == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            var model = new SupportTicketSysterm.ViewModels.TaiKhoanNhanVienViewModel
            {
                IdNhanVien = nv.IdNhanVien,
                MaNhanVien = nv.MaNhanVien ?? "NV" + nv.IdNhanVien.ToString("D4"),
                HoTen = nv.HoTen?.Trim() ?? "",
                Email = nv.Email?.Trim() ?? "",
                SoDienThoai = nv.SoDienThoai?.Trim() ?? "",
                Avatar = nv.Avatar?.Trim(),
                VaiTro = nv.VaiTro?.Trim()
            };

            return View("ThongTinCaNhan", model);
        }

        [HttpGet]
        public async Task<IActionResult> ThongTinCaNhan()
        {
            return await TaiKhoanNhanVien();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CapNhatThongTinCaNhan(SupportTicketSysterm.ViewModels.TaiKhoanNhanVienViewModel model)
        {
            var idNhanVien = HttpContext.Session.GetInt32("UserId") ?? HttpContext.Session.GetInt32("IdNhanVien") ?? model.IdNhanVien;
            var nv = await _context.NhanViens.FirstOrDefaultAsync(x => x.IdNhanVien == idNhanVien);
            if (nv == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            ModelState.Remove(nameof(model.MatKhauCu));
            ModelState.Remove(nameof(model.MatKhauMoi));
            ModelState.Remove(nameof(model.NhapLaiMatKhau));
            ModelState.Remove(nameof(model.AvatarFile));

            if (!ModelState.IsValid)
            {
                TempData["ErrorMessage"] = "Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.";
                return View("ThongTinCaNhan", model);
            }

            var emailDup = await _context.NhanViens.AnyAsync(x => x.IdNhanVien != idNhanVien && x.Email == model.Email);
            if (emailDup)
            {
                ModelState.AddModelError("Email", "Email này đã được sử dụng bởi nhân viên khác.");
                return View("ThongTinCaNhan", model);
            }

            nv.HoTen = model.HoTen.Trim();
            nv.Email = model.Email.Trim();
            nv.SoDienThoai = model.SoDienThoai.Trim();

            // var log = new SupportTicketSysterm.Data.LichSuHoatDong
            // {
            //     IdNhanVien = nv.IdNhanVien,
            //     NoiDung = "Cập nhật thông tin hồ sơ cá nhân",
            //     NgayThucHien = DateTime.Now
            // };
            // _context.LichSuHoatDongs.Add(log);

            await _context.SaveChangesAsync();

            HttpContext.Session.SetString("HoTen", nv.HoTen);

            TempData["SuccessMessage"] = "Cập nhật thông tin cá nhân thành công!";
            return RedirectToAction(nameof(TaiKhoanNhanVien));
        }

        [HttpGet]
        public IActionResult DoiMatKhau()
        {
            var (userId, role) = GetStaffSessionInfo();
            if (!userId.HasValue)
            {
                return RedirectToAction("DangNhap", "Auth");
            }
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DoiMatKhau(SupportTicketSysterm.ViewModels.DoiMatKhauViewModel model)
        {
            var (userId, role) = GetStaffSessionInfo();
            if (!userId.HasValue)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            var nv = await _context.NhanViens.FirstOrDefaultAsync(x => x.IdNhanVien == userId.Value);
            if (nv == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            if (string.IsNullOrWhiteSpace(model.MatKhauMoi) || model.MatKhauMoi.Length < 8)
            {
                ModelState.AddModelError("MatKhauMoi", "Mật khẩu mới phải có ít nhất 8 ký tự.");
                return View(model);
            }

            if (model.MatKhauMoi != model.XacNhanMatKhau)
            {
                ModelState.AddModelError("XacNhanMatKhau", "Mật khẩu xác nhận không khớp.");
                return View(model);
            }

            if (model.MatKhauMoi == model.MatKhauHienTai)
            {
                ModelState.AddModelError("MatKhauMoi", "Mật khẩu mới phải khác mật khẩu hiện tại.");
                return View(model);
            }

            string dbHash = nv.MatKhau?.Trim() ?? "";
            bool isCurrentPasswordCorrect = false;

            if (!string.IsNullOrEmpty(dbHash))
            {
                try
                {
                    var verifyResult = _nhanVienPasswordHasher.VerifyHashedPassword(nv, dbHash, model.MatKhauHienTai);
                    if (verifyResult == PasswordVerificationResult.Success || verifyResult == PasswordVerificationResult.SuccessRehashNeeded)
                    {
                        isCurrentPasswordCorrect = true;
                    }
                }
                catch
                {
                    // Trường hợp tài khoản trong DB đang lưu mật khẩu dạng plaintext (chưa băm)
                    isCurrentPasswordCorrect = (dbHash == model.MatKhauHienTai);
                }

                if (!isCurrentPasswordCorrect && dbHash == model.MatKhauHienTai)
                {
                    isCurrentPasswordCorrect = true;
                }
            }

            if (!isCurrentPasswordCorrect)
            {
                ModelState.AddModelError("MatKhauHienTai", "Mật khẩu hiện tại không chính xác.");
                return View(model);
            }

            nv.MatKhau = _nhanVienPasswordHasher.HashPassword(nv, model.MatKhauMoi);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Đổi mật khẩu thành công! Mật khẩu của bạn đã được cập nhật.";
            return RedirectToAction(nameof(DoiMatKhau));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CapNhatAvatar(SupportTicketSysterm.ViewModels.TaiKhoanNhanVienViewModel model)
        {
            var idNhanVien = HttpContext.Session.GetInt32("UserId") ?? HttpContext.Session.GetInt32("IdNhanVien") ?? model.IdNhanVien;
            var nv = await _context.NhanViens.FirstOrDefaultAsync(x => x.IdNhanVien == idNhanVien);
            if (nv == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            if (model.AvatarFile == null || model.AvatarFile.Length == 0)
            {
                TempData["ErrorMessage"] = "Vui lòng chọn một file ảnh hợp lệ.";
                return RedirectToAction(nameof(TaiKhoanNhanVien));
            }

            try
            {
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatar");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                var extension = Path.GetExtension(model.AvatarFile.FileName).ToLower();
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                if (!allowedExtensions.Contains(extension))
                {
                    TempData["ErrorMessage"] = "Định dạng file không được hỗ trợ. Chỉ nhận JPG, PNG, GIF, WEBP.";
                    return RedirectToAction(nameof(TaiKhoanNhanVien));
                }

                var uniqueFileName = Guid.NewGuid().ToString() + extension;
                var filePath = Path.Combine(uploadsDir, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await model.AvatarFile.CopyToAsync(fileStream);
                }

                if (!string.IsNullOrEmpty(nv.Avatar))
                {
                    var oldFilePath = Path.Combine(uploadsDir, nv.Avatar);
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                        catch { /* Ignored */ }
                    }
                }

                nv.Avatar = uniqueFileName;



                await _context.SaveChangesAsync();

                HttpContext.Session.SetString("Avatar", nv.Avatar);

                TempData["SuccessMessage"] = "Cập nhật ảnh đại diện thành công!";
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Lỗi khi tải ảnh lên: {ex.Message}";
            }

            return RedirectToAction(nameof(TaiKhoanNhanVien));
        }

        #endregion

        #region Thống Kê - Báo Cáo

        [Authorize(Roles = "Admin,Quản trị viên,AdminManager")]
        [HttpGet]
        public async Task<IActionResult> ThongKeBaoCao(
            string? tuNgay,
            string? denNgay,
            int? idNhanVien,
            int? idDichVu,
            int? idDanhMuc,
            string? trangThai)
        {
            // ── Parse bộ lọc ───────────────────────────────────────────────
            DateOnly? tuNgayParsed  = DateOnly.TryParse(tuNgay,  out var d1) ? d1 : null;
            DateOnly? denNgayParsed = DateOnly.TryParse(denNgay, out var d2) ? d2 : null;

            var filter = new ViewModels.ThongKeFilterViewModel
            {
                TuNgay     = tuNgayParsed,
                DenNgay    = denNgayParsed,
                IdNhanVien = idNhanVien,
                IdDichVu   = idDichVu,
                IdDanhMuc  = idDanhMuc,
                TrangThai  = trangThai,
            };

            var vm = new ViewModels.ThongKeBaoCaoViewModel { Filter = filter };

            // ── Dropdown dữ liệu filter ────────────────────────────────────
            vm.DanhSachNhanVien = await _context.NhanViens
                .Where(x => x.TrangThai != "Nghỉ việc")
                .OrderBy(x => x.HoTen)
                .Select(x => new { x.IdNhanVien, x.HoTen })
                .AsNoTracking()
                .Select(x => ValueTuple.Create(x.IdNhanVien, x.HoTen))
                .ToListAsync();

            vm.DanhSachDichVu = await _context.DichVus
                .OrderBy(x => x.TenDichVu)
                .Select(x => new { x.IdDichVu, x.TenDichVu })
                .AsNoTracking()
                .Select(x => ValueTuple.Create(x.IdDichVu, x.TenDichVu))
                .ToListAsync();

            vm.DanhSachDanhMuc = await _context.DanhMucs
                .OrderBy(x => x.TenDanhMuc)
                .Select(x => new { x.IdDanhMuc, x.TenDanhMuc })
                .AsNoTracking()
                .Select(x => ValueTuple.Create(x.IdDanhMuc, x.TenDanhMuc))
                .ToListAsync();

            // ── Base query phiếu (với filter) ─────────────────────────────
            var qPhieu = _context.PhieuHoTros.AsQueryable();

            if (tuNgayParsed.HasValue)
                qPhieu = qPhieu.Where(x => x.NgayTao >= tuNgayParsed);
            if (denNgayParsed.HasValue)
                qPhieu = qPhieu.Where(x => x.NgayTao <= denNgayParsed);
            if (idNhanVien.HasValue)
                qPhieu = qPhieu.Where(x => x.IdNhanVien == idNhanVien);
            if (idDichVu.HasValue)
                qPhieu = qPhieu.Where(x => x.IdDichVu == idDichVu);
            if (idDanhMuc.HasValue)
                qPhieu = qPhieu.Where(x => x.IdDichVuNavigation != null
                                        && x.IdDichVuNavigation.IdDanhMuc == idDanhMuc);
            if (!string.IsNullOrEmpty(trangThai))
                qPhieu = qPhieu.Where(x => x.TrangThai == trangThai);

            // ── KPI: tháng này vs tháng trước ──────────────────────────────
            var today      = DateOnly.FromDateTime(DateTime.Today);
            var startThisM = new DateOnly(today.Year, today.Month, 1);
            var startPrevM = startThisM.AddMonths(-1);
            var endPrevM   = startThisM.AddDays(-1);

            var allPhieu = await qPhieu.ToListAsync();

            int totalNow  = allPhieu.Count;
            int totalPrev = await _context.PhieuHoTros
                .CountAsync(x => x.NgayTao >= startPrevM && x.NgayTao <= endPrevM);

            vm.TongPhieuHoTro = new ViewModels.KpiCardViewModel
            {
                GiaTriHienTai   = totalNow,
                GiaTriThangTruoc = totalPrev,
            };

            // Trạng thái
            string[] choXuLyStates = { "Chờ tiếp nhận", "Mới" };
            string[] dangXuLyStates = { "Đang xử lý", "Đang tiến hành" };
            string[] hoanThanhStates = { "Đã hoàn thành", "Hoàn thành" };
            string[] daHuyStates = { "Đã hủy", "Hủy" };

            int cntCho  = allPhieu.Count(x => choXuLyStates.Contains(x.TrangThai));
            int cntDang = allPhieu.Count(x => dangXuLyStates.Contains(x.TrangThai));
            int cntHoan = allPhieu.Count(x => hoanThanhStates.Contains(x.TrangThai));
            int cntHuy  = allPhieu.Count(x => daHuyStates.Contains(x.TrangThai));

            // KPI tháng trước - trạng thái
            var prevPhieu = await _context.PhieuHoTros
                .Where(x => x.NgayTao >= startPrevM && x.NgayTao <= endPrevM)
                .Select(x => x.TrangThai)
                .ToListAsync();

            vm.ChoXuLy  = new ViewModels.KpiCardViewModel { GiaTriHienTai = cntCho,  GiaTriThangTruoc = prevPhieu.Count(x => choXuLyStates.Contains(x)) };
            vm.DangXuLy = new ViewModels.KpiCardViewModel { GiaTriHienTai = cntDang, GiaTriThangTruoc = prevPhieu.Count(x => dangXuLyStates.Contains(x)) };
            vm.HoanThanh = new ViewModels.KpiCardViewModel { GiaTriHienTai = cntHoan, GiaTriThangTruoc = prevPhieu.Count(x => hoanThanhStates.Contains(x)) };
            vm.DaHuy    = new ViewModels.KpiCardViewModel { GiaTriHienTai = cntHuy,  GiaTriThangTruoc = prevPhieu.Count(x => daHuyStates.Contains(x)) };

            // Doughnut data
            vm.PhieuChoXuLy  = cntCho;
            vm.PhieuDangXuLy = cntDang;
            vm.PhieuHoanThanh= cntHoan;
            vm.PhieuDaHuy    = cntHuy;

            // KPI tổng thực thể (không lọc)
            vm.TongKhachHang = new ViewModels.KpiCardViewModel { GiaTriHienTai = await _context.KhachHangs.CountAsync() };
            vm.TongNhanVien  = new ViewModels.KpiCardViewModel { GiaTriHienTai = await _context.NhanViens.CountAsync(x => x.TrangThai != "Nghỉ việc") };
            vm.TongDichVu    = new ViewModels.KpiCardViewModel { GiaTriHienTai = await _context.DichVus.CountAsync() };
            vm.TongDanhMuc   = new ViewModels.KpiCardViewModel { GiaTriHienTai = await _context.DanhMucs.CountAsync() };

            // ── Điểm đánh giá trung bình ───────────────────────────────────
            var danhGiaList = await _context.DanhGia
                .Where(x => x.ChatLuongDichVu.HasValue || x.ThaiDoNhanVien.HasValue || x.TocDoXuLy.HasValue)
                .Select(x => new { x.ChatLuongDichVu, x.ThaiDoNhanVien, x.TocDoXuLy })
                .AsNoTracking()
                .ToListAsync();

            if (danhGiaList.Any())
            {
                var allScores = danhGiaList.SelectMany(d => new[]
                {
                    d.ChatLuongDichVu, d.ThaiDoNhanVien, d.TocDoXuLy
                }.Where(s => s.HasValue).Select(s => (double)s!.Value)).ToList();

                vm.DiemDanhGiaTrungBinh = allScores.Any()
                    ? Math.Round(allScores.Average(), 1)
                    : 0;
            }

            // ── CHART: Phiếu theo tháng (12 tháng gần nhất) ───────────────
            var thang12 = Enumerable.Range(0, 12)
                .Select(i => today.AddMonths(-(11 - i)))
                .ToList();

            vm.PhieuTheoThang = thang12.Select(t => new ViewModels.ChartDataPoint
            {
                Label = $"T{t.Month}/{t.Year % 100}",
                Value = allPhieu.Count(p =>
                    p.NgayTao.HasValue &&
                    p.NgayTao.Value.Year == t.Year &&
                    p.NgayTao.Value.Month == t.Month)
            }).ToList();

            // ── CHART: Top 5 dịch vụ ──────────────────────────────────────
            var topDvRaw = allPhieu
                .Where(p => p.IdDichVu.HasValue)
                .GroupBy(p => p.IdDichVu!.Value)
                .Select(g => new { IdDichVu = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList();

            var dichVuDict = await _context.DichVus
                .Include(d => d.IdDanhMucNavigation)
                .Where(d => topDvRaw.Select(x => x.IdDichVu).Contains(d.IdDichVu))
                .AsNoTracking()
                .ToDictionaryAsync(d => d.IdDichVu);

            vm.TopDichVuChart = topDvRaw.Select(x => new ViewModels.ChartDataPoint
            {
                Label = dichVuDict.TryGetValue(x.IdDichVu, out var dv) ? dv.TenDichVu : $"DV#{x.IdDichVu}",
                Value = x.Count
            }).ToList();

            // Top dịch vụ bảng
            int totalForPct = allPhieu.Count > 0 ? allPhieu.Count : 1;
            vm.TopDichVu = topDvRaw.Select(x =>
            {
                dichVuDict.TryGetValue(x.IdDichVu, out var dv);
                return new ViewModels.TopDichVuViewModel
                {
                    IdDichVu  = x.IdDichVu,
                    TenDichVu = dv?.TenDichVu ?? $"DV#{x.IdDichVu}",
                    TenDanhMuc= dv?.IdDanhMucNavigation?.TenDanhMuc ?? "—",
                    SoPhieu   = x.Count,
                    PhanTram  = Math.Round((double)x.Count / totalForPct * 100, 1),
                };
            }).ToList();

            // ── CHART: Phiếu theo danh mục (Pie) ──────────────────────────
            var allDichVuWithDM = await _context.DichVus
                .Include(d => d.IdDanhMucNavigation)
                .AsNoTracking()
                .ToDictionaryAsync(d => d.IdDichVu);

            var dmGroups = allPhieu
                .Where(p => p.IdDichVu.HasValue && allDichVuWithDM.ContainsKey(p.IdDichVu!.Value))
                .GroupBy(p => allDichVuWithDM[p.IdDichVu!.Value].IdDanhMucNavigation?.TenDanhMuc ?? "Khác")
                .Select(g => new ViewModels.ChartDataPoint { Label = g.Key, Value = g.Count() })
                .OrderByDescending(x => x.Value)
                .ToList();

            vm.PhieuTheoDanhMuc = dmGroups;

            // ── CHART: Phiếu theo ngày (30 ngày) ──────────────────────────
            var ngay30 = Enumerable.Range(0, 30)
                .Select(i => today.AddDays(-(29 - i)))
                .ToList();

            vm.PhieuTheoNgay = ngay30.Select(d3 => new ViewModels.ChartDataPoint
            {
                Label = $"{d3.Day}/{d3.Month}",
                Value = allPhieu.Count(p => p.NgayTao == d3)
            }).ToList();

            // ── CHART: Radar — Hiệu suất nhân viên (top 6) ────────────────
            var nvRadarRaw = allPhieu
                .Where(p => p.IdNhanVien.HasValue)
                .GroupBy(p => p.IdNhanVien!.Value)
                .Select(g => new
                {
                    IdNV    = g.Key,
                    Tong    = g.Count(),
                    HoanTh  = g.Count(x => hoanThanhStates.Contains(x.TrangThai)),
                    DangXL  = g.Count(x => dangXuLyStates.Contains(x.TrangThai)),
                })
                .OrderByDescending(x => x.Tong)
                .Take(6)
                .ToList();

            var nvDict = await _context.NhanViens
                .Where(x => nvRadarRaw.Select(r => r.IdNV).Contains(x.IdNhanVien))
                .AsNoTracking()
                .ToDictionaryAsync(x => x.IdNhanVien, x => x.HoTen);

            vm.RadarNhanVienLabels = nvRadarRaw
                .Select(x => nvDict.TryGetValue(x.IdNV, out var n) ? n : $"NV#{x.IdNV}")
                .ToList();
            vm.RadarTongPhieu  = nvRadarRaw.Select(x => x.Tong).ToList();
            vm.RadarHoanThanh  = nvRadarRaw.Select(x => x.HoanTh).ToList();
            vm.RadarDangXuLy   = nvRadarRaw.Select(x => x.DangXL).ToList();

            // ── BẢNG: Top 10 Nhân viên ─────────────────────────────────────
            var topNVIds = allPhieu
                .Where(p => p.IdNhanVien.HasValue)
                .GroupBy(p => p.IdNhanVien!.Value)
                .Select(g => new
                {
                    IdNV    = g.Key,
                    Tong    = g.Count(),
                    HoanTh  = g.Count(x => hoanThanhStates.Contains(x.TrangThai)),
                    DangXL  = g.Count(x => dangXuLyStates.Contains(x.TrangThai)),
                    DaHuyC  = g.Count(x => daHuyStates.Contains(x.TrangThai)),
                })
                .OrderByDescending(x => x.Tong)
                .Take(10)
                .ToList();

            var nvFullDict = await _context.NhanViens
                .Where(x => topNVIds.Select(r => r.IdNV).Contains(x.IdNhanVien))
                .AsNoTracking()
                .ToDictionaryAsync(x => x.IdNhanVien);

            vm.TopNhanVien = topNVIds.Select(x =>
            {
                nvFullDict.TryGetValue(x.IdNV, out var nv);
                return new ViewModels.TopNhanVienViewModel
                {
                    IdNhanVien  = x.IdNV,
                    HoTen       = nv?.HoTen ?? $"NV#{x.IdNV}",
                    Avatar      = nv?.Avatar,
                    VaiTro      = nv?.VaiTro ?? "—",
                    TongPhieu   = x.Tong,
                    DangXuLy    = x.DangXL,
                    HoanThanh   = x.HoanTh,
                    DaHuy       = x.DaHuyC,
                };
            }).ToList();

            // ── BẢNG: Top 5 Khách hàng ────────────────────────────────────
            var topKHIds = allPhieu
                .Where(p => p.IdKhachHang.HasValue)
                .GroupBy(p => p.IdKhachHang!.Value)
                .Select(g => new { IdKH = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList();

            var khDict = await _context.KhachHangs
                .Where(x => topKHIds.Select(r => r.IdKH).Contains(x.IdKhachHang))
                .AsNoTracking()
                .ToDictionaryAsync(x => x.IdKhachHang);

            vm.TopKhachHang = topKHIds.Select(x =>
            {
                khDict.TryGetValue(x.IdKH, out var kh);
                return new ViewModels.TopKhachHangViewModel
                {
                    IdKhachHang  = x.IdKH,
                    HoTen        = kh?.HoTen ?? $"KH#{x.IdKH}",
                    SoDienThoai  = kh?.SoDienThoai,
                    Email        = kh?.Email,
                    SoPhieu      = x.Count,
                };
            }).ToList();

            // ── THỐNG KÊ ĐÁNH GIÁ ──────────────────────────────────────────
            var allDG = await _context.DanhGia.AsNoTracking().ToListAsync();

            static int AvgScore(int? cl, int? td, int? tc)
            {
                var vals = new[] { cl, td, tc }.Where(v => v.HasValue).Select(v => v!.Value).ToList();
                return vals.Any() ? (int)Math.Round(vals.Average()) : 0;
            }

            var dgScores = allDG.Select(d => AvgScore(d.ChatLuongDichVu, d.ThaiDoNhanVien, d.TocDoXuLy)).ToList();

            vm.DanhGia = new ViewModels.ThongKeDanhGiaViewModel
            {
                TongDanhGia       = allDG.Count,
                Star5 = dgScores.Count(s => s == 5),
                Star4 = dgScores.Count(s => s == 4),
                Star3 = dgScores.Count(s => s == 3),
                Star2 = dgScores.Count(s => s == 2),
                Star1 = dgScores.Count(s => s == 1),
                DiemTrungBinh     = dgScores.Any() ? Math.Round(dgScores.Average(), 1) : 0,
                TrungBinhChatLuong = allDG.Where(d => d.ChatLuongDichVu.HasValue).Any()
                    ? Math.Round(allDG.Where(d => d.ChatLuongDichVu.HasValue).Average(d => (double)d.ChatLuongDichVu!.Value), 1) : 0,
                TrungBinhThaiDo   = allDG.Where(d => d.ThaiDoNhanVien.HasValue).Any()
                    ? Math.Round(allDG.Where(d => d.ThaiDoNhanVien.HasValue).Average(d => (double)d.ThaiDoNhanVien!.Value), 1) : 0,
                TrungBinhTocDo    = allDG.Where(d => d.TocDoXuLy.HasValue).Any()
                    ? Math.Round(allDG.Where(d => d.TocDoXuLy.HasValue).Average(d => (double)d.TocDoXuLy!.Value), 1) : 0,
            };

            if (vm.DiemDanhGiaTrungBinh == 0)
                vm.DiemDanhGiaTrungBinh = vm.DanhGia.DiemTrungBinh;

            // ── THỐNG KÊ LỊCH HẸN ──────────────────────────────────────────
            var allLH = await _context.LichHens.AsNoTracking().ToListAsync();
            vm.LichHen = new ViewModels.ThongKeLichHenViewModel
            {
                TongLichHen  = allLH.Count,
                DaHoanThanh  = allLH.Count(x => x.TrangThai == "Hoàn thành" || x.TrangThai == "Đã hoàn thành"),
                DaHuy        = allLH.Count(x => x.TrangThai == "Đã hủy" || x.TrangThai == "Hủy"),
                DangCho      = allLH.Count(x => x.TrangThai == "Chờ xác nhận" || x.TrangThai == "Đang chờ" || x.TrangThai == "Mới"),
            };

            return View(vm);
        }

        #endregion

        
    }
}


