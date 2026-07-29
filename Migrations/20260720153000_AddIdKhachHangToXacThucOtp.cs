using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportTicketSysterm.Migrations
{
    /// <inheritdoc />
    public partial class AddIdKhachHangToXacThucOtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bước 1: Thêm cột IdKhachHang INT NULL vào bảng XacThucOtp
            migrationBuilder.AddColumn<int>(
                name: "IdKhachHang",
                table: "XacThucOtp",
                type: "int",
                nullable: true);

            // Bước 2: Tạo Foreign Key FK_XacThucOTP_KhachHang
            migrationBuilder.AddForeignKey(
                name: "FK_XacThucOTP_KhachHang",
                table: "XacThucOtp",
                column: "IdKhachHang",
                principalTable: "KhachHang",
                principalColumn: "IdKhachHang",
                onDelete: ReferentialAction.SetNull);

            // Bước 3: Tạo Index IX_XacThucOTP_IdKhachHang
            migrationBuilder.CreateIndex(
                name: "IX_XacThucOTP_IdKhachHang",
                table: "XacThucOtp",
                column: "IdKhachHang");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_XacThucOTP_KhachHang",
                table: "XacThucOtp");

            migrationBuilder.DropIndex(
                name: "IX_XacThucOTP_IdKhachHang",
                table: "XacThucOtp");

            migrationBuilder.DropColumn(
                name: "IdKhachHang",
                table: "XacThucOtp");
        }
    }
}
