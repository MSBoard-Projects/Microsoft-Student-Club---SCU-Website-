namespace MSC.WebAPI.Models
{
    public class MemberType
    {
        public int Id { get; set; }
        public required string TypeName { get; set; } // e.g., "High Board", "Board", "Golden Member"

        // Navigation properties
        public ICollection<Member> Members { get; set; } = new List<Member>();
    }
}
