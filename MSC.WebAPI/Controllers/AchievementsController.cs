using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Controllers;

[ApiController]
[Route("api/achievements")]
public sealed class AchievementsController(ApplicationDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) => Ok(await database.StudentAchievements.AsNoTracking().OrderByDescending(item => item.Id).ToListAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id, CancellationToken cancellationToken)
    {
        var item = await database.StudentAchievements.AsNoTracking().SingleOrDefaultAsync(record => record.Id == id, cancellationToken);
        return item == null ? NotFound(new { message = "Achievement not found" }) : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> Create(StudentAchievement input, CancellationToken cancellationToken)
    {
        if (input.Id != 0) return BadRequest(new { message = "New achievements must not specify an ID" });
        database.StudentAchievements.Add(input);
        await database.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetOne), new { id = input.Id }, input);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> Update(int id, StudentAchievement input, CancellationToken cancellationToken)
    {
        if (input.Id != 0 && input.Id != id) return BadRequest(new { message = "ID mismatch" });
        var item = await database.StudentAchievements.FindAsync([id], cancellationToken);
        if (item == null) return NotFound(new { message = "Achievement not found" });
        input.Id = id;
        database.Entry(item).CurrentValues.SetValues(input);
        await database.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await database.StudentAchievements.FindAsync([id], cancellationToken);
        if (item == null) return NotFound(new { message = "Achievement not found" });
        database.StudentAchievements.Remove(item);
        await database.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}