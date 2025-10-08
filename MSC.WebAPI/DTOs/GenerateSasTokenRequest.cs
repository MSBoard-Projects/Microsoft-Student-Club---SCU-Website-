using System.ComponentModel.DataAnnotations;

namespace MSC.WebAPI.DTOs
{
    public class GenerateSasTokenRequest
    {
        [Required]
        public required string ContainerName { get; set; }

        [Required]
        public required string FileName { get; set; }
    }
}
