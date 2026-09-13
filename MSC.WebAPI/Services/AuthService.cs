using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Services
{
    public interface IAuthService
    {
        string GenerateJwtToken(AdminUser user);
    }

    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateJwtToken(AdminUser user)
        {
            var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
            var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
            var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? throw new InvalidOperationException("Admin email is missing")),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("security_stamp", user.SecurityStamp ?? throw new InvalidOperationException("Admin security stamp is missing")),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}
