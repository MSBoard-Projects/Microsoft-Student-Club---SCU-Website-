using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Models;
using MSC.WebAPI.Services;

namespace MSC.WebAPI.Controllers
{
    [Authorize(Roles = "SuperAdmin")]
    [Route("api/admin/users")]
    [ApiController]
    public class AdminUsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AdminUser> _users;
        private readonly ILogger<AdminUsersController> _logger;

        public AdminUsersController(
            ApplicationDbContext context,
            UserManager<AdminUser> users,
            ILogger<AdminUsersController> logger)
        {
            _context = context;
            _users = users;
            _logger = logger;
        }

        /// <summary>
        /// Get all admin users (SuperAdmin only)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminUserResponse>>> GetAdminUsers()
        {
            try
            {
                var users = await _context.AdminUsers
                    .AsNoTracking()
                    .OrderBy(u => u.CreatedAt)
                    .Select(u => new AdminUserResponse
                    {
                        Id = u.Id,
                        Email = u.Email!,
                        Role = u.Role.ToString(),
                        CreatedAt = u.CreatedAt,
                        LastLogin = u.LastLogin
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} admin users", users.Count);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin users");
                return StatusCode(500, new { message = "Error retrieving admin users" });
            }
        }

        /// <summary>
        /// Get specific admin user by ID (SuperAdmin only)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<AdminUserResponse>> GetAdminUser(int id)
        {
            try
            {
                var user = await _context.AdminUsers
                    .AsNoTracking()
                    .Where(u => u.Id == id)
                    .Select(u => new AdminUserResponse
                    {
                        Id = u.Id,
                        Email = u.Email!,
                        Role = u.Role.ToString(),
                        CreatedAt = u.CreatedAt,
                        LastLogin = u.LastLogin
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("Admin user with ID {UserId} not found", id);
                    return NotFound(new { message = $"Admin user with ID {id} not found" });
                }

                _logger.LogInformation("Retrieved admin user {UserId}", id);
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin user {UserId}", id);
                return StatusCode(500, new { message = "Error retrieving admin user" });
            }
        }

        /// <summary>
        /// Create new admin user (SuperAdmin only)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<AdminUserResponse>> CreateAdminUser(CreateAdminUserRequest request)
        {
            try
            {
                // Check if email already exists
                var existingUser = await _users.FindByEmailAsync(request.Email.Trim());

                if (existingUser != null)
                {
                    _logger.LogWarning("Attempted to create admin user with existing email: {Email}", request.Email);
                    return BadRequest(new { message = "Email already exists" });
                }

                // Create new admin user
                var adminUser = new AdminUser
                {
                    Email = request.Email.Trim(),
                    UserName = request.Email.Trim(),
                    Role = request.Role,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await _users.CreateAsync(adminUser, request.Password);
                if (!result.Succeeded)
                {
                    return BadRequest(new { errors = result.Errors.Select(error => error.Description) });
                }

                _logger.LogInformation("Created new admin user {UserId} with email {Email} and role {Role}", 
                    adminUser.Id, adminUser.Email, adminUser.Role);

                var response = new AdminUserResponse
                {
                    Id = adminUser.Id,
                    Email = adminUser.Email,
                    Role = adminUser.Role.ToString(),
                    CreatedAt = adminUser.CreatedAt,
                    LastLogin = adminUser.LastLogin
                };

                return CreatedAtAction(nameof(GetAdminUser), new { id = adminUser.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin user");
                return StatusCode(500, new { message = "Error creating admin user" });
            }
        }

        /// <summary>
        /// Update existing admin user (SuperAdmin only)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAdminUser(int id, UpdateAdminUserRequest request)
        {
            try
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
                var adminUser = await _context.AdminUsers.FindAsync(id);

                if (adminUser == null)
                {
                    _logger.LogWarning("Admin user with ID {UserId} not found for update", id);
                    return NotFound(new { message = $"Admin user with ID {id} not found" });
                }

                // Update email if provided
                if (!string.IsNullOrEmpty(request.Email))
                {
                    // Check if new email already exists
                    var existingUser = await _users.FindByEmailAsync(request.Email.Trim());

                    if (existingUser != null && existingUser.Id != id)
                    {
                        _logger.LogWarning("Attempted to update admin user {UserId} with existing email: {Email}", id, request.Email);
                        return BadRequest(new { message = "Email already exists" });
                    }

                    adminUser.Email = request.Email.Trim();
                    adminUser.UserName = adminUser.Email;
                }

                // Update password if provided
                if (!string.IsNullOrEmpty(request.Password))
                {
                    foreach (var validator in _users.PasswordValidators)
                    {
                        var validation = await validator.ValidateAsync(_users, adminUser, request.Password);
                        if (!validation.Succeeded)
                        {
                            return BadRequest(new { errors = validation.Errors.Select(error => error.Description) });
                        }
                    }
                    adminUser.PasswordHash = _users.PasswordHasher.HashPassword(adminUser, request.Password);
                }

                // Update role if provided
                if (request.Role.HasValue)
                {
                    if (adminUser.Role == AdminRole.SuperAdmin && request.Role != AdminRole.SuperAdmin &&
                        await _context.AdminUsers.CountAsync(user => user.Role == AdminRole.SuperAdmin) <= 1)
                    {
                        return BadRequest(new { message = "Cannot demote the last SuperAdmin user" });
                    }
                    adminUser.Role = request.Role.Value;
                }

                adminUser.SecurityStamp = Guid.NewGuid().ToString();
                var result = await _users.UpdateAsync(adminUser);
                if (!result.Succeeded)
                {
                    return BadRequest(new { errors = result.Errors.Select(error => error.Description) });
                }
                await transaction.CommitAsync();

                _logger.LogInformation("Updated admin user {UserId}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating admin user {UserId}", id);
                return StatusCode(500, new { message = "Error updating admin user" });
            }
        }

        /// <summary>
        /// Delete admin user (SuperAdmin only)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdminUser(int id)
        {
            try
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
                var adminUser = await _context.AdminUsers.FindAsync(id);

                if (adminUser == null)
                {
                    _logger.LogWarning("Admin user with ID {UserId} not found for deletion", id);
                    return NotFound(new { message = $"Admin user with ID {id} not found" });
                }

                // Prevent deleting the last SuperAdmin
                if (adminUser.Role == AdminRole.SuperAdmin)
                {
                    var superAdminCount = await _context.AdminUsers
                        .CountAsync(u => u.Role == AdminRole.SuperAdmin);

                    if (superAdminCount <= 1)
                    {
                        _logger.LogWarning("Attempted to delete the last SuperAdmin user {UserId}", id);
                        return BadRequest(new { message = "Cannot delete the last SuperAdmin user" });
                    }
                }

                var result = await _users.DeleteAsync(adminUser);
                if (!result.Succeeded)
                {
                    return BadRequest(new { errors = result.Errors.Select(error => error.Description) });
                }
                await transaction.CommitAsync();

                _logger.LogInformation("Deleted admin user {UserId} with email {Email}", id, adminUser.Email);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting admin user {UserId}", id);
                return StatusCode(500, new { message = "Error deleting admin user" });
            }
        }
    }
}
