using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSC.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class MemberPublicContacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FacebookUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GithubUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstagramUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LinkedInUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PublicEmail",
                table: "Members",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PublicPhone",
                table: "Members",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WebsiteUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FacebookUrl",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "GithubUrl",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "InstagramUrl",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "LinkedInUrl",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "PublicEmail",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "PublicPhone",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "WebsiteUrl",
                table: "Members");
        }
    }
}
