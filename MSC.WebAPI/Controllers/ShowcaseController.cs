using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Controllers;

[ApiController]
[Route("api/showcase")]
public sealed class ShowcaseController(ApplicationDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var events = await database.Events.AsNoTracking().OrderByDescending(item => item.EventDate).ToListAsync(cancellationToken);
        var members = await database.Members.AsNoTracking().Include(member => member.MemberType).OrderBy(member => member.DisplayOrder).ToListAsync(cancellationToken);
        var achievements = await database.StudentAchievements.AsNoTracking().OrderByDescending(item => item.Id).ToListAsync(cancellationToken);
        var statistics = await database.CommunityStatistics.AsNoTracking().SingleOrDefaultAsync(item => item.Id == 1, cancellationToken) ?? new CommunityStatistics();
        return Ok(new {
            events = events.Select(item => new { id = item.Slug ?? item.Id.ToString(), title = item.Title, description = item.Description,
                summary = item.Summary ?? item.Description, category = item.Category ?? "Club event", imageUrl = item.ImageUrl, gallery = item.Gallery,
                startsAt = item.StartsAt ?? (item.EventDate == default ? null : item.EventDate.ToString("yyyy-MM-dd")), endsAt = item.EndsAt,
                location = item.Location, status = item.IsUpcoming ? "upcoming" : "past" }),
            members = members.Select(member => new { id = member.PublicId ?? member.Id.ToString(), fullName = member.FullName,
                positionTitle = member.PositionTitle, bio = member.Bio, imageUrl = member.ImageUrl, certificateUrl = member.CertificateUrl,
                group = member.MemberType.TypeName switch { "High Board" => "high-board", "Board" => "board", "Instructor" => "instructor", _ => "member" } }),
            achievements = achievements.Select(item => new { id = item.Id.ToString(), title = item.Title, studentNames = item.StudentNames,
                achievedAt = item.AchievedAt, summary = item.Summary, imageUrl = item.ImageUrl, evidenceUrl = item.EvidenceUrl }),
            statistics
        });
    }

    [HttpGet("member-types")]
    public async Task<IActionResult> GetMemberTypes(CancellationToken cancellationToken) =>
        Ok(await database.MemberTypes.AsNoTracking().Select(item => new { item.Id, item.TypeName }).ToListAsync(cancellationToken));

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken) =>
        Ok(await database.CommunityStatistics.AsNoTracking().SingleOrDefaultAsync(item => item.Id == 1, cancellationToken) ?? new CommunityStatistics());

    [HttpPut("statistics")]
    [Authorize(Roles = "SuperAdmin,ContentEditor")]
    public async Task<IActionResult> SaveStatistics(CommunityStatistics input, CancellationToken cancellationToken)
    {
        if (input.Id != 1) return BadRequest(new { message = "Statistics use the singleton ID 1" });
        var record = await database.CommunityStatistics.FindAsync([1], cancellationToken);
        if (record == null) database.CommunityStatistics.Add(input);
        else database.Entry(record).CurrentValues.SetValues(input);
        await database.SaveChangesAsync(cancellationToken);
        return Ok(input);
    }

    [HttpPost("import")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Import(ShowcaseImport input, CancellationToken cancellationToken)
    {
        if (input.Events.Any(item => item.Id != 0 || string.IsNullOrEmpty(item.Slug)) || input.Members.Any(item => item.Id != 0 || string.IsNullOrEmpty(item.PublicId)) || input.Statistics.Id != 1)
            return BadRequest(new { message = "Import requires stable links and new-record IDs" });
        if (input.Events.Select(item => item.Slug).Distinct().Count() != input.Events.Count || input.Members.Select(item => item.PublicId).Distinct().Count() != input.Members.Count)
            return BadRequest(new { message = "Import contains duplicate identifiers" });
        var types = await database.MemberTypes.Select(item => item.Id).ToListAsync(cancellationToken);
        if (input.Members.Any(member => !types.Contains(member.MemberTypeId))) return BadRequest(new { message = "Invalid member type" });
        var existingEvents = await database.Events.Select(item => item.Slug).ToListAsync(cancellationToken);
        var existingMembers = await database.Members.Select(item => item.PublicId).ToListAsync(cancellationToken);
        var addedEvents = input.Events.Where(item => !existingEvents.Contains(item.Slug)).ToList();
        var addedMembers = input.Members.Where(item => !existingMembers.Contains(item.PublicId)).Select(item => item.ToEntity()).ToList();
        database.Events.AddRange(addedEvents);
        database.Members.AddRange(addedMembers);
        if (!await database.CommunityStatistics.AnyAsync(item => item.Id == 1, cancellationToken)) database.CommunityStatistics.Add(input.Statistics);
        await database.SaveChangesAsync(cancellationToken);
        return Ok(new { eventsAdded = addedEvents.Count, membersAdded = addedMembers.Count });
    }
}

public sealed class ShowcaseImport
{
    [Required, MaxLength(500)] public List<Event> Events { get; set; } = [];
    [Required, MaxLength(2000)] public List<MemberWriteRequest> Members { get; set; } = [];
    [Required] public CommunityStatistics Statistics { get; set; } = new();
}