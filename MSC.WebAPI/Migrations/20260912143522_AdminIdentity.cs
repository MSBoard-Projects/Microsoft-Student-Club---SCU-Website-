using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSC.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdminIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccessFailedCount",
                table: "AdminUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "AdminUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmed",
                table: "AdminUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LockoutEnabled",
                table: "AdminUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LockoutEnd",
                table: "AdminUsers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalizedEmail",
                table: "AdminUsers",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalizedUserName",
                table: "AdminUsers",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "AdminUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PhoneNumberConfirmed",
                table: "AdminUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SecurityStamp",
                table: "AdminUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TwoFactorEnabled",
                table: "AdminUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UserName",
                table: "AdminUsers",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AdminUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AdminUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AdminUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM [AdminUsers] WHERE LTRIM(RTRIM([Email])) = '')
                    THROW 50001, 'Admin email cannot be empty. Correct the data before migrating.', 1;

                IF EXISTS (
                    SELECT UPPER(LTRIM(RTRIM([Email]))) FROM [AdminUsers]
                    GROUP BY UPPER(LTRIM(RTRIM([Email]))) HAVING COUNT(*) > 1
                )
                    THROW 50002, 'Duplicate normalized admin emails. Correct the data before migrating.', 1;

                UPDATE [AdminUsers]
                SET [Email] = LTRIM(RTRIM([Email])),
                    [UserName] = LTRIM(RTRIM([Email])),
                    [NormalizedEmail] = UPPER(LTRIM(RTRIM([Email]))),
                    [NormalizedUserName] = UPPER(LTRIM(RTRIM([Email]))),
                    [SecurityStamp] = CONVERT(nvarchar(36), NEWID()),
                    [ConcurrencyStamp] = CONVERT(nvarchar(36), NEWID()),
                    [LockoutEnabled] = 1;
                """);

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AdminUsers",
                column: "NormalizedEmail",
                unique: true,
                filter: "[NormalizedEmail] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AdminUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropIndex(
                name: "EmailIndex",
                table: "AdminUsers");

            migrationBuilder.DropIndex(
                name: "UserNameIndex",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "AccessFailedCount",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "EmailConfirmed",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "LockoutEnabled",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "LockoutEnd",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "NormalizedEmail",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "NormalizedUserName",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "PhoneNumberConfirmed",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "SecurityStamp",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "TwoFactorEnabled",
                table: "AdminUsers");

            migrationBuilder.DropColumn(
                name: "UserName",
                table: "AdminUsers");
        }
    }
}
