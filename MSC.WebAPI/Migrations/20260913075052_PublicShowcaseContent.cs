using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MSC.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class PublicShowcaseContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Members",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Events",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Events",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EndsAt",
                table: "Events",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gallery",
                table: "Events",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Events",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Events",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StartsAt",
                table: "Events",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Summary",
                table: "Events",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CommunityStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    RegisteredAttendees = table.Column<int>(type: "int", nullable: true),
                    EventLocations = table.Column<int>(type: "int", nullable: true),
                    Beneficiaries = table.Column<int>(type: "int", nullable: true),
                    EventsConducted = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StudentAchievements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StudentNames = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
                    AchievedAt = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    EvidenceUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAchievements", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "MemberTypes",
                columns: new[] { "Id", "TypeName" },
                values: new object[,]
                {
                    { 4, "Member" },
                    { 5, "Instructor" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Members_PublicId",
                table: "Members",
                column: "PublicId",
                unique: true,
                filter: "[PublicId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Slug",
                table: "Events",
                column: "Slug",
                unique: true,
                filter: "[Slug] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityStatistics");

            migrationBuilder.DropTable(
                name: "StudentAchievements");

            migrationBuilder.DropIndex(
                name: "IX_Members_PublicId",
                table: "Members");

            migrationBuilder.DropIndex(
                name: "IX_Events_Slug",
                table: "Events");

            migrationBuilder.DeleteData(
                table: "MemberTypes",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "MemberTypes",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "EndsAt",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Gallery",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "StartsAt",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "Events");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Members",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Events",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
