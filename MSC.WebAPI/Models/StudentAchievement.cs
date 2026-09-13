using System.ComponentModel.DataAnnotations;
using MSC.WebAPI.Utilities;

namespace MSC.WebAPI.Models;

public sealed class StudentAchievement : IValidatableObject
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = "";
    [Required, MinLength(1), MaxLength(50)] public List<string> StudentNames { get; set; } = [];
    [Required, MaxLength(5000)] public string Summary { get; set; } = "";
    [MaxLength(40), EventSchedule] public string? AchievedAt { get; set; }
    [MaxLength(500), PublicUrl] public string? ImageUrl { get; set; }
    [MaxLength(500), Url] public string? EvidenceUrl { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StudentNames?.Any(name => string.IsNullOrWhiteSpace(name) || name.Length > 200) == true)
            yield return new ValidationResult("Student names must be nonempty and at most 200 characters.", [nameof(StudentNames)]);
        if (!string.IsNullOrEmpty(EvidenceUrl) && !EvidenceUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            yield return new ValidationResult("Evidence URL must use HTTPS.", [nameof(EvidenceUrl)]);
    }
}