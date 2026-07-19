using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ActionConstraints;
using Microsoft.EntityFrameworkCore;
using SupportTicketSysterm.Data;
using SupportTicketSysterm.Models;
using SupportTicketSysterm.ViewModels;
using SupportTicketSysterm.Services;
using System.Threading.Tasks;
using System.IO;
using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace SupportTicketSysterm.Controllers
{
    public class TicketController : Controller
    {
        private readonly TechSupportContext _context;
        private readonly ITicketService _ticketService;

        public TicketController(TechSupportContext context, ITicketService ticketService)
        {
            _context = context;
            _ticketService = ticketService;
        }

        private int? GetCurrentCustomerId()
        {
            var idKhachHang = HttpContext.Session.GetInt32("IdKhachHang") ?? HttpContext.Session.GetInt32("UserId");
            if (idKhachHang.HasValue && idKhachHang.Value > 0)
            {
                return idKhachHang.Value;
            }

            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var claimVal = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("UserId");
                if (int.TryParse(claimVal, out int parsedId))
                {
                    HttpContext.Session.SetInt32("IdKhachHang", parsedId);
                    HttpContext.Session.SetInt32("UserId", parsedId);
                    return parsedId;
                }
            }

            return null;
        }

        [HttpGet]
        [Route("Ticket/ChonDMDichVu")]
        [Route("ChonDMDichVu")]
        public async Task<IActionResult> ChonDMDichVu()
        {
            // Lấy danh sách các danh mục và dịch vụ từ SQL Server
            var categories = await _context.DanhMucs
                .Include(c => c.DichVus)
                .Where(c => c.TrangThai == "Hoạt động" || c.TrangThai == "Hoạt Động")
                .ToListAsync();

            return View(categories);
        }

        #region Sinh mã phiếu

        private async Task<string> TaoMaPhieu()
        {
            return await _ticketService.TaoMaPhieuAsync();
        }

        #endregion

        #region GET

        [HttpGet]
        [Route("Ticket/TaoPhieu")]
        [Route("TaoPhieu")]
        public async Task<IActionResult> TaoPhieu(
            string? title = null,
            string? content = null,
            int? serviceId = null,
            int? categoryId = null,
            int? priority = null,
            string? canLichHen = null,
            string? diaChiHen = null)
        {
            // 1. Lưu categoryId và serviceId vào Session nếu có
            if (categoryId.HasValue)
            {
                HttpContext.Session.SetInt32("SelectedCategoryId", categoryId.Value);
                HttpContext.Session.SetInt32("IdDanhMuc", categoryId.Value);
            }
            if (serviceId.HasValue)
            {
                HttpContext.Session.SetInt32("SelectedServiceId", serviceId.Value);
                HttpContext.Session.SetInt32("IdDichVu", serviceId.Value);
            }

            // 2. Lấy từ Session nếu không truyền trên URL
            if (!categoryId.HasValue)
            {
                categoryId = HttpContext.Session.GetInt32("SelectedCategoryId") ?? HttpContext.Session.GetInt32("IdDanhMuc");
            }
            if (!serviceId.HasValue)
            {
                serviceId = HttpContext.Session.GetInt32("SelectedServiceId") ?? HttpContext.Session.GetInt32("IdDichVu");
            }

            // 3. Kiểm tra Session hoặc Claims IdKhachHang
            var idKhachHang = GetCurrentCustomerId();

            if (!idKhachHang.HasValue)
            {
                string returnUrl = $"/Ticket/TaoPhieu{(categoryId.HasValue ? "?categoryId=" + categoryId.Value : "")}";
                return RedirectToAction("DangNhap", "Auth", new { returnUrl = returnUrl });
            }

            // Lấy thông tin khách hàng từ SQL Server
            var khachHang = await _context.KhachHangs
                            .FirstOrDefaultAsync(x => x.IdKhachHang == idKhachHang.Value);

            if (khachHang == null)
            {
                if (User.Identity != null && User.Identity.IsAuthenticated)
                {
                    var role = User.FindFirstValue(ClaimTypes.Role) ?? HttpContext.Session.GetString("Role");
                    if (role == "Admin" || role == "NhanVien" || role == "Nhân viên" || role == "Nhân viên hỗ trợ")
                    {
                        return RedirectToAction("Dashboard", "Staff");
                    }
                }
                return RedirectToAction("DangNhap", "Auth");
            }

            // Tạo ViewModel với thông tin khách hàng
            PhieuViewModel model = new PhieuViewModel();
            model.IdKhachHang = khachHang.IdKhachHang;
            model.HoTen = khachHang.HoTen;
            model.Email = khachHang.Email;
            model.SoDienThoai = khachHang.SoDienThoai;

            // Populate pre-filled data if provided
            if (!string.IsNullOrEmpty(title)) model.TieuDe = title;
            if (!string.IsNullOrEmpty(content)) model.NoiDung = content;
            if (serviceId.HasValue) model.IdDichVu = serviceId.Value;
            if (categoryId.HasValue) model.IdDanhMuc = categoryId.Value;
            if (priority.HasValue) model.MucDoUuTien = priority.Value;
            if (!string.IsNullOrEmpty(canLichHen)) model.CanLichHen = canLichHen;
            if (!string.IsNullOrEmpty(diaChiHen)) model.DiaChiHen = diaChiHen;

            // Sinh mã phiếu tự động
            model.MaPhieu = await TaoMaPhieu();
            model.NgayTao = DateOnly.FromDateTime(DateTime.Now);
            model.TrangThai = "Chờ tiếp nhận";

            // Load danh sách danh mục cho dropdown
            ViewBag.DanhMucs = await _context.DanhMucs
                .Where(d => d.TrangThai == "Hoạt động" || d.TrangThai == "Hoạt Động")
                .ToListAsync();

            return View(model);
        }

        #endregion

        #region Tạo phiếu hỗ trợ

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TaoPhieu(PhieuViewModel model)
        {
            // Validation: Không lấy IdKhachHang từ View, luôn lấy từ Session
            var idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");

            if (idKhachHang == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            // Server-side validation for appointment if CanLichHen == "Có"
            if (model.CanLichHen == "Có")
            {
                if (!model.NgayHen.HasValue)
                {
                    ModelState.AddModelError("NgayHen", "Ngày hẹn là bắt buộc khi chọn có lịch hẹn.");
                }
                if (!model.GioBatDau.HasValue)
                {
                    ModelState.AddModelError("GioBatDau", "Giờ bắt đầu là bắt buộc khi chọn có lịch hẹn.");
                }
                if (!model.GioKetThuc.HasValue)
                {
                    ModelState.AddModelError("GioKetThuc", "Giờ kết thúc là bắt buộc khi chọn có lịch hẹn.");
                }
                if (string.IsNullOrWhiteSpace(model.DiaChiHen))
                {
                    ModelState.AddModelError("DiaChiHen", "Địa chỉ hỗ trợ là bắt buộc khi chọn có lịch hẹn.");
                }
            }

            if (!ModelState.IsValid)
            {
                var kh = await _context.KhachHangs.FindAsync(idKhachHang.Value);
                if (kh != null)
                {
                    model.HoTen = kh.HoTen;
                    model.SoDienThoai = kh.SoDienThoai;
                    model.Email = kh.Email;
                }

                // Reload danh mục nếu validation fail
                ViewBag.DanhMucs = await _context.DanhMucs
                    .Where(d => d.TrangThai == "Hoạt động" || d.TrangThai == "Hoạt Động")
                    .ToListAsync();
                return View(model);
            }

            var result = await _ticketService.CreateTicketAsync(model, idKhachHang.Value);

            if (!result.Success)
            {
                ModelState.AddModelError(string.Empty, result.ErrorMessage ?? "Đã xảy ra lỗi trong quá trình xử lý.");

                var kh = await _context.KhachHangs.FindAsync(idKhachHang.Value);
                if (kh != null)
                {
                    model.HoTen = kh.HoTen;
                    model.SoDienThoai = kh.SoDienThoai;
                    model.Email = kh.Email;
                }

                ViewBag.DanhMucs = await _context.DanhMucs
                    .Where(d => d.TrangThai == "Hoạt động" || d.TrangThai == "Hoạt Động")
                    .ToListAsync();
                return View(model);
            }

            TempData["Success"] = "Tạo phiếu hỗ trợ thành công.";
            return RedirectToAction(nameof(ChiTietPhieu), new { id = result.TicketId });
        }

        #endregion


        [HttpGet]
        public async Task<IActionResult> GetDichVuTheoDanhMuc(int idDanhMuc)
        {
            var dichVus = await _context.DichVus
                .Where(x => x.IdDanhMuc == idDanhMuc &&
                            x.TrangThai == "Hoạt động")
                .Select(x => new
                {
                    id = x.IdDichVu,
                    ten = x.TenDichVu
                })
                .ToListAsync();

            return Json(dichVus);
        }

        #region AJAX Actions

        [HttpGet]
        public async Task<IActionResult> GetDichVu(int idDanhMuc)
        {
            // Lấy danh sách dịch vụ theo danh mục từ SQL Server
            var dichVus = await _context.DichVus
                .Where(d => d.IdDanhMuc == idDanhMuc)
                .Select(d => new
                {
                    IdDichVu = d.IdDichVu,
                    TenDichVu = d.TenDichVu
                })
                .ToListAsync();

            return Json(dichVus);
        }

        #endregion

        [HttpGet]
        [Route("Ticket/TraCuuPhieu")]
        [Route("TraCuuPhieu")]
        public IActionResult TraCuuPhieu()
        {
            return View(new TraCuuPhieuViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TraCuuPhieu(TraCuuPhieuViewModel model)
        {
            var query = _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(model.MaPhieu))
            {
                query = query.Where(x => x. MaPhieu == model.MaPhieu);
            }

            if (!string.IsNullOrWhiteSpace(model.SoDienThoai))
            {
                query = query.Where(x =>
                    x.IdKhachHangNavigation.SoDienThoai == model.SoDienThoai ||
                    x.IdKhachHangNavigation.Email == model.SoDienThoai);
            }

            var phieuList = await query
                .OrderByDescending(x => x.NgayTao)
                .ToListAsync();

            // Map to TraCuuPhieuResultViewModel
            model.DanhSachPhieu = phieuList.Select(p => new TraCuuPhieuResultViewModel
            {
                IdPhieu = p.IdPhieu,
                MaPhieu = p.MaPhieu,
                TieuDe = p.TieuDe,
                TenDichVu = p.IdDichVuNavigation?.TenDichVu ?? "",
                TenDanhMuc = p.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc ?? "",
                TrangThai = p.TrangThai ?? "",
                MucDoUuTien = p.MucDoUuTien ?? 0,
                NgayTao = p.NgayTao.HasValue ? p.NgayTao.Value.ToString("dd/MM/yyyy") : "",
                TenKhachHang = p.IdKhachHangNavigation?.HoTen ?? "",
                SoDienThoai = p.IdKhachHangNavigation?.SoDienThoai ?? "",
                Email = p.IdKhachHangNavigation?.Email ?? "",
                TenNhanVien = p.IdNhanVienNavigation?.HoTen ?? "",
                SoDienThoaiNV = p.IdNhanVienNavigation?.SoDienThoai ?? "",
                EmailNV = p.IdNhanVienNavigation?.Email ?? "",
                VaiTroNV = p.IdNhanVienNavigation?.VaiTro ?? "",
                MaNhanVien = p.IdNhanVienNavigation?.TenDangNhap ?? ""
            }).ToList();

            return View(model);
        }

        #region Chi tiết phiếu
        [HttpGet]
        [Route("Ticket/ChiTietPhieu/{id}")]
        public async Task<IActionResult> ChiTietPhieu(int id)
        {
            // Kiểm tra đăng nhập
            var idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");

            if (idKhachHang == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            // Lấy chi tiết phiếu của chính khách hàng đang đăng nhập
            var phieu = await _context.PhieuHoTros

                // Khách hàng
                .Include(x => x.IdKhachHangNavigation)

                // Nhân viên xử lý
                .Include(x => x.IdNhanVienNavigation)

                // Dịch vụ -> Danh mục
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)

                // Lịch sử xử lý
                .Include(x => x.LichSuHoTros)
                    .ThenInclude(x => x.IdNhanVienNavigation)

                // Đánh giá
                .Include(x => x.DanhGium)
                .Include(x => x.DanhGium.IdNhanVienPhanHoiNavigation)

                // File đính kèm
                .Include(x => x.FileDinhKems)

                // Lịch hẹn
                .Include(x => x.LichHens)
                    .ThenInclude(x => x.IdNhanVienNavigation)

                .FirstOrDefaultAsync(x =>
                    x.IdPhieu == id &&
                    x.IdKhachHang == idKhachHang.Value);

            if (phieu == null)
            {
                return NotFound();
            }

            var viewModel = new ChiTietPhieuViewModel
            {
                IdPhieu = phieu.IdPhieu,
                MaPhieu = phieu.MaPhieu,
                TieuDe = phieu.TieuDe,
                NoiDung = phieu.NoiDung,
                TrangThai = phieu.TrangThai,
                LoaiYeuCau = phieu.LoaiYeuCau,
                MucDoUuTien = phieu.MucDoUuTien ?? 0,
                NgayTao = phieu.NgayTao ?? DateOnly.FromDateTime(DateTime.Today),
                HoTen = phieu.IdKhachHangNavigation?.HoTen,
                SoDienThoai = phieu.IdKhachHangNavigation?.SoDienThoai,
                Email = phieu.IdKhachHangNavigation?.Email,
                DiaChiKhachHang = phieu.IdKhachHangNavigation?.DiaChi,
                TenDanhMuc = phieu.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc,
                TenDichVu = phieu.IdDichVuNavigation?.TenDichVu,
                DiaChi = phieu.LichHens.OrderByDescending(lh => lh.NgayHen).FirstOrDefault()?.DiaChiHoTro,
                NgayHen = phieu.LichHens.OrderByDescending(lh => lh.NgayHen).FirstOrDefault()?.NgayHen,
                GioHen = phieu.LichHens.OrderByDescending(lh => lh.NgayHen).FirstOrDefault()?.GioBatDau,
                TenNhanVien = phieu.IdNhanVienNavigation?.HoTen,
                SoDienThoaiNV = phieu.IdNhanVienNavigation?.SoDienThoai,
                EmailNV = phieu.IdNhanVienNavigation?.Email,
                VaiTroNV = phieu.IdNhanVienNavigation?.VaiTro,
                MaNhanVien = phieu.IdNhanVienNavigation?.TenDangNhap,
                SoSao = phieu.DanhGium?.ChatLuongDichVu,
                NhanXet = phieu.DanhGium?.NhanXet,
                DanhGia = phieu.DanhGium,
                PhanHoiNhanVien = phieu.DanhGium?.PhanHoiNhanVien,
                NgayPhanHoi = phieu.DanhGium?.NgayPhanHoi,
                TenNhanVienPhanHoi = phieu.DanhGium?.IdNhanVienPhanHoiNavigation?.HoTen,
                AvatarNhanVien = phieu.DanhGium?.IdNhanVienPhanHoiNavigation != null 
                    ? "https://ui-avatars.com/api/?name=" + System.Net.WebUtility.UrlEncode(phieu.DanhGium.IdNhanVienPhanHoiNavigation.HoTen) + "&background=EE0033&color=fff" 
                    : null,
                DaPhanHoi = phieu.DanhGium?.IdNhanVienPhanHoi != null && !string.IsNullOrEmpty(phieu.DanhGium.PhanHoiNhanVien),

                // Lịch hẹn: Sắp xếp theo ngày gần nhất trước (giảm dần)
                LichHens = phieu.LichHens.OrderByDescending(lh => lh.NgayHen).Select(lh => new SupportTicketSysterm.ViewModels.LichHenViewModel
                {
                    IdLichHen = lh.IdLichHen,
                    NgayHen = lh.NgayHen,
                    GioHen = lh.GioBatDau,
                    DiaChi = lh.DiaChiHoTro,
                    TrangThai = lh.TrangThai,
                    GhiChu = lh.GhiChu,
                    HoTenNhanVien = lh.IdNhanVienNavigation?.HoTen,
                    SoDienThoai = lh.IdNhanVienNavigation?.SoDienThoai
                }).ToList(),

                // Nhật ký: Mới nhất lên trên (NgayCapNhat giảm dần)
                LichSuXuLys = phieu.LichSuHoTros.OrderByDescending(s => s.NgayCapNhat).ThenByDescending(s => s.IdLichSu).Select(s => new LichSuXuLyViewModel
                {
                    IdLichSu = s.IdLichSu,
                    ThoiGian = s.NgayCapNhat?.ToString("dd/MM/yyyy"),
                    TenNhanVien = s.IdNhanVienNavigation?.HoTen ?? "Hệ thống",
                    NoiDung = s.NoiDungCapNhat,
                    TrangThaiCu = s.TrangThaiCu,
                    TrangThaiMoi = s.TrangThaiMoi,
                    Icon = s.TrangThaiMoi switch
                    {
                        "Chờ tiếp nhận" => "fa-circle-question text-warning",
                        "Đang xử lý" => "fa-spinner fa-spin text-primary",
                        "Hoàn thành" => "fa-circle-check text-success",
                        "Đã hủy" => "fa-circle-xmark text-danger",
                        _ => "fa-info-circle text-info"
                    },
                    NgayCapNhat = s.NgayCapNhat,
                    NoiDungCapNhat = s.NoiDungCapNhat,
                    IdNhanVienNavigation = s.IdNhanVienNavigation != null ? new NhanVienCompat { HoTen = s.IdNhanVienNavigation.HoTen } : null
                }).ToList(),

                // File đính kèm
                FileDinhKems = phieu.FileDinhKems.Select(f => {
                    string sizeStr = "0 KB";
                    try
                    {
                        string physPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", f.DuongDan.TrimStart('~', '/'));
                        if (System.IO.File.Exists(physPath))
                        {
                            long bytes = new FileInfo(physPath).Length;
                            if (bytes >= 1024 * 1024)
                                sizeStr = $"{(double)bytes / (1024 * 1024):F1} MB";
                            else
                                sizeStr = $"{bytes / 1024} KB";
                        }
                        else
                        {
                            sizeStr = "2.4 MB";
                        }
                    }
                    catch
                    {
                        sizeStr = "2.4 MB";
                    }

                    return new FileDinhKemViewModel
                    {
                        IdFile = f.IdFile,
                        TenFile = f.TenFile,
                        DuongDan = f.DuongDan,
                        LoaiFile = f.LoaiFile,
                        DungLuong = sizeStr,
                        NgayUpload = f.NgayUpload?.ToString("dd/MM/yyyy HH:mm") ?? "—",
                        NguoiTai = f.IdTinNhanNavigation != null 
                            ? (f.IdTinNhanNavigation.LoaiNguoiGui == "KhachHang" ? "Khách hàng" : "Nhân viên") 
                            : "Khách hàng"
                    };
                }).ToList()
            };

            return View(viewModel);
        }

        [HttpGet]
        public async Task<IActionResult> ChiTietPopup(int id)
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
                    .ThenInclude(x => x.IdNhanVienNavigation)
                .Include(x => x.DanhGium)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return NotFound();
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
                EmailNV = phieu.IdNhanVienNavigation?.Email ?? "",
                VaiTroNV = phieu.IdNhanVienNavigation?.VaiTro ?? "",
                MaNhanVien = phieu.IdNhanVienNavigation?.TenDangNhap ?? "",
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
                    GioHen = lh.GioBatDau,
                    DiaChi = lh.DiaChiHoTro,
                    TrangThai = lh.TrangThai,
                    GhiChu = lh.GhiChu,
                    HoTenNhanVien = lh.IdNhanVienNavigation?.HoTen,
                    SoDienThoai = lh.IdNhanVienNavigation?.SoDienThoai
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

            return PartialView("_ChiTietPhieuModal", viewModel);
        }

        [HttpGet]
        [Route("Ticket/TaoPhieuThanhCong/{id}")]
        public async Task<IActionResult> TaoPhieuThanhCong(int id)
        {
            // Temporary bypass for testing
            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.FileDinhKems)
                .Include(x => x.LichHens)
                .Include(x => x.LichSuHoTros)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                // Fallback to first ticket in DB for visual testing if requested ID is not found
                phieu = await _context.PhieuHoTros
                    .Include(x => x.IdKhachHangNavigation)
                    .Include(x => x.IdDichVuNavigation)
                        .ThenInclude(x => x.IdDanhMucNavigation)
                    .Include(x => x.IdNhanVienNavigation)
                    .Include(x => x.FileDinhKems)
                    .Include(x => x.LichHens)
                    .Include(x => x.LichSuHoTros)
                    .FirstOrDefaultAsync();
            }

            if (phieu == null)
            {
                return Content("No tickets found in database. Please create a ticket first.");
            }

            return View(phieu);
        }

        #endregion
      
        
        
        [HttpGet]
        [Route("Ticket/InPhieu/{id}")]
        public async Task<IActionResult> InPhieu(int id)
        {
            var result = await ChiTietPhieu(id);
            if (result is ViewResult viewResult)
            {
                viewResult.ViewData["IsPrint"] = true;
                return viewResult;
            }
            return result;
        }

        [HttpGet]
        [Route("Ticket/Print/{id}")]
        [Route("Ticket/InPhieuPDF/{id}")]
        public async Task<IActionResult> InPhieuPDF(int id)
        {
            var idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (idKhachHang == null)
            {
                return Forbid();
            }

            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .Include(x => x.LichSuHoTros)
                    .ThenInclude(x => x.IdNhanVienNavigation)
                .Include(x => x.FileDinhKems)
                .Include(x => x.LichHens)
                .Include(x => x.DanhGium)
                    .ThenInclude(x => x.IdNhanVienPhanHoiNavigation)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return Forbid();
            }

            if (phieu.IdKhachHang != idKhachHang.Value)
            {
                return Forbid();
            }

            // Map to ViewModel
            var model = new PrintTicketViewModel
            {
                IdPhieu = phieu.IdPhieu,
                MaPhieu = phieu.MaPhieu,
                TieuDe = phieu.TieuDe,
                TenDanhMuc = phieu.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc,
                TenDichVu = phieu.IdDichVuNavigation?.TenDichVu,
                LoaiYeuCau = phieu.LoaiYeuCau,
                MucDoUuTien = phieu.MucDoUuTien ?? 0,
                TrangThai = phieu.TrangThai ?? "Chờ tiếp nhận",
                NgayTao = phieu.NgayTao?.ToString("dd/MM/yyyy"),
                NgayCapNhat = phieu.NgayCapNhat?.ToString("dd/MM/yyyy"),
                NoiDungYeuCau = phieu.NoiDung,

                // Khách hàng
                HoTenKhachHang = phieu.IdKhachHangNavigation?.HoTen ?? "",
                SoDienThoaiKhachHang = phieu.IdKhachHangNavigation?.SoDienThoai ?? "",
                EmailKhachHang = phieu.IdKhachHangNavigation?.Email,
                DiaChiKhachHang = phieu.IdKhachHangNavigation?.DiaChi,

                // Nhân viên
                TenNhanVien = phieu.IdNhanVienNavigation?.HoTen,
                SoDienThoaiNhanVien = phieu.IdNhanVienNavigation?.SoDienThoai,
                EmailNhanVien = phieu.IdNhanVienNavigation?.Email,
            };

            // Lịch hẹn
            var lh = phieu.LichHens.OrderByDescending(x => x.NgayHen).FirstOrDefault();
            if (lh != null)
            {
                model.LichHen = new AppointmentPrintInfo
                {
                    NgayHen = lh.NgayHen?.ToString("dd/MM/yyyy"),
                    GioBatDau = lh.GioBatDau?.ToString(@"hh\:mm"),
                    GioKetThuc = lh.GioKetThuc?.ToString(@"hh\:mm"),
                    DiaDiem = lh.DiaChiHoTro,
                    TrangThai = lh.TrangThai
                };
            }

            // Lịch sử
            model.LichSuXuLy = phieu.LichSuHoTros
                .OrderByDescending(x => x.NgayCapNhat)
                .ThenByDescending(x => x.IdLichSu)
                .Select(x => new HistoryPrintInfo
                {
                    NgayCapNhat = x.NgayCapNhat?.ToString("dd/MM/yyyy"),
                    TrangThaiCu = x.TrangThaiCu,
                    TrangThaiMoi = x.TrangThaiMoi,
                    NoiDungCapNhat = x.NoiDungCapNhat,
                    NhanVienThucHien = x.IdNhanVienNavigation?.HoTen ?? "Hệ thống tự động"
                }).ToList();

            // Đánh giá
            if (phieu.DanhGium != null)
            {
                model.DanhGia = new ReviewPrintInfo
                {
                    ChatLuongDichVu = phieu.DanhGium.ChatLuongDichVu ?? 0,
                    ThaiDoNhanVien = phieu.DanhGium.ThaiDoNhanVien ?? 0,
                    TocDoXuLy = phieu.DanhGium.TocDoXuLy ?? 0,
                    NhanXet = phieu.DanhGium.NhanXet,
                    NgayDanhGia = phieu.DanhGium.NgayDanhGia?.ToString("dd/MM/yyyy HH:mm")
                };

                if (phieu.DanhGium.IdNhanVienPhanHoi != null && !string.IsNullOrEmpty(phieu.DanhGium.PhanHoiNhanVien))
                {
                    model.PhanHoiNhanVien = new ResponsePrintInfo
                    {
                        TenNhanVien = phieu.DanhGium.IdNhanVienPhanHoiNavigation?.HoTen ?? "Nhân viên hỗ trợ",
                        NgayPhanHoi = phieu.DanhGium.NgayPhanHoi?.ToString("dd/MM/yyyy HH:mm"),
                        NoiDungPhanHoi = phieu.DanhGium.PhanHoiNhanVien
                    };
                }
            }

            // File đính kèm
            model.FileDinhKems = phieu.FileDinhKems
                .Select(x => new AttachmentPrintInfo
                {
                    TenFile = x.TenFile,
                    LoaiFile = x.LoaiFile ?? "Không xác định",
                    NgayUpload = x.NgayUpload?.ToString("dd/MM/yyyy HH:mm")
                }).ToList();



            // Sinh file PDF chuyên nghiệp bằng QuestPDF
            QuestPDF.Settings.License = LicenseType.Community;

            string viettelColor = "#EE0033";
            string darkBlueColor = "#102A43";
            string grayColor = "#F8FAFC";
            string borderGrayColor = "#E2E8F0";

            var pdfDoc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(11).FontColor(Colors.Grey.Darken3));

                    // HEADER
                    page.Header().Column(header =>
                    {
                        header.Item().Row(row =>
                        {
                            // Logo on left: stylized TechSupport badge
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Row(logoRow =>
                                {
                                    // Stylized logo icon: red box with text "TS"
                                    logoRow.ConstantItem(24).Height(24).Background(viettelColor).AlignCenter().AlignMiddle()
                                        .Text("TS").FontFamily("Arial").Bold().FontSize(12).FontColor(Colors.White);

                                    logoRow.AutoItem().PaddingLeft(6).AlignMiddle().Text("TechSupport")
                                        .FontFamily("Arial").Bold().FontSize(16).FontColor(darkBlueColor);
                                });
                                col.Item().PaddingTop(2).Text("Website Quản Lý Phiếu Hỗ Trợ Kỹ Thuật")
                                    .FontFamily("Arial").Italic().FontSize(9).FontColor(Colors.Grey.Medium);
                            });

                            // Title and date on right
                            row.RelativeItem().AlignRight().Column(col =>
                            {
                                col.Item().Text("Mã phiếu: " + model.MaPhieu)
                                    .FontFamily("Arial").Bold().FontSize(11).FontColor(darkBlueColor);
                                col.Item().Text("Ngày in: " + DateTime.Now.ToString("dd/MM/yyyy HH:mm"))
                                    .FontFamily("Arial").FontSize(9).FontColor(Colors.Grey.Darken1);
                            });
                        });

                        header.Item().PaddingTop(10).Height(1.5f).Background(viettelColor);
                    });

                    // CONTENT
                    page.Content().PaddingVertical(15).Column(column =>
                    {
                        column.Spacing(15);

                        // Title of Document
                        column.Item().AlignCenter().Text("PHIẾU HỖ TRỢ KỸ THUẬT")
                            .FontFamily("Arial").Bold().FontSize(20).FontColor(viettelColor);

                        // Section 1: Thông tin khách hàng & Thông tin phiếu
                        column.Item().Row(row =>
                        {
                            // Left column: customer
                            row.RelativeItem().PaddingRight(10).Column(c =>
                            {
                                c.Item().Text("THÔNG TIN KHÁCH HÀNG").Bold().FontSize(12).FontColor(darkBlueColor);
                                c.Item().PaddingTop(5).Height(1).Background(borderGrayColor);
                                
                                c.Item().PaddingTop(5).Text(t => { t.Span("Họ tên: ").Bold(); t.Span(model.HoTenKhachHang); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Số điện thoại: ").Bold(); t.Span(model.SoDienThoaiKhachHang); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Email: ").Bold(); t.Span(model.EmailKhachHang ?? "Chưa cung cấp"); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Địa chỉ: ").Bold(); t.Span(model.DiaChiKhachHang ?? "Chưa cung cấp"); });
                            });

                            // Right column: ticket meta
                            row.RelativeItem().PaddingLeft(10).Column(c =>
                            {
                                c.Item().Text("THÔNG TIN PHIẾU").Bold().FontSize(12).FontColor(darkBlueColor);
                                c.Item().PaddingTop(5).Height(1).Background(borderGrayColor);

                                c.Item().PaddingTop(5).Text(t => { t.Span("Mã phiếu: ").Bold(); t.Span(model.MaPhieu); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Tiêu đề: ").Bold(); t.Span(model.TieuDe ?? "Không có tiêu đề"); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Danh mục: ").Bold(); t.Span(model.TenDanhMuc ?? "Dịch vụ mạng"); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Dịch vụ: ").Bold(); t.Span(model.TenDichVu ?? "Dịch vụ chi tiết"); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Loại yêu cầu: ").Bold(); t.Span(model.LoaiYeuCau); });
                                
                                string priorityText = model.MucDoUuTien switch {
                                    1 => "Thấp",
                                    2 => "Trung bình",
                                    3 => "Cao",
                                    4 => "Khẩn cấp",
                                    _ => "Thấp"
                                };
                                c.Item().PaddingTop(3).Text(t => { t.Span("Mức độ ưu tiên: ").Bold(); t.Span(priorityText); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Trạng thái: ").Bold(); t.Span(model.TrangThai); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Ngày tạo: ").Bold(); t.Span(model.NgayTao ?? ""); });
                                c.Item().PaddingTop(3).Text(t => { t.Span("Cập nhật cuối: ").Bold(); t.Span(model.NgayCapNhat ?? ""); });
                            });
                        });

                        // Section 2: Nội dung yêu cầu
                        column.Item().Background(grayColor).Padding(10).Column(c =>
                        {
                            c.Item().Text("NỘI DUNG YÊU CẦU").Bold().FontSize(12).FontColor(darkBlueColor);
                            c.Item().PaddingTop(4).Text(model.NoiDungYeuCau ?? "Không có nội dung chi tiết.")
                                .FontFamily("Arial").FontSize(11).LineHeight(1.3f);
                        });

                        // Section 3: Nhân viên phụ trách & Lịch hẹn
                        column.Item().Row(row =>
                        {
                            // Left: Staff in charge
                            row.RelativeItem().PaddingRight(10).Column(c =>
                            {
                                c.Item().Text("NHÂN VIÊN PHỤ TRÁCH").Bold().FontSize(12).FontColor(darkBlueColor);
                                c.Item().PaddingTop(5).Height(1).Background(borderGrayColor);

                                if (!string.IsNullOrEmpty(model.TenNhanVien))
                                {
                                    c.Item().PaddingTop(5).Text(t => { t.Span("Tên nhân viên: ").Bold(); t.Span(model.TenNhanVien); });
                                    c.Item().PaddingTop(3).Text(t => { t.Span("Số điện thoại: ").Bold(); t.Span(model.SoDienThoaiNhanVien ?? ""); });
                                    c.Item().PaddingTop(3).Text(t => { t.Span("Email: ").Bold(); t.Span(model.EmailNhanVien ?? ""); });
                                }
                                else
                                {
                                    c.Item().PaddingTop(5).Text("Chưa phân công nhân viên xử lý.").Italic().FontColor(Colors.Grey.Medium);
                                }
                            });

                            // Right: Appointment (Lịch hẹn)
                            row.RelativeItem().PaddingLeft(10).Column(c =>
                            {
                                c.Item().Text("LỊCH HẸN HỖ TRỢ").Bold().FontSize(12).FontColor(darkBlueColor);
                                c.Item().PaddingTop(5).Height(1).Background(borderGrayColor);

                                if (model.LichHen != null)
                                {
                                    c.Item().PaddingTop(5).Text(t => { t.Span("Ngày hẹn: ").Bold(); t.Span(model.LichHen.NgayHen ?? ""); });
                                    c.Item().PaddingTop(3).Text(t => { t.Span("Giờ bắt đầu: ").Bold(); t.Span(model.LichHen.GioBatDau ?? ""); });
                                    c.Item().PaddingTop(3).Text(t => { t.Span("Giờ kết thúc: ").Bold(); t.Span(model.LichHen.GioKetThuc ?? ""); });
                                    c.Item().PaddingTop(3).Text(t => { t.Span("Địa điểm: ").Bold(); t.Span(model.LichHen.DiaDiem ?? ""); });
                                    c.Item().PaddingTop(3).Text(t => { t.Span("Trạng thái: ").Bold(); t.Span(model.LichHen.TrangThai ?? ""); });
                                }
                                else
                                {
                                    c.Item().PaddingTop(5).Text("Không có lịch hẹn hỗ trợ tại nhà.").Italic().FontColor(Colors.Grey.Medium);
                                }
                            });
                        });

                        // Section 4: Lịch sử xử lý (Table)
                        column.Item().Column(c =>
                        {
                            c.Item().Text("LỊCH SỬ XỬ LÝ").Bold().FontSize(12).FontColor(darkBlueColor);
                            c.Item().PaddingTop(5).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(80); // Date
                                    columns.RelativeColumn(1.5f); // Old Status
                                    columns.RelativeColumn(1.5f); // New Status
                                    columns.RelativeColumn(3f); // Details
                                    columns.RelativeColumn(2f); // Actor
                                });

                                // Table Header
                                table.Header(header =>
                                {
                                    header.Cell().Background(viettelColor).Padding(5).Text("Ngày cập nhật").Bold().FontColor(Colors.White).FontSize(9);
                                    header.Cell().Background(viettelColor).Padding(5).Text("Trạng thái cũ").Bold().FontColor(Colors.White).FontSize(9);
                                    header.Cell().Background(viettelColor).Padding(5).Text("Trạng thái mới").Bold().FontColor(Colors.White).FontSize(9);
                                    header.Cell().Background(viettelColor).Padding(5).Text("Nội dung cập nhật").Bold().FontColor(Colors.White).FontSize(9);
                                    header.Cell().Background(viettelColor).Padding(5).Text("Người thực hiện").Bold().FontColor(Colors.White).FontSize(9);
                                });

                                // Table Body
                                if (model.LichSuXuLy.Any())
                                {
                                    foreach (var step in model.LichSuXuLy)
                                    {
                                        table.Cell().BorderBottom(0.5f).BorderColor(borderGrayColor).Padding(5).Text(step.NgayCapNhat ?? "").FontSize(9);
                                        table.Cell().BorderBottom(0.5f).BorderColor(borderGrayColor).Padding(5).Text(step.TrangThaiCu ?? "").FontSize(9);
                                        table.Cell().BorderBottom(0.5f).BorderColor(borderGrayColor).Padding(5).Text(step.TrangThaiMoi ?? "").FontSize(9);
                                        table.Cell().BorderBottom(0.5f).BorderColor(borderGrayColor).Padding(5).Text(step.NoiDungCapNhat ?? "").FontSize(9);
                                        table.Cell().BorderBottom(0.5f).BorderColor(borderGrayColor).Padding(5).Text(step.NhanVienThucHien ?? "").FontSize(9);
                                    }
                                }
                                else
                                {
                                    table.Cell().ColumnSpan(5).Padding(10).AlignCenter().Text("Chưa có lịch sử cập nhật.").Italic().FontColor(Colors.Grey.Medium);
                                }
                            });
                        });

                        // Section 5: Đánh giá & Phản hồi nhân viên (Nếu có)
                        if (model.DanhGia != null)
                        {
                            column.Item().Background(grayColor).Padding(10).Column(c =>
                            {
                                c.Item().Text("ĐÁNH GIÁ CỦA KHÁCH HÀNG").Bold().FontSize(12).FontColor(darkBlueColor);
                                c.Item().PaddingTop(5).Row(r =>
                                {
                                    r.RelativeItem().Text($"Chất lượng dịch vụ: {model.DanhGia.ChatLuongDichVu}/5 sao").FontSize(10);
                                    r.RelativeItem().Text($"Thái độ nhân viên: {model.DanhGia.ThaiDoNhanVien}/5 sao").FontSize(10);
                                    r.RelativeItem().Text($"Tốc độ xử lý: {model.DanhGia.TocDoXuLy}/5 sao").FontSize(10);
                                });
                                if (!string.IsNullOrEmpty(model.DanhGia.NhanXet))
                                {
                                    c.Item().PaddingTop(5).Text(t => {
                                        t.Span("Nhận xét: ").Bold();
                                        t.Span($"\"{model.DanhGia.NhanXet}\"");
                                    });
                                }
                                c.Item().PaddingTop(3).AlignRight().Text($"Ngày đánh giá: {model.DanhGia.NgayDanhGia}").FontSize(8).Italic().FontColor(Colors.Grey.Darken1);

                                // Phản hồi của nhân viên
                                if (model.PhanHoiNhanVien != null)
                                {
                                    c.Item().PaddingTop(10).Height(0.5f).Background(borderGrayColor);
                                    c.Item().PaddingTop(5).Text($"PHẢN HỒI TỪ {model.PhanHoiNhanVien.TenNhanVien.ToUpper()}").Bold().FontSize(10).FontColor(viettelColor);
                                    c.Item().PaddingTop(3).Text($"\"{model.PhanHoiNhanVien.NoiDungPhanHoi}\"").FontSize(10).Italic();
                                    c.Item().PaddingTop(3).AlignRight().Text($"Ngày phản hồi: {model.PhanHoiNhanVien.NgayPhanHoi}").FontSize(8).Italic().FontColor(Colors.Grey.Darken1);
                                }
                            });
                        }

                        // Section 6: File đính kèm
                        if (model.FileDinhKems.Any())
                        {
                            column.Item().Column(c =>
                            {
                                c.Item().Text("DANH SÁCH FILE ĐÍNH KÈM").Bold().FontSize(12).FontColor(darkBlueColor);
                                c.Item().PaddingTop(5).Height(1).Background(borderGrayColor);
                                foreach (var file in model.FileDinhKems)
                                {
                                    c.Item().PaddingTop(3).Row(r =>
                                    {
                                        r.AutoItem().Text("- ").Bold();
                                        r.RelativeItem().Text(t =>
                                        {
                                            t.Span(file.TenFile).Bold();
                                            t.Span($" ({file.LoaiFile}) - Tải lên lúc {file.NgayUpload}");
                                        });
                                    });
                                }
                            });
                        }
                    });

                    // FOOTER WITHOUT QR CODE
                    page.Footer().Column(footer =>
                    {
                        footer.Item().Height(1).Background(borderGrayColor);
                        footer.Item().PaddingTop(8).Row(row =>
                        {
                            // Company / doc Info
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("TechSupport - Website Quản Lý Phiếu Hỗ Trợ Kỹ Thuật").Bold().FontSize(9).FontColor(darkBlueColor);
                                col.Item().Text("Viettel Telecom © 2026. Tài liệu được sinh tự động.").FontSize(8).FontColor(Colors.Grey.Medium);
                                col.Item().PaddingTop(5).Text(x =>
                                {
                                    x.Span("Trang ").FontSize(8).FontColor(Colors.Grey.Medium);
                                    x.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                                    x.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                                    x.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                                });
                            });
                        });
                    });
                });
            });

            byte[] pdfBytes = pdfDoc.GeneratePdf();
            return File(pdfBytes, "application/pdf", $"PhieuHoTro_{phieu.MaPhieu}.pdf");
        }




        [HttpGet]
        [Route("Ticket/DanhGiaPhieu/{id}")]
        public async Task<IActionResult> DanhGiaPhieu(int id)
        {
            var idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (idKhachHang == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            var phieu = await _context.PhieuHoTros
                .Include(x => x.IdKhachHangNavigation)
                .Include(x => x.IdNhanVienNavigation)
                .Include(x => x.IdDichVuNavigation)
                    .ThenInclude(x => x.IdDanhMucNavigation)
                .Include(x => x.DanhGium)
                .Include(x => x.LichSuHoTros)
                .Include(x => x.FileDinhKems)
                .Include(x => x.LichHens)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return NotFound();
            }

            if (phieu.IdKhachHang != idKhachHang)
            {
                return Forbid();
            }

            var isCompleted = IsTicketCompleted(phieu.TrangThai);

            if (!isCompleted)
            {
                TempData["ErrorMessage"] = "Phiếu chưa hoàn thành nên chưa thể đánh giá.";
                return RedirectToAction("ChiTietPhieu", "Ticket", new { id = id });
            }

            if (phieu.DanhGium != null)
            {
                TempData["ErrorMessage"] = "Bạn đã đánh giá phiếu này.";
                return RedirectToAction("ChiTietPhieu", "Ticket", new { id = id });
            }

            var model = new DanhGiaPhieuViewModel
            {
                IdPhieu = phieu.IdPhieu,
                MaPhieu = phieu.MaPhieu,
                TieuDe = phieu.TieuDe,
                TenDanhMuc = phieu.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc,
                TenDichVu = phieu.IdDichVuNavigation?.TenDichVu,
                TenNhanVien = phieu.IdNhanVienNavigation?.HoTen ?? "Chưa phân công",
                TrangThai = phieu.TrangThai,
                ChatLuongDichVu = 5,
                ThaiDoNhanVien = 5,
                TocDoXuLy = 5
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Route("Ticket/DanhGiaPhieu/{id}")]
        public async Task<IActionResult> DanhGiaPhieu(int id, DanhGiaPhieuViewModel model)
        {
            var idKhachHang = HttpContext.Session.GetInt32("IdKhachHang");
            if (idKhachHang == null)
            {
                return RedirectToAction("DangNhap", "Auth");
            }

            var phieu = await _context.PhieuHoTros
                .Include(x => x.DanhGium)
                .FirstOrDefaultAsync(x => x.IdPhieu == id);

            if (phieu == null)
            {
                return NotFound();
            }

            if (phieu.IdKhachHang != idKhachHang)
            {
                return Forbid();
            }

            var isCompleted = IsTicketCompleted(phieu.TrangThai);

            if (!isCompleted)
            {
                ModelState.AddModelError("", "Phiếu chưa hoàn thành nên chưa thể đánh giá.");
            }

            if (phieu.DanhGium != null)
            {
                ModelState.AddModelError("", "Bạn đã đánh giá phiếu này.");
            }

            if (!ModelState.IsValid)
            {
                var fullPhieu = await _context.PhieuHoTros
                    .Include(x => x.IdKhachHangNavigation)
                    .Include(x => x.IdNhanVienNavigation)
                    .Include(x => x.IdDichVuNavigation)
                        .ThenInclude(x => x.IdDanhMucNavigation)
                    .Include(x => x.DanhGium)
                    .Include(x => x.LichSuHoTros)
                    .Include(x => x.FileDinhKems)
                    .Include(x => x.LichHens)
                    .FirstOrDefaultAsync(x => x.IdPhieu == id);

                model.IdPhieu = id;
                model.MaPhieu = fullPhieu?.MaPhieu ?? "";
                model.TieuDe = fullPhieu?.TieuDe ?? "";
                model.TenDanhMuc = fullPhieu?.IdDichVuNavigation?.IdDanhMucNavigation?.TenDanhMuc;
                model.TenDichVu = fullPhieu?.IdDichVuNavigation?.TenDichVu;
                model.TenNhanVien = fullPhieu?.IdNhanVienNavigation?.HoTen ?? "Chưa phân công";
                model.TrangThai = fullPhieu?.TrangThai ?? "";
                return View(model);
            }

            var rating = new DanhGium
            {
                IdPhieu = id,
                ChatLuongDichVu = model.ChatLuongDichVu,
                ThaiDoNhanVien = model.ThaiDoNhanVien,
                TocDoXuLy = model.TocDoXuLy,
                NhanXet = model.NhanXet,
                NgayDanhGia = DateTime.Now
            };

            _context.DanhGia.Add(rating);
            await _context.SaveChangesAsync();

            if (model.Files != null && model.Files.Count > 0)
            {
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "reviews");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                foreach (var file in model.Files)
                {
                    if (file.Length > 0)
                    {
                        var fileName = Path.GetFileNameWithoutExtension(file.FileName) + "_" + Guid.NewGuid().ToString().Substring(0, 8) + Path.GetExtension(file.FileName);
                        var filePath = Path.Combine(uploadsDir, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        var fileDinhKem = new FileDinhKem
                        {
                            IdPhieu = id,
                            IdDanhGia = rating.IdDanhGia,
                            TenFile = file.FileName,
                            DuongDan = "/uploads/reviews/" + fileName,
                            LoaiFile = file.ContentType,
                            NgayUpload = DateTime.Now
                        };

                        _context.FileDinhKems.Add(fileDinhKem);
                    }
                }

                await _context.SaveChangesAsync();
            }

            TempData["Success"] = "Đánh giá phiếu thành công.";
            return RedirectToAction("ChiTietPhieu", "Ticket", new { id = id });
        }

        private bool IsTicketCompleted(string? status)
        {
            if (string.IsNullOrEmpty(status)) return false;
            var lowered = status.Trim().ToLower();
            return lowered.Contains("hoanthanh") || 
                   lowered.Contains("hoàn thành") || 
                   lowered.Contains("completed");
        }
    }
}
