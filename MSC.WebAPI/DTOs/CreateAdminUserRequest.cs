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
        [MinLength(12)]
        public required string Password { get; set; }

        [Required]
        [EnumDataType(typeof(AdminRole))]
        public AdminRole Role { get; set; }
    }
}
