namespace MSC.WebAPI.Models
{
    public class SiteContent
    {
        public int Id { get; set; }
        public required string ContentKey { get; set; } // e.g., "ClubVision", "ClubMission"
        public required string ContentValue { get; set; }
    }
}
