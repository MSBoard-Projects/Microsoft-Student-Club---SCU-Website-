using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Models;
using MSC.WebAPI.Services;

namespace MSC.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AdminUser> _users;
        private readonly SignInManager<AdminUser> _signIn;
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<AdminUser> users,
            SignInManager<AdminUser> signIn,
            IAuthService authService,
            ILogger<AuthController> logger)
        {
            _users = users;
            _signIn = signIn;
            _authService = authService;
            _logger = logger;
        }

        [Authorize]
        [HttpGet("session")]
        public IActionResult Session()
        {
            if (!long.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Exp), out var expiry))
            {
                return Unauthorized(new { message = "Invalid session" });
            }

            return Ok(new
            {
                email = User.FindFirstValue(ClaimTypes.Email),
                role = User.FindFirstValue(ClaimTypes.Role),
                expiresAt = DateTimeOffset.FromUnixTimeSeconds(expiry).UtcDateTime
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var user = await _users.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (user == null) return Unauthorized();
            var result = await _users.UpdateSecurityStampAsync(user);
            return result.Succeeded ? NoContent() : Conflict(new { message = "Account changed. Please retry logout." });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState });
                }

                // Find user by email
                var user = await _users.FindByEmailAsync(request.Email.Trim());

                if (user == null)
                {
                    _logger.LogWarning("Login attempt failed: User not found - {Email}", request.Email);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify password
                var result = await _signIn.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Login attempt failed: Invalid password - {Email}", request.Email);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Update last login time
                user.LastLogin = DateTime.UtcNow;
                var update = await _users.UpdateAsync(user);
                if (!update.Succeeded)
                {
                    return Conflict(new { message = "Account changed. Please sign in again." });
                }

                // Generate JWT token
                var token = _authService.GenerateJwtToken(user);

                _logger.LogInformation("User logged in successfully: {Email}", user.Email);

                return Ok(new LoginResponse
                {
                    Token = token,
                    Email = user.Email!,
                    Role = user.Role.ToString(),
                    ExpiresAt = new JwtSecurityTokenHandler().ReadJwtToken(token).ValidTo
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
