# PowerShell Script for Full-Stack Diagnostic Test

# --- Configuration ---
$frontendUrl = "http://localhost:3000"
$backendApiBaseUrl = "http://localhost:5113/api"
$adminEmail = "admin@msc-scu.com"
$adminPassword = "Admin123!"

# --- Functions ---
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$TestName
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ [PASS] - $TestName" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ [FAIL] - $TestName - Received status code $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ [FAIL] - $TestName - Could not connect to $Url. Is it running?" -ForegroundColor Red
        Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# --- Test Execution ---
Write-Host "--- Starting Full-Stack Diagnostic Test ---" -ForegroundColor Cyan
$allTestsPassed = $true

# 1. Test Frontend Server
Write-Host "`n[1] Testing Frontend Server..."
if (-not (Test-Endpoint -Url $frontendUrl -TestName "React App is being served")) {
    $allTestsPassed = $false
    Write-Host "   ➡️  Suggestion: Check the terminal where you ran 'npm start'. Look for errors. Try restarting it." -ForegroundColor Yellow
}

# 2. Test Backend Server (Public Endpoint)
Write-Host "`n[2] Testing Backend API Server..."
if (-not (Test-Endpoint -Url "$backendApiBaseUrl/events" -TestName "ASP.NET Core API is running")) {
    $allTestsPassed = $false
    Write-Host "   ➡️  Suggestion: Check the terminal where you ran 'dotnet run' for the MSC.WebAPI project. Look for errors." -ForegroundColor Yellow
}

# 3. Test Backend Login Endpoint
Write-Host "`n[3] Testing Login API Endpoint..."
$loginUrl = "$backendApiBaseUrl/auth/login"
$loginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    if ($loginResponse.token) {
        Write-Host "✅ [PASS] - Login API returned a valid token." -ForegroundColor Green
        $jwtToken = $loginResponse.token
        
        # 4. Test Authenticated Endpoint
        Write-Host "`n[4] Testing Authenticated Endpoint with Token..."
        $headers = @{
            "Authorization" = "Bearer $jwtToken"
        }
        $authTestUrl = "$backendApiBaseUrl/admin/users"
        try {
            $authResponse = Invoke-WebRequest -Uri $authTestUrl -Headers $headers -UseBasicParsing
             if ($authResponse.StatusCode -eq 200) {
                Write-Host "✅ [PASS] - Successfully accessed a protected route with the token." -ForegroundColor Green
            } else {
                Write-Host "❌ [FAIL] - Access to protected route failed with status code $($authResponse.StatusCode)" -ForegroundColor Red
                $allTestsPassed = $false
            }
        } catch {
             Write-Host "❌ [FAIL] - Error accessing protected route." -ForegroundColor Red
             Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Yellow
             $allTestsPassed = $false
        }

    } else {
        Write-Host "❌ [FAIL] - Login API did not return a token." -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ [FAIL] - Error calling Login API at $loginUrl." -ForegroundColor Red
    Write-Host "       Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    Write-Host "       Response: $($_.Exception.Response.GetResponseStream() | New-Object System.IO.StreamReader | ForEach-Object { $_.ReadToEnd() })" -ForegroundColor Yellow
    $allTestsPassed = $false
}


# --- Final Summary ---
Write-Host "`n--- Test Summary ---" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "✅ All critical tests passed. The issue is highly likely within the React component lifecycle or event handling, not the backend." -ForegroundColor Green
} else {
    Write-Host "❌ One or more critical tests failed. Please review the logs above to identify the root cause." -ForegroundColor Red
}
