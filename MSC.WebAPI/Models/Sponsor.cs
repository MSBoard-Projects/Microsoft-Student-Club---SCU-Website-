using System.ComponentModel.DataAnnotations;

namespace MSC.WebAPI.Models;

public sealed class Sponsor
{
    public int Id { get; set; }
    [MaxLength(160)] public string Name { get; set; } = "";
    [MaxLength(20)] public string Tier { get; set; } = "community";
    [MaxLength(500)] public string? LogoUrl { get; set; }
    [MaxLength(500)] public string? WebsiteUrl { get; set; }
    [MaxLength(1000)] public string? Description { get; set; }
    public int? EventId { get; set; }
    public Event? Event { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPublished { get; set; }
}