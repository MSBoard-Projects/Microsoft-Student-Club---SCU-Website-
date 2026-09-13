namespace MSC.WebAPI.Models
{
    public class Member
    {
        public int Id { get; set; }
        public required string FullName { get; set; }
        public required string PositionTitle { get; set; }
        public string? Bio { get; set; }
        public string? GithubUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? PublicEmail { get; set; }
        public string? PublicPhone { get; set; }
        public string? ImageUrl { get; set; }
        public string? PublicId { get; set; }
        public string? CertificateUrl { get; set; } // Nullable for members without certificates
        public int MemberTypeId { get; set; }
        public int DisplayOrder { get; set; }

        // Navigation properties
        public MemberType MemberType { get; set; } = null!;
    }
}
