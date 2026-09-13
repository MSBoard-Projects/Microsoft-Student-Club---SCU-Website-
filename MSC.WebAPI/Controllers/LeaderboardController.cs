using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IO.Compression;
using System.Security.Claims;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Controllers;

[ApiController]
[Route("api/leaderboard")]
[Authorize(Roles = "SuperAdmin,ContentEditor")]
public sealed class LeaderboardController(ApplicationDbContext database) : ControllerBase
{
    private static readonly string[] Columns = ["MemberId", "Name", "Group", "Rate", "OnlineAttendance", "OfflineAttendance", "Tasks", "Projects"];

    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var periods = await database.RatingPeriods.AsNoTracking().Include(period => period.Entries).ThenInclude(entry => entry.Member)
            .OrderByDescending(period => period.EndDate).ThenByDescending(period => period.StartDate).ToListAsync(cancellationToken);
        return Ok(periods.Select(period => new {
            period.Id, period.Title, period.StartDate, period.EndDate, period.PublishedAt, period.Version,
            entries = period.Entries.Select(entry => new { memberId = entry.Member.PublicId ?? entry.Member.Id.ToString(CultureInfo.InvariantCulture),
                entry.Rate, entry.OnlineAttendance, entry.OfflineAttendance, entry.Tasks, entry.Projects })
        }));
    }

    private async Task<Dictionary<string, Member>> EligibleMembers(CancellationToken cancellationToken) =>
        (await database.Members.AsNoTracking().Include(member => member.MemberType).Where(member => member.MemberType.TypeName != "Instructor")
            .OrderBy(member => member.DisplayOrder).ToListAsync(cancellationToken))
        .ToDictionary(member => member.PublicId ?? member.Id.ToString(CultureInfo.InvariantCulture), StringComparer.Ordinal);

    [HttpGet("template")]
    public async Task<IActionResult> Template(CancellationToken cancellationToken)
    {
        var members = await EligibleMembers(cancellationToken);
        using var workbook = new XLWorkbook();
        var sheet = workbook.AddWorksheet("Ratings");
        for (var column = 0; column < Columns.Length; column++) sheet.Cell(1, column + 1).Value = Columns[column];
        var rowNumber = 2;
        foreach (var pair in members)
        {
            sheet.Cell(rowNumber, 1).Value = pair.Key;
            sheet.Cell(rowNumber, 2).Value = pair.Value.FullName;
            sheet.Cell(rowNumber, 3).Value = pair.Value.MemberType.TypeName;
            rowNumber++;
        }
        sheet.Row(1).Style.Font.Bold = true;
        sheet.SheetView.FreezeRows(1);
        sheet.Columns(1, 3).Width = 32;
        sheet.Columns(4, 8).Width = 20;
        sheet.Range(2, 4, Math.Max(2, rowNumber - 1), 8).Style.NumberFormat.Format = "0.00";
        var instructions = workbook.AddWorksheet("Instructions");
        instructions.Cell(1, 1).Value = "Rate is the final score from 0 to 100, with at most two decimal places. No weights are calculated.";
        instructions.Cell(2, 1).Value = "OnlineAttendance, OfflineAttendance, Tasks and Projects are optional scores from 0 to 100.";
        instructions.Cell(3, 1).Value = "Keep MemberId unchanged. Names and groups are references only. Blank scores are not zero.";
        instructions.Cell(4, 1).Value = "Upload from the admin ratings page, choose period dates, review errors, then confirm publication.";
        instructions.Column(1).Width = 115;
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return File(output.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "msc-ratings.xlsx");
    }

    [HttpPost("preview")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<IActionResult> Preview(IFormFile file, [FromForm] DateOnly startDate, [FromForm] DateOnly endDate, CancellationToken cancellationToken)
    {
        if (file.Length == 0 || file.Length > 2 * 1024 * 1024 || !Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Upload an XLSX file no larger than 2 MB." });
        if (!ValidDates(startDate, endDate)) return BadRequest(new { message = "Choose a valid period start and end date." });
        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, cancellationToken);
        try
        {
            buffer.Position = 0;
            using (var archive = new ZipArchive(buffer, ZipArchiveMode.Read, true))
            {
                if (archive.Entries.Count > 1000 || archive.Entries.Sum(entry => entry.Length) > 20 * 1024 * 1024 ||
                    archive.Entries.Any(entry => entry.FullName.Contains("externalLinks/", StringComparison.OrdinalIgnoreCase) || entry.FullName.EndsWith("vbaProject.bin", StringComparison.OrdinalIgnoreCase)))
                    return BadRequest(new { message = "Workbook is too complex or contains unsupported external links or macros." });
            }
            buffer.Position = 0;
            using var workbook = new XLWorkbook(buffer);
            if (!workbook.TryGetWorksheet("Ratings", out var sheet)) return BadRequest(new { message = "The workbook must contain a Ratings worksheet." });
            var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 0;
            if (lastRow > 2001 || (sheet.LastColumnUsed()?.ColumnNumber() ?? 0) > 20) return BadRequest(new { message = "Use at most 2,000 rating rows and the template columns." });
            var headers = sheet.Row(1).CellsUsed().Select(cell => new { Name = cell.GetString().Trim(), Column = cell.Address.ColumnNumber }).ToList();
            if (headers.Select(header => header.Name).Distinct(StringComparer.OrdinalIgnoreCase).Count() != headers.Count ||
                !headers.Any(header => header.Name == "MemberId") || !headers.Any(header => header.Name == "Rate") || headers.Any(header => !Columns.Contains(header.Name)))
                return BadRequest(new { message = "Invalid or duplicate headers. Use the downloaded template." });
            var columns = headers.ToDictionary(header => header.Name, header => header.Column);
            var members = await EligibleMembers(cancellationToken);
            var errors = new List<string>();
            var rows = new List<RatingInput>();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            var ignoredRows = 0;
            for (var rowNumber = 2; rowNumber <= lastRow; rowNumber++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var row = sheet.Row(rowNumber);
                if (row.CellsUsed().Any(cell => cell.HasFormula)) { errors.Add($"Row {rowNumber}: formulas are not accepted. Paste values only."); continue; }
                string Text(string key) => columns.TryGetValue(key, out var column) ? row.Cell(column).GetString().Trim() : "";
                if (Columns.Skip(3).All(key => Text(key).Length == 0)) { ignoredRows++; continue; }
                var memberId = Text("MemberId");
                if (!members.ContainsKey(memberId)) errors.Add($"Row {rowNumber}: unknown or ineligible MemberId.");
                if (!seen.Add(memberId)) errors.Add($"Row {rowNumber}: duplicate MemberId.");
                decimal? Score(string key, bool required = false)
                {
                    var text = Text(key);
                    if (text.Length == 0 && !required) return null;
                    if (decimal.TryParse(text, NumberStyles.AllowDecimalPoint | NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var score) && ValidScore(score)) return score;
                    errors.Add($"Row {rowNumber}: {key} must be a value from 0 to 100 with up to two decimal places.");
                    return null;
                }
                rows.Add(new RatingInput { MemberId = memberId, Rate = Score("Rate", true), OnlineAttendance = Score("OnlineAttendance"), OfflineAttendance = Score("OfflineAttendance"), Tasks = Score("Tasks"), Projects = Score("Projects") });
            }
            if (rows.Count == 0) errors.Add("The workbook has no rated members.");
            var existing = await database.RatingPeriods.AsNoTracking().SingleOrDefaultAsync(period => period.StartDate == startDate && period.EndDate == endDate, cancellationToken);
            return Ok(new { rows, errors, ignoredRows, existingPeriod = existing == null ? null : new { existing.Id, existing.Title, existing.Version } });
        }
        catch (Exception exception) when (exception is InvalidDataException or ArgumentException or FormatException or System.Xml.XmlException or DocumentFormat.OpenXml.Packaging.OpenXmlPackageException or NotSupportedException)
        {
            return BadRequest(new { message = "The workbook could not be read. Use an unencrypted XLSX template with values only." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Publish(RatingImportRequest input, CancellationToken cancellationToken)
    {
        if (!ValidDates(input.StartDate, input.EndDate) || input.Entries.Any(entry => entry == null || entry.Rate == null ||
            new[] { entry.Rate, entry.OnlineAttendance, entry.OfflineAttendance, entry.Tasks, entry.Projects }.Any(score => score.HasValue && !ValidScore(score.Value))))
            return BadRequest(new { message = "Invalid period dates or scores." });
        if (input.Entries.Select(entry => entry.MemberId).Distinct(StringComparer.Ordinal).Count() != input.Entries.Count)
            return BadRequest(new { message = "Duplicate MemberId values are not allowed." });
        var members = await EligibleMembers(cancellationToken);
        if (input.Entries.Any(entry => !members.ContainsKey(entry.MemberId))) return BadRequest(new { message = "Every rating must reference an existing eligible member." });
        var period = await database.RatingPeriods.Include(item => item.Entries).SingleOrDefaultAsync(item => item.StartDate == input.StartDate && item.EndDate == input.EndDate, cancellationToken);
        if (period != null && (input.ReplacePeriodId != period.Id || input.ExpectedVersion != period.Version) || period == null && input.ReplacePeriodId != null)
            return Conflict(new { message = "This period changed or already exists. Preview the workbook again and confirm replacement." });
        if (period == null)
        {
            period = new RatingPeriod { StartDate = input.StartDate, EndDate = input.EndDate };
            database.RatingPeriods.Add(period);
        }
        else
        {
            database.MemberRatings.RemoveRange(period.Entries);
            period.Entries.Clear();
        }
        period.Title = input.Title.Trim();
        period.PublishedAt = DateTimeOffset.UtcNow;
        period.Version = Guid.NewGuid();
        period.UpdatedByAdminId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var adminId) ? adminId : null;
        period.Entries = input.Entries.Select(entry => new MemberRating { MemberId = members[entry.MemberId].Id, Rate = entry.Rate!.Value,
            OnlineAttendance = entry.OnlineAttendance, OfflineAttendance = entry.OfflineAttendance, Tasks = entry.Tasks, Projects = entry.Projects }).ToList();
        try { await database.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException) { return Conflict(new { message = "The period or member roster changed. Preview again before publishing." }); }
        return Ok(new { period.Id, period.Version, entriesPublished = period.Entries.Count });
    }

    private static bool ValidDates(DateOnly start, DateOnly end) => start.Year >= 2000 && start <= end;
    private static bool ValidScore(decimal score) => score is >= 0 and <= 100 && decimal.Round(score, 2) == score;
}

public sealed class RatingInput
{
    [Required, MaxLength(120)] public string MemberId { get; set; } = "";
    [Required, Range(0, 100)] public decimal? Rate { get; set; }
    [Range(0, 100)] public decimal? OnlineAttendance { get; set; }
    [Range(0, 100)] public decimal? OfflineAttendance { get; set; }
    [Range(0, 100)] public decimal? Tasks { get; set; }
    [Range(0, 100)] public decimal? Projects { get; set; }
}

public sealed class RatingImportRequest
{
    [Required, MaxLength(120)] public string Title { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int? ReplacePeriodId { get; set; }
    public Guid? ExpectedVersion { get; set; }
    [Required, MinLength(1), MaxLength(2000)] public List<RatingInput> Entries { get; set; } = [];
}