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
using DotNetEnv; // Add this for .env file support

// Load environment variables from .env file FIRST (before any configuration)
try
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (File.Exists(envPath))
    {
        Env.Load();
        Console.WriteLine("✅ Environment variables loaded from .env file");
    }
    else
    {
        Console.WriteLine("⚠️ .env file not found at: " + envPath);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Warning: Could not load .env file: {ex.Message}");
}

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
    Log.Information("Environment variables loaded from .env file");

    // Check for command-line arguments to seed admin
    if (args.Length > 0 && args[0].Equals("seed-admin", StringComparison.OrdinalIgnoreCase))
    {
        Log.Information("Running admin seeder...");
        
        // Build a minimal configuration to get connection string
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .AddEnvironmentVariables() // Add this to read from environment variables
            .Build();
        
        var adminConnectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION_STRING") 
                                   ?? config.GetConnectionString("DefaultConnection");
        
        // Build DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(adminConnectionString);
        
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
            .AddEnvironmentVariables() // Add this to read from environment variables
            .Build();
        
        var dataConnectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION_STRING") 
                                  ?? config.GetConnectionString("DefaultConnection");
        
        // Build DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(dataConnectionString);
        
        // Create DbContext and run seeder
        using (var context = new ApplicationDbContext(optionsBuilder.Options))
        {
            await SampleDataSeeder.SeedSampleData(context);
        }
        
        Log.Information("Sample data seeding completed. Exiting...");
        return; // Exit the application after seeding
    }

    var builder = WebApplication.CreateBuilder(args);

    // Add environment variables to configuration
    builder.Configuration.AddEnvironmentVariables();

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // Configure Entity Framework with SQL Server
    // First try to get from environment variable, then fall back to appsettings
    var connectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION_STRING") 
                          ?? builder.Configuration.GetConnectionString("DefaultConnection");
    
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(
            connectionString,
            sqlOptions => sqlOptions.EnableRetryOnFailure()
        ));

    // Configure JWT Authentication
    // First try environment variables, then fall back to appsettings
    var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
                ?? builder.Configuration["Jwt:Key"] 
                ?? throw new InvalidOperationException("JWT Key not configured");
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                   ?? builder.Configuration["Jwt:Issuer"] 
                   ?? throw new InvalidOperationException("JWT Issuer not configured");
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                     ?? builder.Configuration["Jwt:Audience"] 
                     ?? throw new InvalidOperationException("JWT Audience not configured");

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

    // Configure Azure Blob Storage - Use environment variable first
    var blobConnectionString = Environment.GetEnvironmentVariable("AZURE_BLOB_STORAGE_CONNECTION_STRING")
                              ?? builder.Configuration["Azure:BlobStorage:ConnectionString"];
    if (!string.IsNullOrEmpty(blobConnectionString))
    {
        builder.Services.AddSingleton(x => new BlobServiceClient(blobConnectionString));
        Log.Information("Azure Blob Storage configured successfully");
    }
    else
    {
        Log.Warning("Azure Blob Storage connection string not found. Upload functionality will not work.");
    }

    // Configure CORS
    var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
                     ?? builder.Configuration["Cors:AllowedOrigins"]
                     ?? "http://localhost:3000,http://localhost:3001";
    
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReactApp", policy =>
        {
            policy.WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries))
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });
    
    Log.Information("CORS configured for origins: {Origins}", corsOrigins);

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
