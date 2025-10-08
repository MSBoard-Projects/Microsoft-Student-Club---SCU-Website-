using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EventsController> _logger;

        public EventsController(ApplicationDbContext context, ILogger<EventsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/events
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents()
        {
            try
            {
                var events = await _context.Events
                    .OrderByDescending(e => e.EventDate)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all events");
                return StatusCode(500, new { message = "An error occurred while retrieving events" });
            }
        }

        // GET: api/events/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            try
            {
                var eventItem = await _context.Events
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (eventItem == null)
                {
                    return NotFound(new { message = "Event not found" });
                }

                return Ok(eventItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event with ID {EventId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the event" });
            }
        }

        // GET: api/events/upcoming
        [HttpGet("upcoming")]
        public async Task<ActionResult<IEnumerable<Event>>> GetUpcomingEvents()
        {
            try
            {
                var upcomingEvents = await _context.Events
                    .Where(e => e.IsUpcoming)
                    .OrderBy(e => e.EventDate)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(upcomingEvents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming events");
                return StatusCode(500, new { message = "An error occurred while retrieving upcoming events" });
            }
        }

        // GET: api/events/featured
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<Event>>> GetFeaturedEvents()
        {
            try
            {
                var featuredEvents = await _context.Events
                    .Where(e => e.IsFeatured)
                    .OrderByDescending(e => e.EventDate)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(featuredEvents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving featured events");
                return StatusCode(500, new { message = "An error occurred while retrieving featured events" });
            }
        }

        // POST: api/events
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        public async Task<ActionResult<Event>> CreateEvent(Event eventItem)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState });
                }

                _context.Events.Add(eventItem);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Event created: {EventId} - {EventTitle}", eventItem.Id, eventItem.Title);

                return CreatedAtAction(nameof(GetEvent), new { id = eventItem.Id }, eventItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating event");
                return StatusCode(500, new { message = "An error occurred while creating the event" });
            }
        }

        // PUT: api/events/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        public async Task<IActionResult> UpdateEvent(int id, Event eventItem)
        {
            if (id != eventItem.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState });
            }

            try
            {
                _context.Entry(eventItem).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Event updated: {EventId} - {EventTitle}", eventItem.Id, eventItem.Title);
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!await EventExists(id))
                    {
                        return NotFound(new { message = "Event not found" });
                    }
                    throw;
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating event with ID {EventId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the event" });
            }
        }

        // DELETE: api/events/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin,ContentEditor")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            try
            {
                var eventItem = await _context.Events.FindAsync(id);
                if (eventItem == null)
                {
                    return NotFound(new { message = "Event not found" });
                }

                _context.Events.Remove(eventItem);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Event deleted: {EventId} - {EventTitle}", eventItem.Id, eventItem.Title);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting event with ID {EventId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the event" });
            }
        }

        private async Task<bool> EventExists(int id)
        {
            return await _context.Events.AnyAsync(e => e.Id == id);
        }
    }
}
