using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportTicketSysterm.Migrations
{
    /// <inheritdoc />
    public partial class DropChatMessagesTableIfExist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF OBJECT_ID(N'dbo.ChatMessages', N'U') IS NOT NULL DROP TABLE dbo.ChatMessages;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
