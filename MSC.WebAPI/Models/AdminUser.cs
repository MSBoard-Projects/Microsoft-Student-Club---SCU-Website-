using Microsoft.AspNetCore.Identity;

namespace MSC.WebAPI.Models
{
    public class AdminUser : IdentityUser<int>
    {
        public AdminRole Role { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLogin { get; set; }
    }
}
