using System.ComponentModel.DataAnnotations;

namespace MSC.WebAPI.Models;

public sealed class CommunityStatistics
{
    public int Id { get; set; } = 1;
    [Range(0, int.MaxValue)] public int? RegisteredAttendees { get; set; }
    [Range(0, int.MaxValue)] public int? EventLocations { get; set; }
    [Range(0, int.MaxValue)] public int? Beneficiaries { get; set; }
    [Range(0, int.MaxValue)] public int? EventsConducted { get; set; }
}