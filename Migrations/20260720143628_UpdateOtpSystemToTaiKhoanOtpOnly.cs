using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportTicketSysterm.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOtpSystemToTaiKhoanOtpOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OTP_KhachHang",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropTable(
                name: "XacThucOtp");

            migrationBuilder.DropPrimaryKey(
                name: "PK__TaiKhoan__2A0AD5FD0DE7C3F3",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropIndex(
                name: "UQ__PhieuHoT__2660BFE1A2B28B08",
                table: "PhieuHoTro");

            migrationBuilder.AlterColumn<string>(
                name: "OTP",
                table: "TaiKhoan_OTP",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(6)",
                oldUnicode: false,
                oldMaxLength: 6);

            migrationBuilder.AddColumn<DateTime>(
                name: "ThoiGianTao",
                table: "TaiKhoan_OTP",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "MaPhieu",
                table: "PhieuHoTro",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "LoaiYeuCau",
                table: "PhieuHoTro",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "CanLichHen",
                table: "PhieuHoTro",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "TieuDe",
                table: "LienHe",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "KhachHang",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "SoDienThoai",
                table: "KhachHang",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(15)",
                oldMaxLength: 15);

            migrationBuilder.AlterColumn<string>(
                name: "MatKhau",
                table: "KhachHang",
                type: "varchar(255)",
                unicode: false,
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldUnicode: false,
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "HoTen",
                table: "KhachHang",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<bool>(
                name: "DaXacThucEmail",
                table: "KhachHang",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TaiKhoan_OTP",
                table: "TaiKhoan_OTP",
                column: "IdOTP");

            migrationBuilder.CreateIndex(
                name: "UQ__PhieuHoT__2660BFE1A2B28B08",
                table: "PhieuHoTro",
                column: "MaPhieu",
                unique: true,
                filter: "[MaPhieu] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_TaiKhoan_OTP_KhachHang",
                table: "TaiKhoan_OTP",
                column: "IdKhachHang",
                principalTable: "KhachHang",
                principalColumn: "IdKhachHang",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaiKhoan_OTP_KhachHang",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TaiKhoan_OTP",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropIndex(
                name: "UQ__PhieuHoT__2660BFE1A2B28B08",
                table: "PhieuHoTro");

            migrationBuilder.DropColumn(
                name: "ThoiGianTao",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropColumn(
                name: "DaXacThucEmail",
                table: "KhachHang");

            migrationBuilder.AlterColumn<string>(
                name: "OTP",
                table: "TaiKhoan_OTP",
                type: "varchar(6)",
                unicode: false,
                maxLength: 6,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "MaPhieu",
                table: "PhieuHoTro",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "LoaiYeuCau",
                table: "PhieuHoTro",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CanLichHen",
                table: "PhieuHoTro",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TieuDe",
                table: "LienHe",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "KhachHang",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SoDienThoai",
                table: "KhachHang",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(15)",
                oldMaxLength: 15,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MatKhau",
                table: "KhachHang",
                type: "varchar(255)",
                unicode: false,
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldUnicode: false,
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "HoTen",
                table: "KhachHang",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK__TaiKhoan__2A0AD5FD0DE7C3F3",
                table: "TaiKhoan_OTP",
                column: "IdOTP");

            migrationBuilder.CreateTable(
                name: "XacThucOtp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DaSuDung = table.Column<bool>(type: "bit", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IdKhachHang = table.Column<int>(type: "int", nullable: true),
                    MaOtp = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NguoiTao = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SoLanThu = table.Column<int>(type: "int", nullable: false),
                    ThoiGianHetHan = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ThoiGianTao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XacThucOtp", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "UQ__PhieuHoT__2660BFE1A2B28B08",
                table: "PhieuHoTro",
                column: "MaPhieu",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_XacThucOTP_IdKhachHang",
                table: "XacThucOtp",
                column: "IdKhachHang");

            migrationBuilder.AddForeignKey(
                name: "FK_OTP_KhachHang",
                table: "TaiKhoan_OTP",
                column: "IdKhachHang",
                principalTable: "KhachHang",
                principalColumn: "IdKhachHang");
        }
    }
}
