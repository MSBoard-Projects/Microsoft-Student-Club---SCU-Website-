using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Services;

namespace MSC.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly IConfiguration _configuration;

        public AuthController(
            ApplicationDbContext context,
            IAuthService authService,
            ILogger<AuthController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _authService = authService;
            _logger = logger;
            _configuration = configuration;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState });
                }

                // Find user by email
                var user = await _context.AdminUsers
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    _logger.LogWarning("Login attempt failed: User not found - {Email}", request.Email);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify password
                if (!_authService.VerifyPassword(request.Password, user.PasswordHash))
                {
                    _logger.LogWarning("Login attempt failed: Invalid password - {Email}", request.Email);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Update last login time
                user.LastLogin = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Generate JWT token
                var token = _authService.GenerateJwtToken(user);
                var expiresInHours = int.Parse(_configuration["Jwt:ExpiresInHours"] ?? "1");

                _logger.LogInformation("User logged in successfully: {Email}", user.Email);

                return Ok(new LoginResponse
                {
                    Token = token,
                    Email = user.Email,
                    Role = user.Role.ToString(),
                    ExpiresAt = DateTime.UtcNow.AddHours(expiresInHours)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }
    }
}
