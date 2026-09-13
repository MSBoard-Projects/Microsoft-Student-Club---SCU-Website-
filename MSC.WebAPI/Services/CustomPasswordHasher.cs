using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Services;

public sealed class CustomPasswordHasher : IPasswordHasher<AdminUser>
{
    private readonly PasswordHasher<AdminUser> _identityHasher;

    public CustomPasswordHasher(IOptions<PasswordHasherOptions> options)
    {
        _identityHasher = new PasswordHasher<AdminUser>(options);
    }

    public string HashPassword(AdminUser user, string password) =>
        _identityHasher.HashPassword(user, password);

    public PasswordVerificationResult VerifyHashedPassword(
        AdminUser user, string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrEmpty(hashedPassword) || providedPassword is null)
        {
            return PasswordVerificationResult.Failed;
        }

        try
        {
            if (hashedPassword.StartsWith("$2a$", StringComparison.Ordinal) ||
                hashedPassword.StartsWith("$2b$", StringComparison.Ordinal) ||
                hashedPassword.StartsWith("$2y$", StringComparison.Ordinal))
            {
                return hashedPassword.Length == 60 && BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword)
                    ? PasswordVerificationResult.SuccessRehashNeeded
                    : PasswordVerificationResult.Failed;
            }

            return _identityHasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
        }
        catch (Exception exception) when (exception is BCrypt.Net.SaltParseException
            or FormatException or ArgumentException)
        {
            return PasswordVerificationResult.Failed;
        }
    }
}