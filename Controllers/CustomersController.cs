using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Services;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace SupportTicketSysterm.Controllers
{
    [Route("Customers")]
    [Route("KhachHang")]
    public class CustomersController : Controller
    {
        private readonly TechSupportContext _context;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(
            TechSupportContext context,
            ILogger<CustomersController> logger)
        {
            _context = context;
            _logger  = logger;
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
                model.MatKhauHienTai,
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
            if (model.MatKhauHienTai == model.MatKhauMoi)
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

        [HttpGet]
        [Route("LienHe")]
        public IActionResult LienHe()
        {
            return View(new GuiLienHeViewModel());
        }

        [HttpPost]
        [Route("LienHe")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LienHe(GuiLienHeViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var lienHe = new LienHe
                {
                    IdKhachHang = null,
                    IdNhanVien = null,
                    IdPhieu = null,
                    ThoiGianGui = DateTime.Now,
                    SoTinChuaDoc = 1,
                    TinChuaDocKhach = 0,
                    NoiDung = model.NoiDung,
                    TrangThai = "Chưa xử lý",
                    NgayTao = DateOnly.FromDateTime(DateTime.Now)
                };

                _context.LienHes.Add(lienHe);
                await _context.SaveChangesAsync();

                var tinNhan = new TinNhan
                {
                    IdLienHe = lienHe.IdLienHe,
                    LoaiNguoiGui = "Khách hàng",
                    ThoiGian = DateTime.Now,
                    TrangThai = "Chưa đọc"
                };

                _context.TinNhans.Add(tinNhan);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                TempData["Success"] = "Gửi liên hệ thành công.";

                return RedirectToAction(nameof(LienHe));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                ModelState.AddModelError("", "Không thể gửi liên hệ. Vui lòng thử lại.");

                return View(model);
            }
        }


        // ================================================================
        //  GET  Customers/PhieuCuaToi
        //  (View form cũng post đến đây qua asp-action="PhieuHoTro",
        //   nên khai báo thêm route alias để tương thích)
        // ================================================================

        [HttpGet]
        [Route("PhieuCuaToi")]
        [Route("PhieuHoTro")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> PhieuCuaToi(
            string?   search   = null,
            string?   status   = null,
            string?   priority = null,
            string?   service  = null,
            string?   dateFrom = null,
            string?   dateTo   = null,
            string?   sortBy   = null,
            int       page     = 1)
        {
            // ----------------------------------------------------------
            //  1. Kiểm tra Session — redirect nếu chưa đăng nhập
            // ----------------------------------------------------------
            var idKhachHang = HttpContext.Session.GetInt32("UserId")
                           ?? HttpContext.Session.GetInt32("IdKhachHang");

            if (idKhachHang == null)
            {
                // Thử lấy từ Claims (phòng trường hợp dùng cookie auth song song)
                var claimVal = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(claimVal, out int claimId))
                    idKhachHang = claimId;
            }

            if (idKhachHang == null)
            {
                _logger.LogWarning("PhieuCuaToi: Session hết hạn hoặc chưa đăng nhập.");
                return RedirectToAction("DangNhap", "Auth");
            }

            try
            {
                var today = DateOnly.FromDateTime(DateTime.Today);

                // ----------------------------------------------------------
                //  2. Parse khoảng ngày tạo (filter)
                // ----------------------------------------------------------
                DateOnly? tuNgay  = DateOnly.TryParseExact(dateFrom, "yyyy-MM-dd", null,
                                        System.Globalization.DateTimeStyles.None, out var dfParsed)
                                    ? dfParsed : null;
                DateOnly? denNgay = DateOnly.TryParseExact(dateTo,   "yyyy-MM-dd", null,
                                        System.Globalization.DateTimeStyles.None, out var dtParsed)
                                    ? dtParsed : null;

                // ----------------------------------------------------------
                //  3. Truy vấn toàn bộ phiếu của khách hàng
                //     — AsNoTracking vì chỉ đọc
                //     — Include tối thiểu: DichVu (lấy TenDichVu) + NhanVien (lấy HoTen)
                //     — LichHen chỉ dùng NgayHen để tính NgayHenXuLy nên Include vào đây
                // ----------------------------------------------------------
                var baseQuery = _context.PhieuHoTros
                    .AsNoTracking()
                    .Where(p => p.IdKhachHang == idKhachHang)
                    .Include(p => p.IdDichVuNavigation)
                    .Include(p => p.IdNhanVienNavigation)
                    .Include(p => p.LichHens)
                    .Include(p => p.DanhGium)
                    .AsQueryable();

                // ----------------------------------------------------------
                //  4. Thống kê — tính trước khi áp search/filter
                //     để thống kê phản ánh TẤT CẢ phiếu của khách hàng.
                // ----------------------------------------------------------

                // Lấy snapshot dữ liệu thô để tính thống kê và danh sách dịch vụ
                // Dùng Select tối thiểu — tránh kéo toàn bộ cột không cần
                var thongKeRaw = await _context.PhieuHoTros
                    .AsNoTracking()
                    .Where(p => p.IdKhachHang == idKhachHang)
                    .Include(p => p.LichHens)
                    .Select(p => new
                    {
                        p.TrangThai,
                        NgayHenXuLy = p.LichHens
                                        .OrderByDescending(lh => lh.NgayHen)
                                        .Select(lh => lh.NgayHen)
                                        .FirstOrDefault()
                    })
                    .ToListAsync();

                int tongPhieu    = thongKeRaw.Count;
                int dangXuLy     = thongKeRaw.Count(x => x.TrangThai == "DangXuLy");
                int choTiepNhan  = thongKeRaw.Count(x => x.TrangThai == "ChoTiepNhan");
                int daHoanThanh  = thongKeRaw.Count(x => x.TrangThai == "DaHoanThanh");
                int daHuy        = thongKeRaw.Count(x => x.TrangThai == "DaHuy");
                int quaHan       = thongKeRaw.Count(x =>
                                       x.TrangThai != "DaHoanThanh"
                                    && x.NgayHenXuLy.HasValue
                                    && x.NgayHenXuLy.Value < today);

                // ----------------------------------------------------------
                //  5. Danh sách dịch vụ (dùng cho dropdown filter)
                // ----------------------------------------------------------
                var danhSachDichVu = await _context.PhieuHoTros
                    .AsNoTracking()
                    .Where(p => p.IdKhachHang == idKhachHang
                             && p.IdDichVuNavigation != null)
                    .Select(p => p.IdDichVuNavigation!.TenDichVu)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                // ----------------------------------------------------------
                //  6. Áp dụng Search (MaPhieu | TieuDe | TenDichVu)
                // ----------------------------------------------------------
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var kw = search.Trim().ToLower();
                    baseQuery = baseQuery.Where(p =>
                        (p.MaPhieu != null && p.MaPhieu.ToLower().Contains(kw))
                     || (p.TieuDe  != null && p.TieuDe.ToLower().Contains(kw))
                     || (p.IdDichVuNavigation != null
                         && p.IdDichVuNavigation.TenDichVu.ToLower().Contains(kw)));
                }

                // ----------------------------------------------------------
                //  7. Áp dụng Filter
                // ----------------------------------------------------------

                // 7a. Trạng thái
                if (!string.IsNullOrWhiteSpace(status))
                    baseQuery = baseQuery.Where(p => p.TrangThai == status);

                // 7b. Mức ưu tiên — PhieuHoTro lưu MucDoUuTien (int?),
                //     view dùng giá trị chuỗi Low/Medium/High/Critical
                //     => ánh xạ sang số tương ứng
                if (!string.IsNullOrWhiteSpace(priority))
                {
                    int? mucUuTienSo = priority switch
                    {
                        "Low"      => 1,
                        "Medium"   => 2,
                        "High"     => 3,
                        "Critical" => 4,
                        _          => null
                    };
                    if (mucUuTienSo.HasValue)
                        baseQuery = baseQuery.Where(p => p.MucDoUuTien == mucUuTienSo.Value);
                }

                // 7c. Dịch vụ
                if (!string.IsNullOrWhiteSpace(service))
                    baseQuery = baseQuery.Where(p =>
                        p.IdDichVuNavigation != null
                     && p.IdDichVuNavigation.TenDichVu == service);

                // 7d. Khoảng ngày tạo
                if (tuNgay.HasValue)
                    baseQuery = baseQuery.Where(p => p.NgayTao >= tuNgay.Value);
                if (denNgay.HasValue)
                    baseQuery = baseQuery.Where(p => p.NgayTao <= denNgay.Value);

                // ----------------------------------------------------------
                //  8. Sắp xếp
                // ----------------------------------------------------------
                baseQuery = sortBy switch
                {
                    "date_asc"  => baseQuery.OrderBy(p => p.NgayTao),
                    "priority"  => baseQuery.OrderByDescending(p => p.MucDoUuTien),
                    "service"   => baseQuery.OrderBy(p => p.IdDichVuNavigation != null
                                                        ? p.IdDichVuNavigation.TenDichVu
                                                        : null),
                    "maPhieu"   => baseQuery.OrderBy(p => p.MaPhieu),
                    _           => baseQuery.OrderByDescending(p => p.NgayTao)  // mặc định mới nhất trước
                };

                // ----------------------------------------------------------
                //  9. Phân trang
                // ----------------------------------------------------------
                const int pageSize = 10;
                int currentPage   = page < 1 ? 1 : page;

                int totalRecords  = await baseQuery.CountAsync();
                int totalPages    = (int)Math.Ceiling(totalRecords / (double)pageSize);

                // Đảm bảo currentPage không vượt quá totalPages
                if (totalPages > 0 && currentPage > totalPages)
                    currentPage = totalPages;

                // ----------------------------------------------------------
                //  10. Lấy phiếu cho trang hiện tại + Mapping sang DTO
                // ----------------------------------------------------------
                var danhSachPhieu = await baseQuery
                    .Skip((currentPage - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new PhieuHoTroItemDto
                    {
                        IdPhieu          = p.IdPhieu,
                        MaPhieu          = p.MaPhieu,
                        TieuDe           = p.TieuDe,
                        MoTa             = p.NoiDung,
                        TrangThai        = p.TrangThai,

                        // Ánh xạ MucDoUuTien (int) => chuỗi Low/Medium/High/Critical
                        MucUuTien        = p.MucDoUuTien == 1 ? "Low"
                                         : p.MucDoUuTien == 2 ? "Medium"
                                         : p.MucDoUuTien == 3 ? "High"
                                         : p.MucDoUuTien == 4 ? "Critical"
                                         : null,

                        NgayTao          = p.NgayTao ?? today,
                        NgayCapNhat      = p.NgayCapNhat,
                        TenDichVu        = p.IdDichVuNavigation != null
                                           ? p.IdDichVuNavigation.TenDichVu
                                           : null,

                        // Tiến độ theo quy tắc nghiệp vụ
                        TienDo           = p.TrangThai == "DaHoanThanh"          ? 100
                                         : p.TrangThai == "ChoKhachHangPhanHoi"  ? 80
                                         : p.TrangThai == "DangXuLy"             ? 60
                                         : p.TrangThai == "ChoTiepNhan"          ? 20
                                         : p.TrangThai == "DaHuy"                ? 0
                                         : 0,

                        NhanVienPhuTrach = p.IdNhanVienNavigation != null
                                           ? p.IdNhanVienNavigation.HoTen
                                           : null,

                        // NgayHenXuLy = ngày hẹn gần nhất của phiếu
                        NgayHenXuLy      = p.LichHens
                                            .OrderByDescending(lh => lh.NgayHen)
                                            .Select(lh => lh.NgayHen)
                                            .FirstOrDefault(),
                        DaDanhGia        = p.DanhGium != null
                    })
                    .ToListAsync();

                // ----------------------------------------------------------
                //  11. Sidebar — Hoạt động gần đây (5 LichSuHoTro mới nhất)
                // ----------------------------------------------------------
                var hoatDong = await _context.LichSuHoTros
                    .AsNoTracking()
                    .Where(ls => ls.IdPhieuNavigation != null
                              && ls.IdPhieuNavigation.IdKhachHang == idKhachHang)
                    .OrderByDescending(ls => ls.NgayCapNhat)
                    .Take(5)
                    .Select(ls => new HoatDongGanDayDto
                    {
                        MoTa      = ls.NoiDungCapNhat ?? "Cập nhật trạng thái phiếu",
                        ThoiGian  = ls.NgayCapNhat.HasValue
                                    ? ls.NgayCapNhat.Value.ToDateTime(TimeOnly.MinValue)
                                    : DateTime.MinValue
                    })
                    .ToListAsync();

                // ----------------------------------------------------------
                //  12. Sidebar — Thông báo (5 TinNhan gần nhất)
                //     TinNhan -> LienHe -> IdKhachHang
                // ----------------------------------------------------------
                var thongBao = await _context.TinNhans
                    .AsNoTracking()
                    .Where(t => t.IdLienHeNavigation != null
                             && t.IdLienHeNavigation.IdKhachHang == idKhachHang
                             && t.ThoiGian.HasValue)
                    .OrderByDescending(t => t.ThoiGian)
                    .Take(5)
                    .Select(t => new ThongBaoDto
                    {
                        NoiDung  = t.TinNhan1 ?? "Thông báo mới",
                        ThoiGian = t.ThoiGian!.Value
                    })
                    .ToListAsync();

                // ----------------------------------------------------------
                //  13. Sidebar — Lịch hẹn gần nhất (3 LichHen sắp tới)
                // ----------------------------------------------------------
                var lichHenList = await _context.LichHens
                    .AsNoTracking()
                    .Where(lh => lh.IdPhieuNavigation != null
                              && lh.IdPhieuNavigation.IdKhachHang == idKhachHang
                              && lh.NgayHen >= today)
                    .OrderBy(lh => lh.NgayHen)
                    .ThenBy(lh => lh.GioBatDau)
                    .Take(3)
                    .Select(lh => new LichHenGanNhatDto
                    {
                        TieuDe   = lh.IdPhieuNavigation != null
                                   ? (lh.IdPhieuNavigation.TieuDe ?? "Lịch hỗ trợ")
                                   : "Lịch hỗ trợ",
                        ThoiGian = lh.NgayHen.HasValue
                                   ? lh.NgayHen.Value.ToDateTime(
                                         lh.GioBatDau ?? TimeOnly.MinValue)
                                   : DateTime.MinValue
                    })
                    .ToListAsync();

                // ----------------------------------------------------------
                //  14. Lưu lại giá trị filter vào ViewBag để view restore dropdown
                // ----------------------------------------------------------
                ViewBag.SearchQuery      = search;
                ViewBag.SelectedStatus   = status;
                ViewBag.SelectedPriority = priority;
                ViewBag.SelectedService  = service;
                ViewBag.DateFrom         = dateFrom;
                ViewBag.DateTo           = dateTo;
                ViewBag.SortBy           = sortBy;

                // ----------------------------------------------------------
                //  15. Tổng hợp ViewModel
                // ----------------------------------------------------------
                var viewModel = new PhieuHoTroViewModel
                {
                    DanhSachPhieu    = danhSachPhieu,

                    TongPhieu        = tongPhieu,
                    DangXuLy         = dangXuLy,
                    ChoTiepNhan      = choTiepNhan,
                    DaHoanThanh      = daHoanThanh,
                    DaHuy            = daHuy,
                    QuaHan           = quaHan,

                    DanhSachThongBao = thongBao,
                    HoatDongGanDay   = hoatDong,
                    LichHenGanNhat   = lichHenList,

                    DanhSachDichVu   = danhSachDichVu,

                    TongTrang        = totalPages,
                    TrangHienTai     = currentPage
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "PhieuCuaToi: Lỗi khi tải danh sách phiếu cho khách hàng Id={IdKhachHang}",
                    idKhachHang);

                return View("Error", new ErrorViewModel
                {
                    RequestId = System.Diagnostics.Activity.Current?.Id
                             ?? HttpContext.TraceIdentifier
                });
            }
        }


    }
}
