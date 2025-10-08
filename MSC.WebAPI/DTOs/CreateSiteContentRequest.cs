using System.ComponentModel.DataAnnotations;

namespace MSC.WebAPI.DTOs
{
    public class CreateSiteContentRequest
    {
        [Required]
        public required string ContentKey { get; set; }

        [Required]
        public required string ContentValue { get; set; }
    }
}
