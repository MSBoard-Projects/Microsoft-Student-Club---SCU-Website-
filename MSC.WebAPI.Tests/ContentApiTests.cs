using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Data;
using MSC.WebAPI.DTOs;
using MSC.WebAPI.Models;
using Xunit;

namespace MSC.WebAPI.Tests;

public class ContentApiTests
{
    [Fact]
    public void SqlServerStoresCollectionsWithoutTruncatingSerializedJson()
    {
        using var database = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=unused;Database=unused;Integrated Security=True").Options);
        Assert.Equal("nvarchar(max)", database.Model.FindEntityType(typeof(Event))!.FindProperty(nameof(Event.Gallery))!.GetColumnType());
        Assert.Equal("nvarchar(max)", database.Model.FindEntityType(typeof(StudentAchievement))!.FindProperty(nameof(StudentAchievement.StudentNames))!.GetColumnType());
    }

    private static async Task Authenticate(AuthApiFactory factory, HttpClient client, AdminRole role = AdminRole.ContentEditor)
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AdminUser>>();
        var user = new AdminUser { Email = "content@example.test", UserName = "content@example.test", Role = role };
        Assert.True((await users.CreateAsync(user, "Content-test-123!")).Succeeded);
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email = user.Email, password = "Content-test-123!" });
        response.EnsureSuccessStatusCode();
        var login = (await response.Content.ReadFromJsonAsync<LoginResponse>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
    }

    [Fact]
    public async Task EventAndMemberUpdatesPersistAndAppearInPublicShowcase()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        var eventInput = new Event { Title = "Orientation", Description = "Eleven stations", Slug = "orientation", StartsAt = "2026-10-19T15:00:00+03:00", EndsAt = "2026-10-19T19:00:00+03:00", Gallery = ["/first.jpg", "/second.jpg"], IsUpcoming = true };
        var created = await client.PostAsJsonAsync("/api/events", eventInput);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var eventId = (await created.Content.ReadFromJsonAsync<Event>())!.Id;
        eventInput.Location = "Creativa Innovation Hub Ismailia";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/events/{eventId}", eventInput)).StatusCode);
        var member = new MemberWriteRequest { FullName = "Test member", PositionTitle = "President", MemberTypeId = 1, PublicId = "test-member", CertificateUrl = "/club-certificates/test.pdf" };
        var memberCreated = await client.PostAsJsonAsync("/api/members", member);
        Assert.Equal(HttpStatusCode.Created, memberCreated.StatusCode);
        var memberId = (await memberCreated.Content.ReadFromJsonAsync<Member>())!.Id;
        member.PositionTitle = "Vice President";
        member.Bio = "A member-supplied biography.";
        member.GithubUrl = "https://github.com/test-member";
        member.LinkedInUrl = "https://www.linkedin.com/in/test-member";
        member.FacebookUrl = "https://facebook.com/test-member";
        member.InstagramUrl = "https://instagram.com/test-member";
        member.WebsiteUrl = "https://example.com";
        member.PublicEmail = "public@example.com";
        member.PublicPhone = "+201012345678";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/members/{memberId}", member)).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        var snapshot = (await client.GetFromJsonAsync<JsonElement>("/api/showcase"));
        Assert.Equal("Creativa Innovation Hub Ismailia", snapshot.GetProperty("events")[0].GetProperty("location").GetString());
        Assert.Equal(2, snapshot.GetProperty("events")[0].GetProperty("gallery").GetArrayLength());
        Assert.Equal("high-board", snapshot.GetProperty("members")[0].GetProperty("group").GetString());
        Assert.Equal("Vice President", snapshot.GetProperty("members")[0].GetProperty("positionTitle").GetString());
        Assert.Equal(member.Bio, snapshot.GetProperty("members")[0].GetProperty("bio").GetString());
        var profile = snapshot.GetProperty("members")[0];
        Assert.Equal(member.GithubUrl, profile.GetProperty("githubUrl").GetString());
        Assert.Equal(member.LinkedInUrl, profile.GetProperty("linkedInUrl").GetString());
        Assert.Equal(member.FacebookUrl, profile.GetProperty("facebookUrl").GetString());
        Assert.Equal(member.InstagramUrl, profile.GetProperty("instagramUrl").GetString());
        Assert.Equal(member.WebsiteUrl, profile.GetProperty("websiteUrl").GetString());
        Assert.Equal(member.PublicEmail, profile.GetProperty("publicEmail").GetString());
        Assert.Equal(member.PublicPhone, profile.GetProperty("publicPhone").GetString());
        var persisted = (await client.GetFromJsonAsync<Member>($"/api/members/{memberId}"))!;
        Assert.Equal(member.GithubUrl, persisted.GithubUrl);
        Assert.Equal(member.PublicPhone, persisted.PublicPhone);
    }

    [Theory]
    [InlineData("githubUrl", "javascript:alert(1)")]
    [InlineData("linkedInUrl", "//example.com")]
    [InlineData("facebookUrl", "http://example.com")]
    [InlineData("instagramUrl", "https://user:pass@example.com")]
    [InlineData("websiteUrl", "/relative")]
    [InlineData("publicEmail", "test@example.com?bcc=other@example.com")]
    [InlineData("publicPhone", "123;456")]
    public async Task UnsafePublicContactsAreRejected(string field, string value)
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        var input = new Dictionary<string, object> { ["fullName"] = "Test member", ["positionTitle"] = "Member", ["memberTypeId"] = 1, [field] = value };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/members", input)).StatusCode);
    }

    [Fact]
    public async Task PublicContactsCanBeRemovedWithoutRemovingTheMember()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        var input = new MemberWriteRequest { FullName = "Test member", PositionTitle = "Member", MemberTypeId = 1, PublicEmail = "public@example.com", GithubUrl = "https://github.com/test" };
        var response = await client.PostAsJsonAsync("/api/members", input);
        response.EnsureSuccessStatusCode();
        var memberId = (await response.Content.ReadFromJsonAsync<Member>())!.Id;
        input.PublicEmail = null;
        input.GithubUrl = null;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/members/{memberId}", input)).StatusCode);
        var snapshot = await client.GetFromJsonAsync<JsonElement>("/api/showcase");
        Assert.Equal(JsonValueKind.Null, snapshot.GetProperty("members")[0].GetProperty("publicEmail").ValueKind);
        Assert.Equal(JsonValueKind.Null, snapshot.GetProperty("members")[0].GetProperty("githubUrl").ValueKind);
    }

    [Fact]
    public async Task AchievementCrudAndStatisticsPersistWithValidation()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        var item = new StudentAchievement { Title = "Award", Summary = "Verified award", StudentNames = ["Student"], AchievedAt = "2026-09", EvidenceUrl = "https://example.com/award" };
        var created = await client.PostAsJsonAsync("/api/achievements", item);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<StudentAchievement>())!.Id;
        item.Title = "Updated award";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/achievements/{id}", item)).StatusCode);
        Assert.Equal("Updated award", (await client.GetFromJsonAsync<StudentAchievement>($"/api/achievements/{id}"))!.Title);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync("/api/showcase/statistics", new { registeredAttendees = -1 })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync("/api/showcase/statistics", new CommunityStatistics { RegisteredAttendees = 8000, Beneficiaries = 8000 })).StatusCode);
        Assert.Equal(8000, (await client.GetFromJsonAsync<CommunityStatistics>("/api/showcase/statistics"))!.Beneficiaries);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/achievements/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/achievements/{id}")).StatusCode);
        var invalidEvent = new Event { Title = "Invalid", Description = "Invalid", StartsAt = "2026-02-31", Gallery = ["javascript:alert(1)"] };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/events", invalidEvent)).StatusCode);
    }

    [Theory]
    [InlineData("/api/events", "POST")]
    [InlineData("/api/members", "POST")]
    [InlineData("/api/achievements", "POST")]
    [InlineData("/api/showcase/statistics", "PUT")]
    [InlineData("/api/showcase/import", "POST")]
    [InlineData("/api/leaderboard", "POST")]
    [InlineData("/api/leaderboard/preview", "POST")]
    [InlineData("/api/leaderboard/template", "GET")]
    [InlineData("/api/sponsors", "POST")]
    [InlineData("/api/sponsors/manage", "GET")]
    public async Task AnonymousWritesAreRejected(string route, string method)
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        using var request = new HttpRequestMessage(new HttpMethod(method), route) {
            Content = route.EndsWith("/preview", StringComparison.Ordinal) ? new MultipartFormDataContent { { new ByteArrayContent([0]), "file", "ratings.xlsx" } } : JsonContent.Create(new { })
        };
        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ImportIsSuperAdminOnlyAndDoesNotOverwriteExistingRecords()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client, AdminRole.SuperAdmin);
        var input = new { events = new[] { new Event { Title = "Original", Description = "Description", Slug = "original", StartsAt = "2026-07", EndsAt = "2026-08" } }, members = Array.Empty<MemberWriteRequest>(), statistics = new CommunityStatistics { RegisteredAttendees = 8000 } };
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/showcase/import", input)).StatusCode);
        input.events[0].Title = "Must not overwrite";
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/showcase/import", input)).StatusCode);
        var events = await client.GetFromJsonAsync<List<Event>>("/api/events");
        Assert.Single(events!);
        Assert.Equal("Original", events![0].Title);
        using var editorFactory = new AuthApiFactory();
        using var editor = editorFactory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(editorFactory, editor);
        Assert.Equal(HttpStatusCode.Forbidden, (await editor.PostAsJsonAsync("/api/showcase/import", input)).StatusCode);
    }

    private static async Task<HttpResponseMessage> PreviewWorkbook(HttpClient client, XLWorkbook workbook)
    {
        using var buffer = new MemoryStream();
        workbook.SaveAs(buffer);
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(buffer.ToArray()), "file", "ratings.xlsx");
        form.Add(new StringContent("2026-09-01"), "startDate");
        form.Add(new StringContent("2026-09-07"), "endDate");
        return await client.PostAsync("/api/leaderboard/preview", form);
    }

    [Fact]
    public async Task SponsorsStayPrivateUntilPublishedAndRetainEventAndTier()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        var createdEvent = await client.PostAsJsonAsync("/api/events", new Event { Title = "Sponsored event", Description = "Details", Slug = "sponsored-event" });
        var eventId = (await createdEvent.Content.ReadFromJsonAsync<Event>())!.Id;
        var input = new Controllers.SponsorWriteRequest { Name = "Test partner", Tier = "gold", EventId = eventId };
        var created = await client.PostAsJsonAsync("/api/sponsors", input);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
        Assert.Empty((await client.GetFromJsonAsync<JsonElement>("/api/sponsors")).EnumerateArray());
        Assert.Single((await client.GetFromJsonAsync<JsonElement>("/api/sponsors/manage")).EnumerateArray());
        input.IsPublished = true;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/sponsors/{id}", input)).StatusCode);
        input.LogoUrl = "/club-media/test-logo.png";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/sponsors/{id}", input)).StatusCode);
        var sponsors = await client.GetFromJsonAsync<JsonElement>("/api/sponsors");
        Assert.Equal("gold", sponsors[0].GetProperty("tier").GetString());
        Assert.Equal("sponsored-event", sponsors[0].GetProperty("eventKey").GetString());
        input.Tier = "unrecognised";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/sponsors/{id}", input)).StatusCode);
        input.Tier = "community";
        input.WebsiteUrl = "javascript:alert(1)";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/sponsors/{id}", input)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/sponsors/{id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<JsonElement>("/api/sponsors")).EnumerateArray());
    }

    [Fact]
    public async Task ExcelPreviewPublishesFinalScoresAndRequiresVersionedReplacement()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        (await client.PostAsJsonAsync("/api/members", new MemberWriteRequest { FullName = "Rated member", PositionTitle = "Member", PublicId = "rated-member", MemberTypeId = 4 })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/members", new MemberWriteRequest { FullName = "Unrated member", PositionTitle = "Member", PublicId = "unrated-member", MemberTypeId = 4 })).EnsureSuccessStatusCode();
        var template = await client.GetAsync("/api/leaderboard/template");
        template.EnsureSuccessStatusCode();
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", template.Content.Headers.ContentType!.MediaType);
        using var workbook = new XLWorkbook(new MemoryStream(await template.Content.ReadAsByteArrayAsync()));
        var sheet = workbook.Worksheet("Ratings");
        var row = sheet.RowsUsed().Single(item => item.Cell(1).GetString() == "rated-member");
        row.Cell(4).Value = 92.5;
        row.Cell(5).Value = 50;
        var previewResponse = await PreviewWorkbook(client, workbook);
        previewResponse.EnsureSuccessStatusCode();
        var preview = await previewResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Empty(preview.GetProperty("errors").EnumerateArray());
        Assert.Equal(1, preview.GetProperty("ignoredRows").GetInt32());
        var input = new Controllers.RatingImportRequest { Title = "Week one", StartDate = new(2026, 9, 1), EndDate = new(2026, 9, 7), Entries =
            [new Controllers.RatingInput { MemberId = "rated-member", Rate = 92.5m, OnlineAttendance = 50 }] };
        var published = await client.PostAsJsonAsync("/api/leaderboard", input);
        published.EnsureSuccessStatusCode();
        var result = await published.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/leaderboard", input)).StatusCode);
        input.ReplacePeriodId = result.GetProperty("id").GetInt32();
        input.ExpectedVersion = result.GetProperty("version").GetGuid();
        input.Entries[0].Rate = 97;
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/leaderboard", input)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/leaderboard", input)).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        var periods = await client.GetFromJsonAsync<JsonElement>("/api/leaderboard");
        Assert.Single(periods.EnumerateArray());
        var entries = periods[0].GetProperty("entries");
        Assert.Single(entries.EnumerateArray());
        Assert.Equal(97, entries[0].GetProperty("rate").GetDecimal());
        Assert.Equal(50, entries[0].GetProperty("onlineAttendance").GetDecimal());
        Assert.Equal(JsonValueKind.Null, entries[0].GetProperty("projects").ValueKind);
    }

    [Fact]
    public async Task RatingValidationRejectsUnknownMembersDuplicatesFormulasAndOutOfRangeScores()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await Authenticate(factory, client);
        (await client.PostAsJsonAsync("/api/members", new MemberWriteRequest { FullName = "Rated member", PositionTitle = "Member", PublicId = "rated-member", MemberTypeId = 4 })).EnsureSuccessStatusCode();
        using var workbook = new XLWorkbook();
        var sheet = workbook.AddWorksheet("Ratings");
        sheet.Cell(1, 1).Value = "MemberId";
        sheet.Cell(1, 2).Value = "Rate";
        sheet.Cell(2, 1).Value = "unknown-member";
        sheet.Cell(2, 2).Value = 50;
        sheet.Cell(3, 1).Value = "rated-member";
        sheet.Cell(3, 2).Value = 101;
        sheet.Cell(4, 1).Value = "rated-member";
        sheet.Cell(4, 2).Value = 90;
        sheet.Cell(5, 1).Value = "rated-member";
        sheet.Cell(5, 2).FormulaA1 = "40+50";
        var response = await PreviewWorkbook(client, workbook);
        response.EnsureSuccessStatusCode();
        var preview = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(4, preview.GetProperty("errors").GetArrayLength());
        foreach (var rows in new[] {
            new[] { new { memberId = "unknown-member", rate = 90m } },
            new[] { new { memberId = "rated-member", rate = 100.001m } },
            new[] { new { memberId = "rated-member", rate = 80m }, new { memberId = "rated-member", rate = 90m } }
        })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/leaderboard", new { title = "Invalid", startDate = "2026-09-01", endDate = "2026-09-07", entries = rows })).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<JsonElement>("/api/leaderboard")).EnumerateArray());
    }
}