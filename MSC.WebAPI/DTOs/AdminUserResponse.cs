using MSC.WebAPI.Models;

namespace MSC.WebAPI.DTOs
{
    public class AdminUserResponse
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
    }
}
