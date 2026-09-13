# MSC-SCU Website - Sample Data Seeder Script
# This script seeds the database with sample members and events for testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MSC-SCU Sample Data Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Navigate to API project
Set-Location "$workspaceRoot\MSC.WebAPI"

Write-Host "This will add sample data to your database:" -ForegroundColor Yellow
Write-Host "  - 13 Sample Members (High Board, Board, Golden Members)" -ForegroundColor White
Write-Host "  - 8 Sample Events (Featured, Upcoming, Past)" -ForegroundColor White
Write-Host "  - 6 Site Content Entries (Vision, Mission, Hero text)" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  WARNING: This should only be run on a fresh database!" -ForegroundColor Yellow
Write-Host "If data already exists, it will be skipped." -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Do you want to continue? (Y/n)"

if ($confirm -eq "" -or $confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "🚀 Running sample data seeder..." -ForegroundColor Green
    Write-Host ""
    
    dotnet run seed-data
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ Sample Data Seeded Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "  1. Run the application to see sample data" -ForegroundColor White
        Write-Host "  2. Login to admin panel and manage the data" -ForegroundColor White
        Write-Host "  3. Test all Phase 5 UI/UX features" -ForegroundColor White
        Write-Host ""
        Write-Host "Sample Events Include:" -ForegroundColor Yellow
        Write-Host "  🌟 Tech Summit 2025 (Upcoming, Featured)" -ForegroundColor White
        Write-Host "  🌟 Game Development Hackathon (Upcoming, Featured)" -ForegroundColor White
        Write-Host "  🌟 Azure AI Bootcamp (Past, Featured)" -ForegroundColor White
        Write-Host "  ☁️  Cloud Computing Workshop (Upcoming)" -ForegroundColor White
        Write-Host "  📱 Mobile App Development (Upcoming)" -ForegroundColor White
        Write-Host "  🔒 Cybersecurity Essentials (Past)" -ForegroundColor White
        Write-Host "  🌐 Web Development Basics (Past)" -ForegroundColor White
        Write-Host "  🚀 Introduction to DevOps (Upcoming)" -ForegroundColor White
        Write-Host ""
        Write-Host "Sample Members Include:" -ForegroundColor Yellow
        Write-Host "  👑 3 High Board Members (President, VP, Secretary)" -ForegroundColor White
        Write-Host "  👥 4 Board Members (Technical Lead, Events, Marketing, Community)" -ForegroundColor White
        Write-Host "  ⭐ 6 Golden Members (Alumni from Microsoft, Google, Azure)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ❌ Sample Data Seeding Failed!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check the error message above." -ForegroundColor Yellow
        Write-Host "Make sure the database is created and migrations are applied." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To reset the database, run:" -ForegroundColor Gray
        Write-Host "  cd MSC.WebAPI" -ForegroundColor White
        Write-Host "  dotnet ef database drop -f" -ForegroundColor White
        Write-Host "  dotnet ef database update" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "❌ Sample data seeding cancelled." -ForegroundColor Yellow
    Write-Host ""
}

# Return to workspace root
Set-Location $workspaceRoot

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
