using MSC.WebAPI.Data;
using MSC.WebAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MSC.WebAPI.Utilities;

public static class AdminSeeder
{
    public static async Task SeedSuperAdmin(ApplicationDbContext context, string email = "admin@msc-scu.com", string password = "Admin123!")
    {
        // Check if any admin users exist
        var adminExists = await context.AdminUsers.AnyAsync();
        
        if (adminExists)
        {
            Console.WriteLine("⚠️  Admin users already exist. Skipping seed.");
            return;
        }

        // Create SuperAdmin user
        var admin = new AdminUser
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = AdminRole.SuperAdmin,
            CreatedAt = DateTime.UtcNow
        };

        context.AdminUsers.Add(admin);
        await context.SaveChangesAsync();

        Console.WriteLine("✅ SuperAdmin user created successfully!");
        Console.WriteLine($"   Email: {email}");
        Console.WriteLine($"   Password: {password}");
        Console.WriteLine("\n⚠️  IMPORTANT: Change this password after first login!\n");
    }
}
