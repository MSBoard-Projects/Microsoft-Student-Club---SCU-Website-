using System.ComponentModel.DataAnnotations;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.DTOs
{
    public class CreateAdminUserRequest
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [MinLength(8)]
        public required string Password { get; set; }

        [Required]
        public AdminRole Role { get; set; }
    }
}
