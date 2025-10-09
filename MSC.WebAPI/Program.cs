using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using Serilog.Events;
using Azure.Storage.Blobs;
using MSC.WebAPI.Data;
using MSC.WebAPI.Services;
using MSC.WebAPI.Utilities;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/msc-api-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting MSC Web API");

    // Check for command-line arguments to seed admin
    if (args.Length > 0 && args[0].Equals("seed-admin", StringComparison.OrdinalIgnoreCase))
    {
        Log.Information("Running admin seeder...");
        
        // Build a minimal configuration to get connection string
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .Build();
        
        var connectionString = config.GetConnectionString("DefaultConnection");
        
        // Build DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);
        
        // Create DbContext and run seeder
        using (var context = new ApplicationDbContext(optionsBuilder.Options))
        {
            // Get email and password from args or use defaults
            var email = args.Length > 1 ? args[1] : "admin@msc-scu.com";
            var password = args.Length > 2 ? args[2] : "Admin123!";
            
            await AdminSeeder.SeedSuperAdmin(context, email, password);
        }
        
        Log.Information("Admin seeding completed. Exiting...");
        return; // Exit the application after seeding
    }

    // Check for command-line arguments to seed sample data
    if (args.Length > 0 && args[0].Equals("seed-data", StringComparison.OrdinalIgnoreCase))
    {
        Log.Information("Running sample data seeder...");
        
        // Build a minimal configuration to get connection string
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .Build();
        
        var connectionString = config.GetConnectionString("DefaultConnection");
        
        // Build DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);
        
        // Create DbContext and run seeder
        using (var context = new ApplicationDbContext(optionsBuilder.Options))
        {
            await SampleDataSeeder.SeedSampleData(context);
        }
        
        Log.Information("Sample data seeding completed. Exiting...");
        return; // Exit the application after seeding
    }

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // Configure Entity Framework with SQL Server
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure()
        ));

    // Configure JWT Authentication
    var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
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
            ClockSkew = TimeSpan.Zero // Set to zero for exact expiration time (1 hour)
        };
    });

    builder.Services.AddAuthorization();

    // Register services
    builder.Services.AddScoped<IAuthService, AuthService>();

    // Configure Azure Blob Storage
    var blobConnectionString = builder.Configuration["Azure:BlobStorage:ConnectionString"];
    if (!string.IsNullOrEmpty(blobConnectionString))
    {
        builder.Services.AddSingleton(x => new BlobServiceClient(blobConnectionString));
    }

    // Configure CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReactApp", policy =>
        {
            policy.WithOrigins(builder.Configuration["Cors:AllowedOrigins"]?.Split(',') ?? new[] { "http://localhost:3000" })
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    app.UseSerilogRequestLogging();

    app.UseCors("AllowReactApp");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
