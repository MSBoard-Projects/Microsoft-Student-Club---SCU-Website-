namespace MSC.WebAPI.DTOs
{
    public class LoginResponse
    {
        public required string Token { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
