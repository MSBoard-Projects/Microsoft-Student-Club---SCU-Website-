using System.ComponentModel.DataAnnotations;
using MSC.WebAPI.Models;
using MSC.WebAPI.Utilities;

namespace MSC.WebAPI.DTOs;

public sealed class MemberWriteRequest : IValidatableObject
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string FullName { get; set; } = "";
    [Required, MaxLength(100)] public string PositionTitle { get; set; } = "";
    [MaxLength(3000)] public string? Bio { get; set; }
    [MaxLength(500)] public string? GithubUrl { get; set; }
    [MaxLength(500)] public string? LinkedInUrl { get; set; }
    [MaxLength(500)] public string? FacebookUrl { get; set; }
    [MaxLength(500)] public string? InstagramUrl { get; set; }
    [MaxLength(500)] public string? WebsiteUrl { get; set; }
    [MaxLength(254), EmailAddress, RegularExpression(@"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")] public string? PublicEmail { get; set; }
    [MaxLength(16), RegularExpression(@"^\+[1-9]\d{6,14}$")] public string? PublicPhone { get; set; }
    [MaxLength(500), PublicUrl] public string? ImageUrl { get; set; }
    [MaxLength(500), PublicUrl] public string? CertificateUrl { get; set; }
    [MaxLength(120), RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")] public string? PublicId { get; set; }
    [Range(1, int.MaxValue)] public int MemberTypeId { get; set; }
    [Range(0, int.MaxValue)] public int DisplayOrder { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        foreach (var (name, value) in new[] { (nameof(GithubUrl), GithubUrl), (nameof(LinkedInUrl), LinkedInUrl),
            (nameof(FacebookUrl), FacebookUrl), (nameof(InstagramUrl), InstagramUrl), (nameof(WebsiteUrl), WebsiteUrl) })
        {
            if (!string.IsNullOrEmpty(value) && (!Uri.TryCreate(value, UriKind.Absolute, out var url)
                || url.Scheme != Uri.UriSchemeHttps || !string.IsNullOrEmpty(url.UserInfo)))
                yield return new ValidationResult("Public profile links must be HTTPS URLs without embedded credentials.", [name]);
        }
    }

    public Member ToEntity(int id = 0) => new() { Id = id, FullName = FullName, PositionTitle = PositionTitle,
        GithubUrl = GithubUrl, LinkedInUrl = LinkedInUrl, FacebookUrl = FacebookUrl, InstagramUrl = InstagramUrl,
        WebsiteUrl = WebsiteUrl, PublicEmail = PublicEmail, PublicPhone = PublicPhone,
        Bio = Bio, ImageUrl = ImageUrl, CertificateUrl = CertificateUrl, PublicId = PublicId, MemberTypeId = MemberTypeId, DisplayOrder = DisplayOrder };
}