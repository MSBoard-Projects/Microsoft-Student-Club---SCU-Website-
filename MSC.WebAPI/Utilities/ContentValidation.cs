using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.RegularExpressions;

namespace MSC.WebAPI.Utilities;

public sealed class PublicUrlAttribute : ValidationAttribute
{
    public override bool IsValid(object? value) => value is null || value is string text && IsPublicUrl(text);

    public static bool IsPublicUrl(string text) => string.IsNullOrEmpty(text) || text.Length <= 2048 &&
        !text.Any(char.IsControl) && !text.Contains('\\') &&
        (text.StartsWith('/') && !text.StartsWith("//") || Uri.TryCreate(text, UriKind.Absolute, out var uri) && uri.Scheme == "https");
}

public sealed class EventScheduleAttribute : ValidationAttribute
{
    public override bool IsValid(object? value) => value is null || value is string text && (text.Length == 0 || TryParse(text, out _));

    public static bool TryParse(string text, out DateTimeOffset instant)
    {
        instant = default;
        if (Regex.IsMatch(text, @"^\d{4}-\d{2}$") && DateTime.TryParseExact(text, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var month))
        { instant = new DateTimeOffset(month, TimeSpan.Zero); return true; }
        if (Regex.IsMatch(text, @"^\d{4}-\d{2}-\d{2}$") && DateTime.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        { instant = new DateTimeOffset(date, TimeSpan.Zero); return true; }
        return Regex.IsMatch(text, @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,7})?)?(Z|[+-]\d{2}:\d{2})$") &&
            DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.None, out instant);
    }
}