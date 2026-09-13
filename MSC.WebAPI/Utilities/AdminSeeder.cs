using Microsoft.AspNetCore.Identity;
using MSC.WebAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MSC.WebAPI.Utilities;

public static class AdminSeeder
{
    public static async Task SeedSuperAdmin(UserManager<AdminUser> users, string email, string password)
    {
        // Check if any admin users exist
        var adminExists = await users.Users.AnyAsync();
        
        if (adminExists)
        {
            Console.WriteLine("⚠️  Admin users already exist. Skipping seed.");
            return;
        }

        // Create SuperAdmin user
        var admin = new AdminUser
        {
            Email = email.Trim(),
            UserName = email.Trim(),
            Role = AdminRole.SuperAdmin,
            CreatedAt = DateTime.UtcNow
        };

        var result = await users.CreateAsync(admin, password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }

        Console.WriteLine("✅ SuperAdmin user created successfully!");
        Console.WriteLine($"   Email: {email}");
        Console.WriteLine("\n⚠️  IMPORTANT: Change this password after first login!\n");
    }
}
