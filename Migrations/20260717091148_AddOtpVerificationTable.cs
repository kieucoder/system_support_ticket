using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportTicketSysterm.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpVerificationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdKhachHang = table.Column<int>(type: "int", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DanhMuc",
                columns: table => new
                {
                    IdDanhMuc = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenDanhMuc = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgayTao = table.Column<DateOnly>(type: "date", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DanhMuc__7E5B713D86F9EB57", x => x.IdDanhMuc);
                });

            migrationBuilder.CreateTable(
                name: "KhachHang",
                columns: table => new
                {
                    IdKhachHang = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaKH = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    HoTen = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DiaChi = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    NgaySinh = table.Column<DateOnly>(type: "date", nullable: true),
                    MatKhau = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgayTao = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__KhachHan__7CF5D836A178D854", x => x.IdKhachHang);
                });

            migrationBuilder.CreateTable(
                name: "NhanVien",
                columns: table => new
                {
                    IdNhanVien = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HoTen = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SoDienThoai = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DiaChi = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TenDangNhap = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VaiTro = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MatKhau = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgayTao = table.Column<DateOnly>(type: "date", nullable: true, defaultValueSql: "(getdate())"),
                    MaNhanVien = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Avatar = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__NhanVien__B829484532AC2146", x => x.IdNhanVien);
                });

            migrationBuilder.CreateTable(
                name: "OtpVerification",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhoneNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    OtpCodeHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    ExpiredAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    AttemptCount = table.Column<int>(type: "int", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UsedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpVerification", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DichVu",
                columns: table => new
                {
                    IdDichVu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdDanhMuc = table.Column<int>(type: "int", nullable: false),
                    TenDichVu = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgayTao = table.Column<DateOnly>(type: "date", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DichVu__C817D5DC49787F5A", x => x.IdDichVu);
                    table.ForeignKey(
                        name: "FK__DichVu__IdDanhMu__47DBAE45",
                        column: x => x.IdDanhMuc,
                        principalTable: "DanhMuc",
                        principalColumn: "IdDanhMuc");
                });

            migrationBuilder.CreateTable(
                name: "TaiKhoan_OTP",
                columns: table => new
                {
                    IdOTP = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdKhachHang = table.Column<int>(type: "int", nullable: false),
                    OTP = table.Column<string>(type: "varchar(6)", unicode: false, maxLength: 6, nullable: false),
                    HanSuDung = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__TaiKhoan__2A0AD5FD0DE7C3F3", x => x.IdOTP);
                    table.ForeignKey(
                        name: "FK_OTP_KhachHang",
                        column: x => x.IdKhachHang,
                        principalTable: "KhachHang",
                        principalColumn: "IdKhachHang");
                });

            migrationBuilder.CreateTable(
                name: "LichSuHoatDong",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdNhanVien = table.Column<int>(type: "int", nullable: true),
                    IdKhachHang = table.Column<int>(type: "int", nullable: true),
                    IP = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NoiDung = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NgayThucHien = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LichSuHoatDong", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LichSuHoatDong_KhachHang_IdKhachHang",
                        column: x => x.IdKhachHang,
                        principalTable: "KhachHang",
                        principalColumn: "IdKhachHang");
                    table.ForeignKey(
                        name: "FK_LichSuHoatDong_NhanVien_IdNhanVien",
                        column: x => x.IdNhanVien,
                        principalTable: "NhanVien",
                        principalColumn: "IdNhanVien");
                });

            migrationBuilder.CreateTable(
                name: "PhieuHoTro",
                columns: table => new
                {
                    IdPhieu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdKhachHang = table.Column<int>(type: "int", nullable: true),
                    IdNhanVien = table.Column<int>(type: "int", nullable: true),
                    IdDichVu = table.Column<int>(type: "int", nullable: true),
                    MaPhieu = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    TieuDe = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    MucDoUuTien = table.Column<int>(type: "int", nullable: true),
                    LoaiYeuCau = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NoiDung = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayTao = table.Column<DateOnly>(type: "date", nullable: true, defaultValueSql: "(getdate())"),
                    NgayCapNhat = table.Column<DateOnly>(type: "date", nullable: true),
                    CanLichHen = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__PhieuHoT__48C313854EE11F2E", x => x.IdPhieu);
                    table.ForeignKey(
                        name: "FK__PhieuHoTr__IdDic__4F7CD00D",
                        column: x => x.IdDichVu,
                        principalTable: "DichVu",
                        principalColumn: "IdDichVu");
                    table.ForeignKey(
                        name: "FK__PhieuHoTr__IdKha__4D94879B",
                        column: x => x.IdKhachHang,
                        principalTable: "KhachHang",
                        principalColumn: "IdKhachHang");
                    table.ForeignKey(
                        name: "FK__PhieuHoTr__IdNha__4E88ABD4",
                        column: x => x.IdNhanVien,
                        principalTable: "NhanVien",
                        principalColumn: "IdNhanVien");
                });

            migrationBuilder.CreateTable(
                name: "DanhGia",
                columns: table => new
                {
                    IdDanhGia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdPhieu = table.Column<int>(type: "int", nullable: true),
                    ChatLuongDichVu = table.Column<int>(type: "int", nullable: true),
                    ThaiDoNhanVien = table.Column<int>(type: "int", nullable: true),
                    TocDoXuLy = table.Column<int>(type: "int", nullable: true),
                    NhanXet = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NgayDanhGia = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    PhanHoiNhanVien = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayPhanHoi = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IdNhanVienPhanHoi = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DanhGia__81F722D23D384ECE", x => x.IdDanhGia);
                    table.ForeignKey(
                        name: "FK_DanhGia_NhanVien_IdNhanVienPhanHoi",
                        column: x => x.IdNhanVienPhanHoi,
                        principalTable: "NhanVien",
                        principalColumn: "IdNhanVien");
                    table.ForeignKey(
                        name: "FK__DanhGia__IdPhieu__66603565",
                        column: x => x.IdPhieu,
                        principalTable: "PhieuHoTro",
                        principalColumn: "IdPhieu");
                });

            migrationBuilder.CreateTable(
                name: "LichHen",
                columns: table => new
                {
                    IdLichHen = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdNhanVien = table.Column<int>(type: "int", nullable: true),
                    IdPhieu = table.Column<int>(type: "int", nullable: true),
                    NgayHen = table.Column<DateOnly>(type: "date", nullable: true),
                    GioBatDau = table.Column<TimeOnly>(type: "time", nullable: true),
                    GioKetThuc = table.Column<TimeOnly>(type: "time", nullable: true),
                    DiaChiHoTro = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__LichHen__C7CECEDC30600A2F", x => x.IdLichHen);
                    table.ForeignKey(
                        name: "FK__LichHen__IdNhanV__5DCAEF64",
                        column: x => x.IdNhanVien,
                        principalTable: "NhanVien",
                        principalColumn: "IdNhanVien");
                    table.ForeignKey(
                        name: "FK__LichHen__IdPhieu__5EBF139D",
                        column: x => x.IdPhieu,
                        principalTable: "PhieuHoTro",
                        principalColumn: "IdPhieu");
                });

            migrationBuilder.CreateTable(
                name: "LichSuHoTro",
                columns: table => new
                {
                    IdLichSu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdPhieu = table.Column<int>(type: "int", nullable: true),
                    IdNhanVien = table.Column<int>(type: "int", nullable: true),
                    TrangThaiCu = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TrangThaiMoi = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    NoiDungCapNhat = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    NgayCapNhat = table.Column<DateOnly>(type: "date", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__LichSuHo__823B17725F23BBB5", x => x.IdLichSu);
                    table.ForeignKey(
                        name: "FK__LichSuHoT__IdNha__5441852A",
                        column: x => x.IdNhanVien,
                        principalTable: "NhanVien",
                        principalColumn: "IdNhanVien");
                    table.ForeignKey(
                        name: "FK__LichSuHoT__IdPhi__534D60F1",
                        column: x => x.IdPhieu,
                        principalTable: "PhieuHoTro",
                        principalColumn: "IdPhieu");
                });

            migrationBuilder.CreateTable(
                name: "LienHe",
                columns: table => new
                {
                    IdLienHe = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdKhachHang = table.Column<int>(type: "int", nullable: true),
                    IdNhanVien = table.Column<int>(type: "int", nullable: true),
                    IdPhieu = table.Column<int>(type: "int", nullable: true),
                    ThoiGianGui = table.Column<DateTime>(type: "datetime", nullable: true),
                    SoTinChuaDoc = table.Column<int>(type: "int", nullable: true),
                    TinChuaDocKhach = table.Column<int>(type: "int", nullable: true),
                    TieuDe = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NoiDung = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    NgayTao = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__LienHe__03AC912A65747A5D", x => x.IdLienHe);
                    table.ForeignKey(
                        name: "FK_LienHe_PhieuHoTro",
                        column: x => x.IdPhieu,
                        principalTable: "PhieuHoTro",
                        principalColumn: "IdPhieu");
                    table.ForeignKey(
                        name: "FK__LienHe__IdKhachH__571DF1D5",
                        column: x => x.IdKhachHang,
                        principalTable: "KhachHang",
                        principalColumn: "IdKhachHang");
                    table.ForeignKey(
                        name: "FK__LienHe__IdNhanVi__5812160E",
                        column: x => x.IdNhanVien,
                        principalTable: "NhanVien",
                        principalColumn: "IdNhanVien");
                });

            migrationBuilder.CreateTable(
                name: "TinNhan",
                columns: table => new
                {
                    IdTinNhan = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdLienHe = table.Column<int>(type: "int", nullable: true),
                    LoaiNguoiGui = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ThoiGian = table.Column<DateTime>(type: "datetime", nullable: true),
                    TinNhan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__TinNhan__C1329D0D9C4927D0", x => x.IdTinNhan);
                    table.ForeignKey(
                        name: "FK__TinNhan__IdLienH__5AEE82B9",
                        column: x => x.IdLienHe,
                        principalTable: "LienHe",
                        principalColumn: "IdLienHe");
                });

            migrationBuilder.CreateTable(
                name: "FileDinhKem",
                columns: table => new
                {
                    IdFile = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdPhieu = table.Column<int>(type: "int", nullable: true),
                    IdTinNhan = table.Column<int>(type: "int", nullable: true),
                    IdDanhGia = table.Column<int>(type: "int", nullable: true),
                    TenFile = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DuongDan = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LoaiFile = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NgayUpload = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__FileDinh__01E644E13B84DED7", x => x.IdFile);
                    table.ForeignKey(
                        name: "FK__FileDinhK__IdDan__6B24EA82",
                        column: x => x.IdDanhGia,
                        principalTable: "DanhGia",
                        principalColumn: "IdDanhGia");
                    table.ForeignKey(
                        name: "FK__FileDinhK__IdPhi__6A30C649",
                        column: x => x.IdPhieu,
                        principalTable: "PhieuHoTro",
                        principalColumn: "IdPhieu");
                    table.ForeignKey(
                        name: "FK__FileDinhK__IdTin__6C190EBB",
                        column: x => x.IdTinNhan,
                        principalTable: "TinNhan",
                        principalColumn: "IdTinNhan");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DanhGia_IdNhanVienPhanHoi",
                table: "DanhGia",
                column: "IdNhanVienPhanHoi");

            migrationBuilder.CreateIndex(
                name: "UQ__DanhGia__48C313843604E870",
                table: "DanhGia",
                column: "IdPhieu",
                unique: true,
                filter: "[IdPhieu] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DichVu_IdDanhMuc",
                table: "DichVu",
                column: "IdDanhMuc");

            migrationBuilder.CreateIndex(
                name: "IX_FileDinhKem_IdDanhGia",
                table: "FileDinhKem",
                column: "IdDanhGia");

            migrationBuilder.CreateIndex(
                name: "IX_FileDinhKem_IdPhieu",
                table: "FileDinhKem",
                column: "IdPhieu");

            migrationBuilder.CreateIndex(
                name: "IX_FileDinhKem_IdTinNhan",
                table: "FileDinhKem",
                column: "IdTinNhan");

            migrationBuilder.CreateIndex(
                name: "UQ__KhachHan__A9D10534C8FE3D65",
                table: "KhachHang",
                column: "Email",
                unique: true,
                filter: "([Email] IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_LichHen_IdNhanVien",
                table: "LichHen",
                column: "IdNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_LichHen_IdPhieu",
                table: "LichHen",
                column: "IdPhieu");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuHoatDong_IdKhachHang",
                table: "LichSuHoatDong",
                column: "IdKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuHoatDong_IdNhanVien",
                table: "LichSuHoatDong",
                column: "IdNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuHoTro_IdNhanVien",
                table: "LichSuHoTro",
                column: "IdNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuHoTro_IdPhieu",
                table: "LichSuHoTro",
                column: "IdPhieu");

            migrationBuilder.CreateIndex(
                name: "IX_LienHe_IdKhachHang",
                table: "LienHe",
                column: "IdKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_LienHe_IdNhanVien",
                table: "LienHe",
                column: "IdNhanVien");

            migrationBuilder.CreateIndex(
                name: "IX_LienHe_IdPhieu",
                table: "LienHe",
                column: "IdPhieu");

            migrationBuilder.CreateIndex(
                name: "UQ__NhanVien__55F68FC08DF75591",
                table: "NhanVien",
                column: "TenDangNhap",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__NhanVien__A9D10534C79D90BE",
                table: "NhanVien",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhieuHoTro_IdDichVu",
                table: "PhieuHoTro",
                column: "IdDichVu");

            migrationBuilder.CreateIndex(
                name: "IX_PhieuHoTro_IdKhachHang",
                table: "PhieuHoTro",
                column: "IdKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_PhieuHoTro_IdNhanVien",
                table: "PhieuHoTro",
                column: "IdNhanVien");

            migrationBuilder.CreateIndex(
                name: "UQ__PhieuHoT__2660BFE1A2B28B08",
                table: "PhieuHoTro",
                column: "MaPhieu",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaiKhoan_OTP_IdKhachHang",
                table: "TaiKhoan_OTP",
                column: "IdKhachHang");

            migrationBuilder.CreateIndex(
                name: "IX_TinNhan_IdLienHe",
                table: "TinNhan",
                column: "IdLienHe");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "FileDinhKem");

            migrationBuilder.DropTable(
                name: "LichHen");

            migrationBuilder.DropTable(
                name: "LichSuHoatDong");

            migrationBuilder.DropTable(
                name: "LichSuHoTro");

            migrationBuilder.DropTable(
                name: "OtpVerification");

            migrationBuilder.DropTable(
                name: "TaiKhoan_OTP");

            migrationBuilder.DropTable(
                name: "DanhGia");

            migrationBuilder.DropTable(
                name: "TinNhan");

            migrationBuilder.DropTable(
                name: "LienHe");

            migrationBuilder.DropTable(
                name: "PhieuHoTro");

            migrationBuilder.DropTable(
                name: "DichVu");

            migrationBuilder.DropTable(
                name: "KhachHang");

            migrationBuilder.DropTable(
                name: "NhanVien");

            migrationBuilder.DropTable(
                name: "DanhMuc");
        }
    }
}
