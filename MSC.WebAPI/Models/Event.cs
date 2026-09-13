using System.ComponentModel.DataAnnotations;
using MSC.WebAPI.Utilities;

namespace MSC.WebAPI.Models
{
    public class Event : IValidatableObject
    {
        public int Id { get; set; }
        [Required, MaxLength(200)]
        public required string Title { get; set; }
        [Required, MaxLength(20000)]
        public required string Description { get; set; }
        public DateTime EventDate { get; set; }
        public bool IsUpcoming { get; set; }
        public bool IsFeatured { get; set; } // To mark "most popular" events
        [MaxLength(500), PublicUrl]
        public string? ImageUrl { get; set; }
        [MaxLength(100), RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
        public string? Slug { get; set; }
        [MaxLength(500)]
        public string? Summary { get; set; }
        [MaxLength(100)]
        public string? Category { get; set; }
        [MaxLength(300)]
        public string? Location { get; set; }
        [MaxLength(40), EventSchedule]
        public string? StartsAt { get; set; }
        [MaxLength(40), EventSchedule]
        public string? EndsAt { get; set; }
        [Required, MaxLength(50)]
        public List<string> Gallery { get; set; } = [];

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Gallery?.Any(image => string.IsNullOrWhiteSpace(image) || !PublicUrlAttribute.IsPublicUrl(image)) == true)
                yield return new ValidationResult("Gallery URLs must be HTTPS or local paths.", [nameof(Gallery)]);
            if (!string.IsNullOrEmpty(EndsAt) && string.IsNullOrEmpty(StartsAt))
                yield return new ValidationResult("A start schedule is required with an end schedule.", [nameof(StartsAt)]);
            if (EventScheduleAttribute.TryParse(StartsAt ?? "", out var start) && EventScheduleAttribute.TryParse(EndsAt ?? "", out var end) && end < start)
                yield return new ValidationResult("End must not precede start.", [nameof(EndsAt)]);
        }
    }
}
