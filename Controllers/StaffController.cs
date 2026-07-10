using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;

namespace SupportTicketSysterm.Controllers
{
    public class StaffController : Controller
    {
        private readonly TechSupportContext _context;

        public StaffController(TechSupportContext context)
        {
            _context = context;
        }


        public IActionResult Dashboard()
        {
            return View();
        }



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
<<<<<<< HEAD
        [HttpGet]
        [Route("Staff/QuanLyKH")]
=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
        public IActionResult QuanLyKH(string keyword,
            string status,
            string sort = "newest")
        {
            var query = _context.KhachHangs.AsQueryable();

<<<<<<< HEAD
            // Tìm kiếm (tên, số điện thoại, email)
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.HoTen.Contains(keyword) 
                                      || (x.SoDienThoai != null && x.SoDienThoai.Contains(keyword)) 
                                      || (x.Email != null && x.Email.Contains(keyword)));
            }

            // Lọc trạng thái (bỏ qua nếu chọn "Tất cả" - all)
            if (!string.IsNullOrWhiteSpace(status) && status != "all")
=======
           
            // Tìm kiếm
            
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(x => x.HoTen.Contains(keyword));
            }

          
            // Lọc trạng thái
           
            if (!string.IsNullOrWhiteSpace(status))
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
            {
                query = query.Where(x => x.TrangThai == status);
            }

<<<<<<< HEAD
            // Sắp xếp
=======
           
            // Sắp xếp
            
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
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

<<<<<<< HEAD
=======
            

>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
            var today = DateOnly.FromDateTime(DateTime.Today);
            var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);

            ViewBag.TotalCustomers = _context.KhachHangs.Count();
            ViewBag.ActiveCustomers = _context.KhachHangs.Count(x => x.TrangThai == "Hoạt động" || x.TrangThai == "Hoạt Động");
            ViewBag.InactiveCustomers = ViewBag.TotalCustomers - ViewBag.ActiveCustomers;
            ViewBag.NewThisMonth = _context.KhachHangs.Count(x => x.NgayTao != null && x.NgayTao >= firstDayOfMonth);

            ViewBag.Keyword = keyword;
            ViewBag.Status = status;
            ViewBag.Sort = sort;

            return View(query.ToList());
        }

<<<<<<< HEAD
        [HttpGet]
        [Route("Staff/DanhSachKhachHang")]
        public IActionResult DanhSachKhachHang(string keyword, string status, string sort = "newest")
        {
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

            return PartialView("_DanhSachKhachHang", query.ToList());
        }

=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
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
            ModelState.Remove("MaKh");
            ModelState.Remove("LienHes");
            ModelState.Remove("PhieuHoTros");
            ModelState.Remove("TaiKhoanOtps");

            // Cắt khoảng trắng của Email nếu có
            if (model.Email != null)
            {
                model.Email = model.Email.Trim();
            }

            // Ràng buộc cơ sở dữ liệu: Kiểm tra trùng tên đăng nhập
            if (!string.IsNullOrEmpty(model.TenDangNhap) && _context.KhachHangs.Any(x => x.TenDangNhap == model.TenDangNhap))
            {
                ModelState.AddModelError("TenDangNhap", "Tên đăng nhập đã tồn tại trong hệ thống.");
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

        [HttpPost]
        [Route("Staff/KhoaKhachHang")]
        [Route("KhachHang/KhoaKhachHang")]
        [ValidateAntiForgeryToken]
        public IActionResult KhoaKhachHang(int? id, int? idKhachHang)
        {   
            int targetId = id ?? idKhachHang ?? 0;
            try
            {
                var customer = _context.KhachHangs.Find(targetId);
                if (customer == null)
                {
                    return Json(new { success = false, message = "Khách hàng không tồn tại." });
                }

                // Cập nhật trạng thái TrangThai (chỉ đổi trường này)
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
            catch (Exception ex)
            {
                var errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = $"Lỗi hệ thống khi cập nhật trạng thái: {errorMsg}" });
            }


        }

        //Chi tiết KH
        [HttpGet]
        public IActionResult ChiTietKH(int id)
        {
            var khachHang = _context.KhachHangs
                                    .Include(x => x.PhieuHoTros)
                                        .ThenInclude(p => p.LichHens)
                                    .Include(x => x.PhieuHoTros)
                                        .ThenInclude(p => p.DanhGium)
                                    .FirstOrDefault(x => x.IdKhachHang == id);

            if (khachHang == null)
            {
                return NotFound();
            }

            return PartialView("_ChiTietKH", khachHang);
        }

        //Thêm dịch vụ 
        //==================================================
        // QUẢN LÝ DỊCH VỤ KỸ THUẬT
        //==================================================

        [HttpGet]
        public async Task<IActionResult> QuanLyDichVu(
            string keyword,
            string status,
            int? category,
            string sort = "newest",
            int page = 1,
            int pageSize = 10)
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
            int pageSize = 10)
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

<<<<<<< HEAD
                // Kiểm tra nếu danh mục đang bị khóa mà thêm dịch vụ Hoạt động
                if (model.TrangThai == "Hoạt động" && (dm.TrangThai == "Tạm khóa" || dm.TrangThai == "Khóa"))
                {
                    return Json(new { success = false, message = $"Không thể thêm dịch vụ ở trạng thái Hoạt động vì danh mục '{dm.TenDanhMuc}' đang bị khóa." });
                }

=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
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
            return Json(dichVu);
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

<<<<<<< HEAD
                // Kiểm tra nếu danh mục đang bị khóa mà cập nhật dịch vụ thành Hoạt động
                if (model.TrangThai == "Hoạt động" && (dm.TrangThai == "Tạm khóa" || dm.TrangThai == "Khóa"))
                {
                    return Json(new { success = false, message = $"Không thể cập nhật dịch vụ ở trạng thái Hoạt động vì danh mục '{dm.TenDanhMuc}' đang bị khóa." });
                }

=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
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
            var model = await _context.DichVus.FindAsync(id);
            if (model == null)
            {
                return Json(new { success = false, message = "Dịch vụ không tồn tại." });
            }

            try
            {
                _context.DichVus.Remove(model);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "✔ Xóa dịch vụ thành công" });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Lỗi xảy ra trong quá trình xóa dữ liệu." });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> KhoaDichVu(int id)
        {
<<<<<<< HEAD
            var model = await _context.DichVus
                                      .Include(d => d.IdDanhMucNavigation)
                                      .FirstOrDefaultAsync(x => x.IdDichVu == id);
=======
            var model = await _context.DichVus.FindAsync(id);
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
            if (model == null)
            {
                return Json(new { success = false, message = "Dịch vụ không tồn tại." });
            }

            var isActive = model.TrangThai == "Hoạt động";
<<<<<<< HEAD
            if (!isActive)
            {
                var dm = model.IdDanhMucNavigation;
                if (dm != null && (dm.TrangThai == "Tạm khóa" || dm.TrangThai == "Khóa"))
                {
                    return Json(new { 
                        success = false, 
                        isCategoryLocked = true, 
                        message = $"Không thể kích hoạt dịch vụ '{model.TenDichVu}' vì danh mục '{dm.TenDanhMuc}' đang bị khóa." 
                    });
                }
            }

=======
>>>>>>> f27fcf8921ddad14015781ef7ddf6a8f873bdde0
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
    }
}
