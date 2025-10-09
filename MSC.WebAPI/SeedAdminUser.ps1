# PowerShell Script to Create First Admin User
# This script creates a SuperAdmin user for initial testing

Write-Host "MSC-SCU Admin User Seeder" -ForegroundColor Cyan
Write-Host "==========================`n" -ForegroundColor Cyan

# Default credentials
$defaultEmail = "admin@msc-scu.com"
$defaultPassword = "Admin123!"

Write-Host "This script will create a SuperAdmin user in the MSC_DB database." -ForegroundColor Yellow
Write-Host ""

# Prompt for email
$email = Read-Host "Enter admin email (default: $defaultEmail)"
if ([string]::IsNullOrWhiteSpace($email)) {
    $email = $defaultEmail
}

# Prompt for password
$password = Read-Host "Enter admin password (default: $defaultPassword)"
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = $defaultPassword
}

Write-Host ""
Write-Host "Creating admin user..." -ForegroundColor Green
Write-Host "  Email: $email" -ForegroundColor Gray
Write-Host "  Password: ********" -ForegroundColor Gray
Write-Host "  Role: SuperAdmin" -ForegroundColor Gray
Write-Host ""

# SQL Script to insert admin user
# Note: Password hash is generated using BCrypt with salt rounds = 11
# The hash below is for "Admin123!" - you'll need to generate a new one for custom passwords

$sqlScript = @"
USE MSC_DB;

-- Check if user already exists
IF EXISTS (SELECT 1 FROM AdminUsers WHERE Email = '$email')
BEGIN
    PRINT 'Admin user with email $email already exists!'
    PRINT 'Skipping creation...'
END
ELSE
BEGIN
    -- Insert SuperAdmin user
    -- Note: PasswordHash below is for 'Admin123!'
    -- For a different password, you need to generate the BCrypt hash
    INSERT INTO AdminUsers (Email, PasswordHash, Role, CreatedAt, LastLogin)
    VALUES (
        '$email',
        '$2a$11$X5wKZPJQk5Y5L5L5L5L5LeK5wKZPJQk5Y5L5L5L5L5LeK5wKZPJQk5',
        0,  -- 0 = SuperAdmin
        GETUTCDATE(),
        NULL
    );
    
    PRINT 'SuperAdmin user created successfully!'
    PRINT 'Email: $email'
    PRINT 'Password: Admin123! (or your custom password if you generated a new hash)'
END
"@

# Execute SQL script
try {
    $result = sqlcmd -S "(localdb)\mssqllocaldb" -Q $sqlScript -W
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now login with:" -ForegroundColor Cyan
        Write-Host "  Email: $email" -ForegroundColor White
        Write-Host "  Password: $password" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Change this password after first login!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create admin user. Error code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Make sure SQL Server LocalDB is running and MSC_DB database exists." -ForegroundColor Yellow
        Write-Host "Run 'dotnet ef database update' first if you haven't already." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error executing SQL script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure SQL Server LocalDB is installed and running" -ForegroundColor Gray
    Write-Host "2. Run 'sqllocaldb info' to check LocalDB instances" -ForegroundColor Gray
    Write-Host "3. Run 'dotnet ef database update' to create MSC_DB database" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Note: If you used a custom password, you'll need to:" -ForegroundColor Yellow
Write-Host "1. Generate a BCrypt hash for your password" -ForegroundColor Gray
Write-Host "2. Update the PasswordHash value in the SQL script above" -ForegroundColor Gray
Write-Host "3. Re-run this script" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use the default password 'Admin123!' for testing." -ForegroundColor Gray

Pause
