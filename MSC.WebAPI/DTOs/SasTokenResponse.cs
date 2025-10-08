namespace MSC.WebAPI.DTOs
{
    public class SasTokenResponse
    {
        public required string SasUrl { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
