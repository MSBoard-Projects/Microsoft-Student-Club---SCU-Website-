using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using MSC.WebAPI.Data;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Models;
using Xunit;

namespace MSC.WebAPI.Tests;

public class AuthApiTests
{
    private const string Password = "Test-password-123!";

    [Fact]
    public async Task AuthorizationRejectsAnonymousAndWrongRole()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/users")).StatusCode);
        await Seed(factory, "editor@example.test", AdminRole.ContentEditor);
        var login = await Login(client, "editor@example.test");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/users")).StatusCode);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "fake-token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/users")).StatusCode);
    }

    [Fact]
    public async Task LegacyLoginPersistsIdentityRehashAndOneHourSession()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var adminId = await Seed(factory, "legacy@example.test", AdminRole.SuperAdmin, legacy: true);
        var before = DateTime.UtcNow;
        var login = await Login(client, " LEGACY@example.test ");
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(login.Token);
        Assert.InRange(jwt.ValidTo, before.AddHours(1).AddSeconds(-1), DateTime.UtcNow.AddHours(1));
        Assert.Equal(jwt.ValidTo, login.ExpiresAt);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var admin = await database.AdminUsers.FindAsync(adminId);
        Assert.NotNull(admin);
        Assert.False(admin.PasswordHash!.StartsWith("$2", StringComparison.Ordinal));
        Assert.NotNull(admin.LastLogin);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/admin/users")).StatusCode);
    }

    [Fact]
    public async Task RepeatedWrongPasswordsPersistLockout()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var adminId = await Seed(factory, "locked@example.test", AdminRole.SuperAdmin);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var response = await client.PostAsJsonAsync("/api/auth/login", new { email = "locked@example.test", password = "wrong" });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login",
            new { email = "locked@example.test", password = Password })).StatusCode);
        using var scope = factory.Services.CreateScope();
        var admin = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().AdminUsers.FindAsync(adminId);
        Assert.True(admin!.LockoutEnd > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task LastAdminIsProtectedAndDemotionInvalidatesOldToken()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var adminId = await Seed(factory, "owner@example.test", AdminRole.SuperAdmin);
        var login = await Login(client, "owner@example.test");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/admin/users/{adminId}",
            new { role = "ContentEditor" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.DeleteAsync($"/api/admin/users/{adminId}")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/admin/users",
            new { email = "second@example.test", password = Password, role = "SuperAdmin" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/admin/users/{adminId}",
            new { role = "ContentEditor" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/users")).StatusCode);
        var changedLogin = await Login(client, "owner@example.test");
        Assert.Equal("ContentEditor", changedLogin.Role);
    }

    [Fact]
    public async Task PasswordUpdateRejectsWeakPasswordsAndInvalidatesExistingSession()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var adminId = await Seed(factory, "password@example.test", AdminRole.SuperAdmin);
        var login = await Login(client, "password@example.test");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/admin/users/{adminId}",
            new { password = "abcdefghijkl" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/admin/users")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/admin/users/{adminId}",
            new { password = "Updated-password-456!" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/users")).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login",
            new { email = "password@example.test", password = Password })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/login",
            new { email = "password@example.test", password = "Updated-password-456!" })).StatusCode);
    }

    [Fact]
    public async Task SessionValidationAndLogoutRevokeTheIssuedToken()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Seed(factory, "session@example.test", AdminRole.SuperAdmin);
        var login = await Login(client, "session@example.test");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/session")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/session")).StatusCode);
        var newLogin = await Login(client, "session@example.test");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newLogin.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/session")).StatusCode);
    }

    [Theory]
    [InlineData("expired")]
    [InlineData("issuer")]
    [InlineData("audience")]
    [InlineData("signature")]
    public async Task InvalidJwtParametersAreRejected(string invalidParameter)
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Seed(factory, "jwt@example.test", AdminRole.SuperAdmin);
        var login = await Login(client, "jwt@example.test");
        var handler = new JwtSecurityTokenHandler();
        var claims = handler.ReadJwtToken(login.Token).Claims.Where(claim =>
            claim.Type != JwtRegisteredClaimNames.Exp && claim.Type != JwtRegisteredClaimNames.Iss &&
            claim.Type != JwtRegisteredClaimNames.Aud);
        var key = invalidParameter == "signature"
            ? "incorrect-test-signing-key-not-for-production-0123456789"
            : "test-only-signing-key-not-for-production-0123456789";
        var token = new JwtSecurityToken(
            issuer: invalidParameter == "issuer" ? "wrong-issuer" : "test-api",
            audience: invalidParameter == "audience" ? "wrong-audience" : "test-spa",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(invalidParameter == "expired" ? -1 : 10),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", handler.WriteToken(token));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/session")).StatusCode);
    }

    private static async Task<LoginResponse> Login(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LoginResponse>())!;
    }

    private static async Task<int> Seed(AuthApiFactory factory, string email, AdminRole role, bool legacy = false)
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AdminUser>>();
        var admin = new AdminUser { Email = email, UserName = email, Role = role };
        var result = await users.CreateAsync(admin, Password);
        Assert.True(result.Succeeded, string.Join("; ", result.Errors.Select(error => error.Description)));
        if (legacy)
        {
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password, workFactor: 4);
            Assert.True((await users.UpdateAsync(admin)).Succeeded);
        }
        return admin.Id;
    }
}

internal sealed class AuthApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", "test-only-signing-key-not-for-production-0123456789");
        builder.UseSetting("Jwt:Issuer", "test-api");
        builder.UseSetting("Jwt:Audience", "test-spa");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Server=unused;Database=unused");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
            _connection.Open();
            services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(_connection));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.EnsureCreated();
        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}