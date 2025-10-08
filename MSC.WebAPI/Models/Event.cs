namespace MSC.WebAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public DateTime EventDate { get; set; }
        public bool IsUpcoming { get; set; }
        public bool IsFeatured { get; set; } // To mark "most popular" events
        public required string ImageUrl { get; set; }
    }
}
