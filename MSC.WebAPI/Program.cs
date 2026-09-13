using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MSC.WebAPI.Data;
using MSC.WebAPI.Models;
using MSC.WebAPI.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
	DotNetEnv.Env.NoClobber().Load();
	builder.Configuration.AddEnvironmentVariables();
}

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32 ||
	string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
	throw new InvalidOperationException("Configure Jwt:Key (at least 32 bytes), Jwt:Issuer, and Jwt:Audience.");
}

builder.Host.UseSerilog((context, logging) => logging
	.ReadFrom.Configuration(context.Configuration)
	.Enrich.FromLogContext()
	.WriteTo.Console());

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(
	builder.Configuration.GetConnectionString("DefaultConnection")
		?? throw new InvalidOperationException("Configure ConnectionStrings:DefaultConnection.")));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddIdentityCore<AdminUser>(options =>
{
	options.User.RequireUniqueEmail = true;
	options.Password.RequiredLength = 12;
	options.Lockout.AllowedForNewUsers = true;
	options.Lockout.MaxFailedAccessAttempts = 5;
	options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
}).AddEntityFrameworkStores<ApplicationDbContext>().AddSignInManager();
builder.Services.AddScoped<IPasswordHasher<AdminUser>, CustomPasswordHasher>();
builder.Services.AddSingleton(_ => new BlobServiceClient(
	builder.Configuration["Azure:BlobStorage:ConnectionString"]
		?? throw new InvalidOperationException("Configure Azure:BlobStorage:ConnectionString.")));
builder.Services.AddControllers().AddJsonOptions(options =>
{
	options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
	options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
	options.TokenValidationParameters = new TokenValidationParameters
	{
		ValidateIssuer = true,
		ValidateAudience = true,
		ValidateLifetime = true,
		ValidateIssuerSigningKey = true,
		ValidIssuer = jwtIssuer,
		ValidAudience = jwtAudience,
		IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
		ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
		ClockSkew = TimeSpan.Zero
	};
	options.Events = new JwtBearerEvents
	{
		OnTokenValidated = async context =>
		{
			var principal = context.Principal;
			if (!int.TryParse(principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var adminId))
			{
				context.Fail("Invalid session");
				return;
			}
			var database = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
			var admin = await database.AdminUsers.AsNoTracking().SingleOrDefaultAsync(
				user => user.Id == adminId, context.HttpContext.RequestAborted);
			if (admin == null || string.IsNullOrEmpty(admin.SecurityStamp) ||
				admin.SecurityStamp != principal?.FindFirstValue("security_stamp") ||
				admin.Role.ToString() != principal?.FindFirstValue(ClaimTypes.Role) ||
				(admin.LockoutEnabled && admin.LockoutEnd > DateTimeOffset.UtcNow))
			{
				context.Fail("Session is no longer valid");
			}
		}
	};
});
builder.Services.AddAuthorization();
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
	?? Array.Empty<string>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
{
	if (allowedOrigins.Length > 0)
	{
		policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
	}
}));

var app = builder.Build();
app.UseExceptionHandler(handler => handler.Run(async context =>
{
	context.Response.StatusCode = StatusCodes.Status500InternalServerError;
	await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred" });
}));
app.UseSerilogRequestLogging();
if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}
else
{
	app.UseHsts();
}
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
