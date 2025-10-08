using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Controllers
{
    [Route("api/sitecontent")]
    [ApiController]
    public class SiteContentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SiteContentController> _logger;

        public SiteContentController(ApplicationDbContext context, ILogger<SiteContentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all site content (public endpoint)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SiteContent>>> GetAllContent()
        {
            try
            {
                var content = await _context.SiteContents
                    .AsNoTracking()
                    .OrderBy(c => c.ContentKey)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} site content items", content.Count);
                return Ok(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving site content");
                return StatusCode(500, new { message = "Error retrieving site content" });
            }
        }

        /// <summary>
        /// Get site content by key (public endpoint)
        /// </summary>
        [HttpGet("{key}")]
        public async Task<ActionResult<SiteContent>> GetContentByKey(string key)
        {
            try
            {
                var content = await _context.SiteContents
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.ContentKey == key);

                if (content == null)
                {
                    _logger.LogWarning("Site content with key {Key} not found", key);
                    return NotFound(new { message = $"Content with key '{key}' not found" });
                }

                _logger.LogInformation("Retrieved site content for key {Key}", key);
                return Ok(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving site content for key {Key}", key);
                return StatusCode(500, new { message = "Error retrieving site content" });
            }
        }

        /// <summary>
        /// Create new site content (SuperAdmin/ContentEditor only)
        /// </summary>
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        [HttpPost]
        public async Task<ActionResult<SiteContent>> CreateContent(CreateSiteContentRequest request)
        {
            try
            {
                // Check if key already exists
                var existingContent = await _context.SiteContents
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.ContentKey == request.ContentKey);

                if (existingContent != null)
                {
                    _logger.LogWarning("Attempted to create site content with existing key: {Key}", request.ContentKey);
                    return BadRequest(new { message = $"Content with key '{request.ContentKey}' already exists" });
                }

                var content = new SiteContent
                {
                    ContentKey = request.ContentKey,
                    ContentValue = request.ContentValue
                };

                _context.SiteContents.Add(content);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created site content with key {Key}", content.ContentKey);
                return CreatedAtAction(nameof(GetContentByKey), new { key = content.ContentKey }, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating site content");
                return StatusCode(500, new { message = "Error creating site content" });
            }
        }

        /// <summary>
        /// Update existing site content (SuperAdmin/ContentEditor only)
        /// </summary>
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        [HttpPut("{key}")]
        public async Task<IActionResult> UpdateContent(string key, UpdateSiteContentRequest request)
        {
            try
            {
                var content = await _context.SiteContents
                    .FirstOrDefaultAsync(c => c.ContentKey == key);

                if (content == null)
                {
                    _logger.LogWarning("Site content with key {Key} not found for update", key);
                    return NotFound(new { message = $"Content with key '{key}' not found" });
                }

                content.ContentValue = request.ContentValue;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated site content for key {Key}", key);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating site content for key {Key}", key);
                return StatusCode(500, new { message = "Error updating site content" });
            }
        }

        /// <summary>
        /// Delete site content (SuperAdmin/ContentEditor only)
        /// </summary>
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        [HttpDelete("{key}")]
        public async Task<IActionResult> DeleteContent(string key)
        {
            try
            {
                var content = await _context.SiteContents
                    .FirstOrDefaultAsync(c => c.ContentKey == key);

                if (content == null)
                {
                    _logger.LogWarning("Site content with key {Key} not found for deletion", key);
                    return NotFound(new { message = $"Content with key '{key}' not found" });
                }

                _context.SiteContents.Remove(content);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted site content with key {Key}", key);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting site content for key {Key}", key);
                return StatusCode(500, new { message = "Error deleting site content" });
            }
        }
    }
}
