# MSC-SCU Website - Quick Start Script
# This script automates the setup and launch of the MSC-SCU website for testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MSC-SCU Website - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$workspaceRoot = $PSScriptRoot

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow

# Check .NET SDK
try {
    $dotnetVersion = dotnet --version
    Write-Host "  ✅ .NET SDK installed: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ .NET SDK not found. Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check SQL LocalDB
try {
    $localDbInfo = sqllocaldb info
    if ($localDbInfo -match "mssqllocaldb") {
        Write-Host "  ✅ SQL Server LocalDB installed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  mssqllocaldb instance not found. Creating..." -ForegroundColor Yellow
        sqllocaldb create mssqllocaldb
    }
} catch {
    Write-Host "  ❌ SQL Server LocalDB not found. Please install SQL Server Express LocalDB" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Setup database
Write-Host "Step 2: Setting up database..." -ForegroundColor Yellow

Set-Location "$workspaceRoot\MSC.WebAPI"

# Check if migrations exist
$migrationsFolder = Test-Path ".\Migrations"
if (-not $migrationsFolder) {
    Write-Host "  ⚠️  No migrations found. Creating initial migration..." -ForegroundColor Yellow
    dotnet ef migrations add InitialCreate
}

# Apply migrations
Write-Host "  Applying database migrations..." -ForegroundColor Gray
$migrationResult = dotnet ef database update
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Database created/updated successfully" -ForegroundColor Green
} else {
    Write-Host "  ❌ Database migration failed. Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Seed admin user
Write-Host "Step 3: Creating admin user..." -ForegroundColor Yellow

$createAdmin = Read-Host "  Do you want to create a default admin user? (Y/n)"
if ($createAdmin -eq "" -or $createAdmin -eq "Y" -or $createAdmin -eq "y") {
    Write-Host "  Creating default SuperAdmin..." -ForegroundColor Gray
    Write-Host "    Email: admin@msc-scu.com" -ForegroundColor Gray
    Write-Host "    Password: Admin123!" -ForegroundColor Gray
    
    dotnet run seed-admin
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Admin user created" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Admin user creation failed (may already exist)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⏭️  Skipping admin user creation" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Install frontend dependencies
Write-Host "Step 4: Installing frontend dependencies..." -ForegroundColor Yellow

Set-Location "$workspaceRoot\msc-webapp"

if (-not (Test-Path ".\node_modules")) {
    Write-Host "  Installing npm packages..." -ForegroundColor Gray
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ npm install failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Step 5: Launch applications
Write-Host "Step 5: Launching applications..." -ForegroundColor Yellow
Write-Host ""

Write-Host "This will open 2 terminal windows:" -ForegroundColor Cyan
Write-Host "  1. Backend API (https://localhost:7157)" -ForegroundColor White
Write-Host "  2. Frontend App (http://localhost:3000)" -ForegroundColor White
Write-Host ""

$launch = Read-Host "Ready to launch? (Y/n)"
if ($launch -eq "" -or $launch -eq "Y" -or $launch -eq "y") {
    
    # Launch backend in new window
    Write-Host "  🚀 Starting backend API..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workspaceRoot\MSC.WebAPI'; Write-Host 'MSC Backend API' -ForegroundColor Cyan; Write-Host '==================' -ForegroundColor Cyan; Write-Host ''; dotnet run"
    
    # Wait a bit for backend to start
    Start-Sleep -Seconds 3
    
    # Launch frontend in new window
    Write-Host "  🚀 Starting frontend app..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workspaceRoot\msc-webapp'; Write-Host 'MSC Frontend App' -ForegroundColor Cyan; Write-Host '=================' -ForegroundColor Cyan; Write-Host ''; npm start"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ MSC-SCU Website is starting!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backend API:  https://localhost:7157" -ForegroundColor White
    Write-Host "Frontend App: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Yellow
    Write-Host "  Email:    admin@msc-scu.com" -ForegroundColor White
    Write-Host "  Password: Admin123!" -ForegroundColor White
    Write-Host ""
    Write-Host "The browser should open automatically in a few seconds..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop the servers, close the terminal windows or press Ctrl+C in each." -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "Launch cancelled. You can manually start the servers:" -ForegroundColor Yellow
    Write-Host "  Backend:  cd MSC.WebAPI && dotnet run" -ForegroundColor Gray
    Write-Host "  Frontend: cd msc-webapp && npm start" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
