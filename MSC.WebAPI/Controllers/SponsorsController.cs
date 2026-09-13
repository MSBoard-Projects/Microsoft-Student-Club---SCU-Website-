using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;
using MSC.WebAPI.Utilities;

namespace MSC.WebAPI.Controllers;

[ApiController]
[Route("api/sponsors")]
public sealed class SponsorsController(ApplicationDbContext database) : ControllerBase
{
    private async Task<IActionResult> Read(bool publishedOnly, CancellationToken cancellationToken) => Ok(await database.Sponsors.AsNoTracking()
        .Where(sponsor => !publishedOnly || sponsor.IsPublished).OrderBy(sponsor => sponsor.DisplayOrder).ThenBy(sponsor => sponsor.Name)
        .Select(sponsor => new { sponsor.Id, sponsor.Name, sponsor.Tier, sponsor.LogoUrl, sponsor.WebsiteUrl, sponsor.Description,
            sponsor.EventId, eventKey = sponsor.Event == null ? null : sponsor.Event.Slug ?? sponsor.Event.Id.ToString(),
            eventTitle = sponsor.Event == null ? null : sponsor.Event.Title, sponsor.DisplayOrder, sponsor.IsPublished }).ToListAsync(cancellationToken));

    [HttpGet]
    public Task<IActionResult> Get(CancellationToken cancellationToken) => Read(true, cancellationToken);

    [HttpGet("manage"), Authorize(Roles = "SuperAdmin,ContentEditor")]
    public Task<IActionResult> Manage(CancellationToken cancellationToken) => Read(false, cancellationToken);

    [HttpPost, Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> Create(SponsorWriteRequest input, CancellationToken cancellationToken)
    {
        if (input.EventId.HasValue && !await database.Events.AnyAsync(item => item.Id == input.EventId, cancellationToken)) return BadRequest(new { message = "Unknown event." });
        var sponsor = input.ToEntity();
        database.Sponsors.Add(sponsor);
        await database.SaveChangesAsync(cancellationToken);
        return Created($"/api/sponsors/{sponsor.Id}", new { sponsor.Id });
    }

    [HttpPut("{id:int}"), Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> Update(int id, SponsorWriteRequest input, CancellationToken cancellationToken)
    {
        var sponsor = await database.Sponsors.FindAsync([id], cancellationToken);
        if (sponsor == null) return NotFound(new { message = "Sponsor not found." });
        if (input.EventId.HasValue && !await database.Events.AnyAsync(item => item.Id == input.EventId, cancellationToken)) return BadRequest(new { message = "Unknown event." });
        database.Entry(sponsor).CurrentValues.SetValues(input.ToEntity(id));
        await database.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}"), Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var sponsor = await database.Sponsors.FindAsync([id], cancellationToken);
        if (sponsor == null) return NotFound(new { message = "Sponsor not found." });
        database.Sponsors.Remove(sponsor);
        await database.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed class SponsorWriteRequest : IValidatableObject
{
    [Required, MaxLength(160)] public string Name { get; set; } = "";
    [Required, RegularExpression("^(diamond|gold|silver|bronze|community)$")] public string Tier { get; set; } = "community";
    [MaxLength(500), PublicUrl] public string? LogoUrl { get; set; }
    [MaxLength(500), PublicUrl] public string? WebsiteUrl { get; set; }
    [MaxLength(1000)] public string? Description { get; set; }
    [Range(1, int.MaxValue)] public int? EventId { get; set; }
    [Range(0, int.MaxValue)] public int DisplayOrder { get; set; }
    public bool IsPublished { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IsPublished && string.IsNullOrWhiteSpace(LogoUrl)) yield return new ValidationResult("A logo is required before publishing a sponsor.", [nameof(LogoUrl)]);
    }

    public Sponsor ToEntity(int id = 0) => new() { Id = id, Name = Name.Trim(), Tier = Tier, LogoUrl = LogoUrl, WebsiteUrl = WebsiteUrl,
        Description = Description, EventId = EventId, DisplayOrder = DisplayOrder, IsPublished = IsPublished };
}