using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;
using MSC.WebAPI.Services;
using Xunit;

namespace MSC.WebAPI.Tests;

public class CustomPasswordHasherTests
{
    private readonly CustomPasswordHasher _hasher = new(Options.Create(new PasswordHasherOptions()));
    private readonly AdminUser _user = new() { Email = "admin@example.test", PasswordHash = "" };

    [Fact]
    public void LegacyPasswordRequestsIdentityRehash()
    {
        var legacyHash = BCrypt.Net.BCrypt.HashPassword("Legacy-password-123!", workFactor: 4);
        Assert.Equal(PasswordVerificationResult.SuccessRehashNeeded,
            _hasher.VerifyHashedPassword(_user, legacyHash, "Legacy-password-123!"));
        Assert.Equal(PasswordVerificationResult.Failed,
            _hasher.VerifyHashedPassword(_user, legacyHash, "incorrect"));
    }

    [Fact]
    public void NewPasswordsUseIdentityFormat()
    {
        var hash = _hasher.HashPassword(_user, "New-password-123!");
        Assert.False(hash.StartsWith("$2", StringComparison.Ordinal));
        Assert.Equal(PasswordVerificationResult.Success,
            new PasswordHasher<AdminUser>().VerifyHashedPassword(_user, hash, "New-password-123!"));
        Assert.Equal(PasswordVerificationResult.Success,
            _hasher.VerifyHashedPassword(_user, hash, "New-password-123!"));
        Assert.Equal(PasswordVerificationResult.Failed,
            _hasher.VerifyHashedPassword(_user, hash, "incorrect"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-valid-hash")]
    [InlineData("$2a$broken")]
    [InlineData("$2b$broken")]
    [InlineData("$2y$broken")]
    public void InvalidStoredHashesFailClosed(string hash)
    {
        Assert.Equal(PasswordVerificationResult.Failed,
            _hasher.VerifyHashedPassword(_user, hash, "password"));
    }

    [Fact]
    public void IdentityPreservesTheExistingAdminTableAndIntegerKey()
    {
        using var database = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=ModelOnly;Trusted_Connection=True")
            .Options);
        var entity = database.Model.FindEntityType(typeof(AdminUser))!;
        Assert.Equal("AdminUsers", entity.GetTableName());
        Assert.Equal(typeof(int), entity.FindPrimaryKey()!.Properties.Single().ClrType);
        Assert.True(entity.FindProperty(nameof(AdminUser.ConcurrencyStamp))!.IsConcurrencyToken);
        Assert.Contains(entity.GetIndexes(), index => index.IsUnique &&
            index.Properties.Single().Name == nameof(AdminUser.NormalizedEmail));
    }
}