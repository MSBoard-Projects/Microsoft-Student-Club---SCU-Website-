namespace MSC.WebAPI.Models
{
    public class Member
    {
        public int Id { get; set; }
        public required string FullName { get; set; }
        public required string PositionTitle { get; set; }
        public required string ImageUrl { get; set; }
        public string? CertificateUrl { get; set; } // Nullable for members without certificates
        public int MemberTypeId { get; set; }
        public int DisplayOrder { get; set; }

        // Navigation properties
        public MemberType MemberType { get; set; } = null!;
    }
}
