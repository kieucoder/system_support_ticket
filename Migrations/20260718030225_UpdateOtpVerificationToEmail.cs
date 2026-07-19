using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportTicketSysterm.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOtpVerificationToEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "OtpVerification");

            migrationBuilder.DropColumn(
                name: "UsedAt",
                table: "OtpVerification");

            migrationBuilder.RenameColumn(
                name: "OtpCodeHash",
                table: "OtpVerification",
                newName: "Email");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ExpiredAt",
                table: "OtpVerification",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "OtpVerification",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AddColumn<string>(
                name: "IPAddress",
                table: "OtpVerification",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OTP",
                table: "OtpVerification",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IPAddress",
                table: "OtpVerification");

            migrationBuilder.DropColumn(
                name: "OTP",
                table: "OtpVerification");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "OtpVerification",
                newName: "OtpCodeHash");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ExpiredAt",
                table: "OtpVerification",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "OtpVerification",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "OtpVerification",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UsedAt",
                table: "OtpVerification",
                type: "datetime",
                nullable: true);
        }
    }
}
