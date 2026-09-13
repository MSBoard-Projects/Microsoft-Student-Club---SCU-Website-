using System.ComponentModel.DataAnnotations;
using MSC.WebAPI.Models;
using MSC.WebAPI.Utilities;

namespace MSC.WebAPI.DTOs;

public sealed class MemberWriteRequest
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string FullName { get; set; } = "";
    [Required, MaxLength(100)] public string PositionTitle { get; set; } = "";
    [MaxLength(3000)] public string? Bio { get; set; }
    [MaxLength(500), PublicUrl] public string? ImageUrl { get; set; }
    [MaxLength(500), PublicUrl] public string? CertificateUrl { get; set; }
    [MaxLength(120), RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")] public string? PublicId { get; set; }
    [Range(1, int.MaxValue)] public int MemberTypeId { get; set; }
    [Range(0, int.MaxValue)] public int DisplayOrder { get; set; }

    public Member ToEntity(int id = 0) => new() { Id = id, FullName = FullName, PositionTitle = PositionTitle,
        Bio = Bio, ImageUrl = ImageUrl, CertificateUrl = CertificateUrl, PublicId = PublicId, MemberTypeId = MemberTypeId, DisplayOrder = DisplayOrder };
}