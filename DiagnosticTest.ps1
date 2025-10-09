# MSC-SCU Website - Diagnostic Test Script
# This script tests Backend API and Database connectivity

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MSC-SCU Website - Diagnostic Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check if Backend is running
Write-Host "[1] Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5113/api/members' -Method GET -ErrorAction Stop
    Write-Host "   ✅ Backend is running on http://localhost:5113" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   Solution: Run 'cd MSC.WebAPI; dotnet run' in a separate terminal`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test Login API
Write-Host "`n[2] Testing Login API..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@msc-scu.com"
        password = "Admin123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5113/api/auth/login' -Method POST -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    
    Write-Host "   ✅ Login API working!" -ForegroundColor Green
    Write-Host "   Email: $($loginResponse.email)" -ForegroundColor Green
    Write-Host "   Role: $($loginResponse.role)" -ForegroundColor Green
    Write-Host "   Token received: Yes (${($loginResponse.token.Length)} characters)" -ForegroundColor Green
    
    $global:authToken = $loginResponse.token
} catch {
    Write-Host "   ❌ Login failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    
    Write-Host "`n   Possible causes:" -ForegroundColor Yellow
    Write-Host "   - Admin user not created in database" -ForegroundColor Yellow
    Write-Host "   - Wrong password" -ForegroundColor Yellow
    Write-Host "   - Database connection issue`n" -ForegroundColor Yellow
    
    Write-Host "   Solution: Run 'cd MSC.WebAPI; dotnet run seed-admin'`n" -ForegroundColor Yellow
    exit 1
}

# Test 3: Test authenticated endpoint
Write-Host "`n[3] Testing authenticated endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        'Authorization' = "Bearer $global:authToken"
    }
    
    $adminUsers = Invoke-RestMethod -Uri 'http://localhost:5113/api/adminusers' -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Authentication working!" -ForegroundColor Green
    Write-Host "   Found $($adminUsers.Count) admin user(s)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Authentication failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check CORS configuration
Write-Host "`n[4] Checking CORS configuration..." -ForegroundColor Yellow
try {
    # Read .env file to check CORS settings
    $envPath = Join-Path $PSScriptRoot "MSC.WebAPI\.env"
    if (Test-Path $envPath) {
        $corsLine = Get-Content $envPath | Where-Object { $_ -like "CORS_ALLOWED_ORIGINS=*" }
        if ($corsLine) {
            Write-Host "   ✅ CORS configured in .env:" -ForegroundColor Green
            Write-Host "   $corsLine" -ForegroundColor Gray
            
            if ($corsLine -like "*localhost:3000*") {
                Write-Host "   ✅ localhost:3000 allowed" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  localhost:3000 NOT in CORS origins!" -ForegroundColor Yellow
            }
            
            if ($corsLine -like "*localhost:3001*") {
                Write-Host "   ✅ localhost:3001 allowed" -ForegroundColor Green
            }
        } else {
            Write-Host "   ⚠️  CORS not found in .env file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  .env file not found at: $envPath" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not read .env file: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Check Frontend API URL
Write-Host "`n[5] Checking Frontend API configuration..." -ForegroundColor Yellow
try {
    $apiClientPath = Join-Path $PSScriptRoot "msc-webapp\src\services\apiClient.js"
    if (Test-Path $apiClientPath) {
        $apiClientContent = Get-Content $apiClientPath -Raw
        
        if ($apiClientContent -match "http://localhost:5113") {
            Write-Host "   ✅ Frontend points to correct Backend URL (localhost:5113)" -ForegroundColor Green
        } elseif ($apiClientContent -match "https://localhost:7157") {
            Write-Host "   ❌ Frontend points to WRONG URL (localhost:7157)!" -ForegroundColor Red
            Write-Host "   Solution: Update apiClient.js to use http://localhost:5113/api" -ForegroundColor Yellow
        } else {
            Write-Host "   ⚠️  Could not determine Frontend API URL" -ForegroundColor Yellow
        }
        
        # Extract API_BASE_URL
        if ($apiClientContent -match "API_BASE_URL\s*=.*?'([^']+)'") {
            Write-Host "   API_BASE_URL: $($matches[1])" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  apiClient.js not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Error checking apiClient.js: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 6: Check Frontend is running
Write-Host "`n[6] Checking if Frontend is running..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri 'http://localhost:3000' -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend is NOT running!" -ForegroundColor Red
    Write-Host "   Solution: Run 'cd msc-webapp; npm start' in a separate terminal`n" -ForegroundColor Yellow
}

# Test 7: Database connection test
Write-Host "`n[7] Testing Database connection..." -ForegroundColor Yellow
try {
    # Check if we can get data from database
    $members = Invoke-RestMethod -Uri 'http://localhost:5113/api/members' -Method GET -ErrorAction Stop
    Write-Host "   ✅ Database connection working" -ForegroundColor Green
    Write-Host "   Members in database: $($members.Count)" -ForegroundColor Green
    
    $events = Invoke-RestMethod -Uri 'http://localhost:5113/api/events' -Method GET -ErrorAction Stop
    Write-Host "   Events in database: $($events.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Database connection issue!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ All critical tests passed!" -ForegroundColor Green
Write-Host "`nYou can now:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/admin/login" -ForegroundColor White
Write-Host "2. Login with:" -ForegroundColor White
Write-Host "   Email: admin@msc-scu.com" -ForegroundColor Gray
Write-Host "   Password: Admin123!" -ForegroundColor Gray
Write-Host "`n3. If login fails in browser:" -ForegroundColor White
Write-Host "   - Open Developer Tools (F12)" -ForegroundColor Gray
Write-Host "   - Go to Console tab" -ForegroundColor Gray
Write-Host "   - Try logging in" -ForegroundColor Gray
Write-Host "   - Check for errors`n" -ForegroundColor Gray

Write-Host "========================================`n" -ForegroundColor Cyan
