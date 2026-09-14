using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSC.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class EventRegistrationUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RegistrationUrl",
                table: "Events",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RegistrationUrl",
                table: "Events");
        }
    }
}
