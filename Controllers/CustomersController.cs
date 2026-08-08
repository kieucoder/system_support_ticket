using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.Services;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

using Microsoft.AspNetCore.Identity;

namespace SupportTicketSysterm.Controllers
{
    [Route("Customers")]
    [Route("KhachHang")]
    public class CustomersController : Controller
    {
        private readonly TechSupportContext _context;
        private readonly ILogger<CustomersController> _logger;
        private readonly IPasswordHasher<KhachHang> _khachHangPasswordHasher;

        public CustomersController(
            TechSupportContext context,
            ILogger<CustomersController> logger,
            IPasswordHasher<KhachHang> khachHangPasswordHasher)
        {
            _context = context;
            _logger  = logger;
            _khachHangPasswordHasher = khachHangPasswordHasher;
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
        [Route("CapNhatThongTinCaNhan")]
        [Route("CapNhatThongTin")]
        [Authorize(Roles = "KhachHang")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CapNhatThongTinCaNhan(KhachHangViewModel model)
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
                    return Json(new { success = false, message = "Không tìm thấy thông tin tài khoản khách hàng." });
                }

                // Check duplicate Email
                if (!string.IsNullOrWhiteSpace(model.Email))
                {
                    var emailLower = model.Email.Trim().ToLower();
                    var duplicateEmail = await _context.KhachHangs.AnyAsync(x => x.IdKhachHang != userId && x.Email != null && x.Email.ToLower() == emailLower);
                    if (duplicateEmail)
                    {
                        return Json(new { success = false, message = "Địa chỉ Email này đã được sử dụng bởi tài khoản khác." });
                    }
                }

                // Check duplicate Phone Number
                var phoneTrimmed = model.SoDienThoai.Trim();
                var duplicatePhone = await _context.KhachHangs.AnyAsync(x => x.IdKhachHang != userId && x.SoDienThoai == phoneTrimmed);
                if (duplicatePhone)
                {
                    return Json(new { success = false, message = "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
                }

                // Update allowed fields only (MaKh and NgayTao remain unchanged)
                customer.HoTen = model.HoTen.Trim();
                customer.SoDienThoai = phoneTrimmed;
                customer.Email = model.Email?.Trim();
                customer.DiaChi = model.DiaChi?.Trim();
                if (model.NgaySinh.HasValue)
                {
                    customer.NgaySinh = model.NgaySinh;
                }

                _context.KhachHangs.Update(customer);
                await _context.SaveChangesAsync();

                // Update session info
                HttpContext.Session.SetString("HoTen", customer.HoTen);
                HttpContext.Session.SetString("FullName", customer.HoTen);

                // Calculate initials
                var nameParts = customer.HoTen.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var initials = nameParts.Length > 1 
                    ? (nameParts[0][0].ToString() + nameParts[nameParts.Length - 1][0].ToString()).ToUpper()
                    : nameParts[0].Substring(0, Math.Min(2, nameParts[0].Length)).ToUpper();

                return Json(new {
                    success = true,
                    message = "Cập nhật thông tin cá nhân thành công.",
                    data = new {
                        idKhachHang = customer.IdKhachHang,
                        maKh = customer.MaKh,
                        hoTen = customer.HoTen,
                        soDienThoai = customer.SoDienThoai,
                        email = customer.Email ?? "",
                        diaChi = customer.DiaChi ?? "Chưa cập nhật",
                        ngaySinh = customer.NgaySinh?.ToString("dd/MM/yyyy") ?? "Chưa cập nhật",
                        ngaySinhRaw = customer.NgaySinh?.ToString("yyyy-MM-dd") ?? "",
                        initials = initials
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Lỗi xử lý server: " + ex.Message });
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
            string dbHash = khachHang.MatKhau?.Trim() ?? "";
            var verifyResult = _khachHangPasswordHasher.VerifyHashedPassword(khachHang, dbHash, model.MatKhauHienTai);
            bool checkPassword = (verifyResult == PasswordVerificationResult.Success || verifyResult == PasswordVerificationResult.SuccessRehashNeeded) || (dbHash == model.MatKhauHienTai);

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
            khachHang.MatKhau = _khachHangPasswordHasher.HashPassword(khachHang, model.MatKhauMoi);

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Đổi mật khẩu thành công."
            });
        }

        [HttpGet]
        [Route("ChatNhanVien")]
        [Route("Customers/ChatNhanVien")]
        public async Task<IActionResult> ChatNhanVien()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("UserId")?.Value;
                if (int.TryParse(claim, out int id))
                {
                    userId = id;
                }
            }

            // 1. Kiểm tra đăng nhập
            if (userId == null)
            {
                TempData["Error"] = "Bạn cần đăng nhập để chat với nhân viên hỗ trợ.";
                return RedirectToAction("DangNhap", "Auth", new { returnUrl = "/Customers/ChatNhanVien" });
            }

            // 2. Kiểm tra cuộc chat đang mở (Trạng thái "Đang chờ" hoặc "Đang hỗ trợ")
            var activeChat = await _context.LienHes
                .Where(l => l.IdKhachHang == userId.Value && (l.TrangThai == "Đang chờ" || l.TrangThai == "Đang hỗ trợ"))
                .OrderByDescending(l => l.ThoiGianGui)
                .FirstOrDefaultAsync();

            if (activeChat != null)
            {
                // Mở lại đúng cuộc chat đang mở
                return RedirectToAction("Index", "Chat", new { id = activeChat.IdLienHe });
            }

            // 3. Nếu chưa có, tạo cuộc chat mới trong SQL Server (Bảng LienHe + TinNhan)
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var newLienHe = new LienHe
                {
                    IdKhachHang = userId.Value,
                    IdNhanVien = null,
                    IdPhieu = null,
                    TieuDe = "Hỗ trợ trực tuyến",
                    NoiDung = "Khách hàng yêu cầu hỗ trợ trực tuyến.",
                    TrangThai = "Đang chờ",
                    NgayTao = DateOnly.FromDateTime(DateTime.Now),
                    ThoiGianGui = DateTime.Now,
                    SoTinChuaDoc = 1,
                    TinChuaDocKhach = 0
                };

                _context.LienHes.Add(newLienHe);
                await _context.SaveChangesAsync();

                var firstMsg = new TinNhan
                {
                    IdLienHe = newLienHe.IdLienHe,
                    LoaiNguoiGui = "Khách hàng",
                    TinNhan1 = "Khách hàng đã bắt đầu cuộc trò chuyện.",
                    TrangThai = "Chưa đọc",
                    ThoiGian = DateTime.Now
                };

                _context.TinNhans.Add(firstMsg);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return RedirectToAction("Index", "Chat", new { id = newLienHe.IdLienHe });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi tạo cuộc trò chuyện hỗ trợ trực tuyến");
                TempData["Error"] = "Không thể tạo cuộc trò chuyện: " + ex.Message;
                return RedirectToAction("TrangChu", "Customers");
            }
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
                //  4. Thống kê — tính trực tiếp từ database cho khách hàng
                // ----------------------------------------------------------
                var thongKeRaw = await _context.PhieuHoTros
                    .AsNoTracking()
                    .Where(p => p.IdKhachHang == idKhachHang)
                    .Select(p => p.TrangThai)
                    .ToListAsync();

                int tongPhieu    = thongKeRaw.Count;
                int dangXuLy     = thongKeRaw.Count(x => x == "DangXuLy" || x == "Đang xử lý");
                int choTiepNhan  = thongKeRaw.Count(x => x == "ChoTiepNhan" || x == "Chờ tiếp nhận");
                int daHoanThanh  = thongKeRaw.Count(x => x == "DaHoanThanh" || x == "Hoàn thành" || x == "Đã hoàn thành");
                int daHuy        = thongKeRaw.Count(x => x == "DaHuy" || x == "Đã hủy");

                // ----------------------------------------------------------
                //  5. Danh sách dịch vụ (lấy từ bảng DichVu)
                // ----------------------------------------------------------
                var danhSachDichVu = await _context.DichVus
                    .AsNoTracking()
                    .Select(d => d.TenDichVu)
                    .Where(t => !string.IsNullOrEmpty(t))
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

                // 7a. Trạng thái (hỗ trợ cả mã trạng thái và tên hiển thị tiếng Việt)
                if (!string.IsNullOrWhiteSpace(status))
                {
                    baseQuery = status switch
                    {
                        "ChoTiepNhan" => baseQuery.Where(p => p.TrangThai == "ChoTiepNhan" || p.TrangThai == "Chờ tiếp nhận"),
                        "DangXuLy"    => baseQuery.Where(p => p.TrangThai == "DangXuLy" || p.TrangThai == "Đang xử lý"),
                        "DaHoanThanh" => baseQuery.Where(p => p.TrangThai == "DaHoanThanh" || p.TrangThai == "Hoàn thành" || p.TrangThai == "Đã hoàn thành"),
                        "DaHuy"       => baseQuery.Where(p => p.TrangThai == "DaHuy" || p.TrangThai == "Đã hủy"),
                        _             => baseQuery.Where(p => p.TrangThai == status)
                    };
                }

                // 7b. Mức ưu tiên
                if (!string.IsNullOrWhiteSpace(priority))
                {
                    int? mucUuTienSo = priority switch
                    {
                        "Low"      => 1,
                        "Medium"   => 2,
                        "High"     => 3,
                        "Critical" => 4,
                        "1"        => 1,
                        "2"        => 2,
                        "3"        => 3,
                        "4"        => 4,
                        _          => null
                    };
                    if (mucUuTienSo.HasValue)
                        baseQuery = baseQuery.Where(p => p.MucDoUuTien == mucUuTienSo.Value);
                }

                // 7c. Dịch vụ
                if (!string.IsNullOrWhiteSpace(service))
                {
                    baseQuery = baseQuery.Where(p =>
                        p.IdDichVuNavigation != null
                     && p.IdDichVuNavigation.TenDichVu == service);
                }

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
                    "date_asc"      => baseQuery.OrderBy(p => p.NgayTao),
                    "priority"      => baseQuery.OrderByDescending(p => p.MucDoUuTien),
                    "priority_desc" => baseQuery.OrderByDescending(p => p.MucDoUuTien),
                    "status"        => baseQuery.OrderBy(p => p.TrangThai),
                    "service"       => baseQuery.OrderBy(p => p.IdDichVuNavigation != null ? p.IdDichVuNavigation.TenDichVu : null),
                    "maPhieu"       => baseQuery.OrderBy(p => p.MaPhieu),
                    _               => baseQuery.OrderByDescending(p => p.NgayTao)  // mặc định mới nhất trước
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

        // ================================================================
        //  POST  Customers/HuyPhieu
        //  Hủy phiếu hỗ trợ dành cho Khách hàng khi phiếu ở trạng thái "Chờ tiếp nhận"
        // ================================================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Route("HuyPhieu")]
        [Route("Customers/HuyPhieu")]
        public async Task<IActionResult> HuyPhieu([FromForm] int id, [FromForm] int? idPhieu, [FromForm] string? lyDoHuy)
        {
            int targetId = id > 0 ? id : (idPhieu ?? 0);

            // 1 & 2: Lấy ID khách hàng từ Session hoặc Claims
            var idKhachHang = HttpContext.Session.GetInt32("UserId")
                           ?? HttpContext.Session.GetInt32("IdKhachHang");

            if (idKhachHang == null)
            {
                var claimVal = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(claimVal, out int claimId))
                    idKhachHang = claimId;
            }

            if (idKhachHang == null || idKhachHang.Value <= 0)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." });
                }
                TempData["ErrorMessage"] = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
                return RedirectToAction("DangNhap", "Auth");
            }

