using System.ComponentModel.DataAnnotations;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.DTOs
{
    public class UpdateAdminUserRequest
    {
        [EmailAddress]
        public string? Email { get; set; }

        [MinLength(8)]
        public string? Password { get; set; }

        public AdminRole? Role { get; set; }
    }
}
