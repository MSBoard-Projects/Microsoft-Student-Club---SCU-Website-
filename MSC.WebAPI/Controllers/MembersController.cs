using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MembersController> _logger;

        public MembersController(ApplicationDbContext context, ILogger<MembersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/members
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Member>>> GetMembers()
        {
            try
            {
                var members = await _context.Members
                    .Include(m => m.MemberType)
                    .OrderBy(m => m.DisplayOrder)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all members");
                return StatusCode(500, new { message = "An error occurred while retrieving members" });
            }
        }

        // GET: api/members/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Member>> GetMember(int id)
        {
            try
            {
                var member = await _context.Members
                    .Include(m => m.MemberType)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (member == null)
                {
                    return NotFound(new { message = "Member not found" });
                }

                return Ok(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving member with ID {MemberId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the member" });
            }
        }

        // GET: api/members/type/High Board
        [HttpGet("type/{typeName}")]
        public async Task<ActionResult<IEnumerable<Member>>> GetMembersByType(string typeName)
        {
            try
            {
                var members = await _context.Members
                    .Include(m => m.MemberType)
                    .Where(m => m.MemberType.TypeName == typeName)
                    .OrderBy(m => m.DisplayOrder)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving members of type {TypeName}", typeName);
                return StatusCode(500, new { message = "An error occurred while retrieving members" });
            }
        }

        // POST: api/members
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        public async Task<ActionResult<Member>> CreateMember(Member member)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState });
                }

                // Verify that the MemberType exists
                var memberTypeExists = await _context.MemberTypes.AnyAsync(mt => mt.Id == member.MemberTypeId);
                if (!memberTypeExists)
                {
                    return BadRequest(new { message = "Invalid MemberTypeId" });
                }

                _context.Members.Add(member);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member created: {MemberId} - {MemberName}", member.Id, member.FullName);

                // Reload to include navigation properties
                await _context.Entry(member).Reference(m => m.MemberType).LoadAsync();

                return CreatedAtAction(nameof(GetMember), new { id = member.Id }, member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating member");
                return StatusCode(500, new { message = "An error occurred while creating the member" });
            }
        }

        // PUT: api/members/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        public async Task<IActionResult> UpdateMember(int id, Member member)
        {
            if (id != member.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState });
            }

            try
            {
                // Verify that the MemberType exists
                var memberTypeExists = await _context.MemberTypes.AnyAsync(mt => mt.Id == member.MemberTypeId);
                if (!memberTypeExists)
                {
                    return BadRequest(new { message = "Invalid MemberTypeId" });
                }

                _context.Entry(member).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Member updated: {MemberId} - {MemberName}", member.Id, member.FullName);
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!await MemberExists(id))
                    {
                        return NotFound(new { message = "Member not found" });
                    }
                    throw;
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating member with ID {MemberId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the member" });
            }
        }

        // DELETE: api/members/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        public async Task<IActionResult> DeleteMember(int id)
        {
            try
            {
                var member = await _context.Members.FindAsync(id);
                if (member == null)
                {
                    return NotFound(new { message = "Member not found" });
                }

                _context.Members.Remove(member);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member deleted: {MemberId} - {MemberName}", member.Id, member.FullName);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting member with ID {MemberId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the member" });
            }
        }

        private async Task<bool> MemberExists(int id)
        {
            return await _context.Members.AnyAsync(e => e.Id == id);
        }
    }
}