            if (targetId <= 0)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = "Không tìm thấy phiếu hỗ trợ." });
                }
                TempData["ErrorMessage"] = "Không tìm thấy phiếu hỗ trợ.";
                return RedirectToAction("PhieuCuaToi");
            }

            // 3. Tìm phiếu theo ID
            var phieu = await _context.PhieuHoTros
                .Include(p => p.LichHens)
                .FirstOrDefaultAsync(p => p.IdPhieu == targetId);

            // 4. Kiểm tra phiếu có tồn tại không
            if (phieu == null)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = "Không tìm thấy phiếu hỗ trợ." });
                }
                TempData["ErrorMessage"] = "Không tìm thấy phiếu hỗ trợ.";
                return RedirectToAction("PhieuCuaToi");
            }

            // 5. Kiểm tra quyền sở hữu phiếu
            if (phieu.IdKhachHang != idKhachHang.Value)
            {
                _logger.LogWarning("BẢO MẬT: Khách hàng Id={CurrentCustomerId} cố tình hủy phiếu Id={TicketId} thuộc Khách hàng Id={OwnerCustomerId}",
                    idKhachHang.Value, targetId, phieu.IdKhachHang);

                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return StatusCode(403, new { success = false, message = "Bạn không có quyền hủy phiếu hỗ trợ này." });
                }
                TempData["ErrorMessage"] = "Bạn không có quyền hủy phiếu hỗ trợ này.";
                return RedirectToAction("PhieuCuaToi");
            }

            // 6. Kiểm tra trạng thái phiếu — chỉ cho phép "Chờ tiếp nhận" / "ChoTiepNhan"
            string currentStatus = phieu.TrangThai?.Trim() ?? "";
            bool isChoTiepNhan = currentStatus.Equals("Chờ tiếp nhận", StringComparison.OrdinalIgnoreCase)
                              || currentStatus.Equals("ChoTiepNhan", StringComparison.OrdinalIgnoreCase);

            if (!isChoTiepNhan)
            {
                string errorMsg = "Phiếu không thể hủy vì đã được tiếp nhận hoặc xử lý.";
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = errorMsg });
                }
                TempData["ErrorMessage"] = errorMsg;
                return RedirectToAction("PhieuCuaToi");
            }

            // 7. Thực hiện cập nhật trạng thái phiếu và ghi nhật ký
            string trangThaiCu = phieu.TrangThai ?? "Chờ tiếp nhận";
            phieu.TrangThai = "Đã hủy";
            phieu.NgayCapNhat = DateOnly.FromDateTime(DateTime.Today);

            string cleanReason = lyDoHuy?.Trim() ?? "";
            string logDescription = !string.IsNullOrWhiteSpace(cleanReason)
                ? $"Khách hàng đã hủy phiếu hỗ trợ. Lý do: {cleanReason}"
                : "Khách hàng đã hủy phiếu hỗ trợ.";

            // Ghi nhận vào bảng LichSuHoTro
            var lichSuLog = new LichSuHoTro
            {
                IdPhieu = phieu.IdPhieu,
                IdNhanVien = phieu.IdNhanVien,
                TrangThaiCu = trangThaiCu,
                TrangThaiMoi = "Đã hủy",
                NoiDungCapNhat = logDescription,
                NgayCapNhat = DateOnly.FromDateTime(DateTime.Today)
            };
            _context.LichSuHoTros.Add(lichSuLog);

            // Đồng bộ hủy các lịch hẹn đính kèm nếu có
            if (phieu.LichHens != null && phieu.LichHens.Any())
            {
                foreach (var lh in phieu.LichHens)
                {
                    if (lh.TrangThai != "DaHuy" && lh.TrangThai != "Đã hủy")
                    {
                        lh.TrangThai = "DaHuy";
                        lh.LyDoHuy = !string.IsNullOrWhiteSpace(cleanReason)
                            ? $"Lịch hẹn bị hủy do khách hàng hủy phiếu hỗ trợ ({cleanReason})."
                            : "Lịch hẹn bị hủy do khách hàng hủy phiếu hỗ trợ.";
                        lh.NgayHuy = DateTime.Now;
                        lh.NguoiHuy = "KhachHang";

                        _context.LichSuHoTros.Add(new LichSuHoTro
                        {
                            IdPhieu = phieu.IdPhieu,
                            IdNhanVien = lh.IdNhanVien ?? phieu.IdNhanVien,
                            TrangThaiCu = lh.TrangThai,
                            TrangThaiMoi = "DaHuy",
                            NoiDungCapNhat = "Lịch hẹn đã được hủy tự động do khách hàng hủy phiếu hỗ trợ.",
                            NgayCapNhat = DateOnly.FromDateTime(DateTime.Today)
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Hủy phiếu hỗ trợ Id={TicketId} (MaPhieu={MaPhieu}) thành công cho Khách hàng Id={CustomerId}",
                phieu.IdPhieu, phieu.MaPhieu, idKhachHang.Value);

            string successMsg = $"Hủy phiếu hỗ trợ {phieu.MaPhieu} thành công.";

            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return Json(new { success = true, message = successMsg, idPhieu = phieu.IdPhieu, trangThai = "Đã hủy" });
            }

            TempData["SuccessMessage"] = successMsg;
            return RedirectToAction("PhieuCuaToi");
        }
    }
}
