using System.ComponentModel.DataAnnotations;

namespace MSC.WebAPI.Models;

public sealed class RatingPeriod
{
    public int Id { get; set; }
    [MaxLength(120)] public string Title { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateTimeOffset PublishedAt { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public int? UpdatedByAdminId { get; set; }
    public List<MemberRating> Entries { get; set; } = [];
}

public sealed class MemberRating
{
    public int Id { get; set; }
    public int RatingPeriodId { get; set; }
    public int MemberId { get; set; }
    public Member Member { get; set; } = null!;
    public decimal Rate { get; set; }
    public decimal? OnlineAttendance { get; set; }
    public decimal? OfflineAttendance { get; set; }
    public decimal? Tasks { get; set; }
    public decimal? Projects { get; set; }
}