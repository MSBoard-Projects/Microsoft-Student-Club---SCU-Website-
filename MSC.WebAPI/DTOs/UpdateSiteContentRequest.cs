using System.ComponentModel.DataAnnotations;

namespace MSC.WebAPI.DTOs
{
    public class UpdateSiteContentRequest
    {
        [Required]
        public required string ContentValue { get; set; }
    }
}
