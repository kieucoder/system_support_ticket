using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportTicketSysterm.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOtpSystemHashedAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OTP",
                table: "TaiKhoan_OTP");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ThoiGianTao",
                table: "TaiKhoan_OTP",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<DateTime>(
                name: "HanSuDung",
                table: "TaiKhoan_OTP",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AddColumn<bool>(
                name: "DaSuDung",
                table: "TaiKhoan_OTP",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LoaiOTP",
                table: "TaiKhoan_OTP",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaOTPBam",
                table: "TaiKhoan_OTP",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SoLanNhapSai",
                table: "TaiKhoan_OTP",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DaSuDung",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropColumn(
                name: "LoaiOTP",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropColumn(
                name: "MaOTPBam",
                table: "TaiKhoan_OTP");

            migrationBuilder.DropColumn(
                name: "SoLanNhapSai",
                table: "TaiKhoan_OTP");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ThoiGianTao",
                table: "TaiKhoan_OTP",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "HanSuDung",
                table: "TaiKhoan_OTP",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OTP",
                table: "TaiKhoan_OTP",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}
