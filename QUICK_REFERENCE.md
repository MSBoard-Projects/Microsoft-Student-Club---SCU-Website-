# Quick Reference - Testing Troubleshooting

## 🚀 Quick Start Commands

### Run QuickStart Script (Recommended)
```powershell
.\QuickStart.ps1
```
This will automatically:
- Check prerequisites
- Create/update database
- Create admin user
- Offer to seed sample data
- Install npm packages
- Launch both servers

### Seed Sample Data (For Testing)
```powershell
.\SeedSampleData.ps1
```
Or manually:
```powershell
cd MSC.WebAPI
dotnet run seed-data
```

This adds:
- **13 Sample Members** (High Board, Board, Golden Members)
- **8 Sample Events** (Featured, Upcoming, Past including Azure AI Bootcamp, Game Dev Hackathon)
- **6 Site Content Entries** (Vision, Mission, Hero text)

### Manual Start (if needed)
```powershell
# Terminal 1 - Backend
cd MSC.WebAPI
dotnet run

# Terminal 2 - Frontend
cd msc-webapp
npm start
```

### Stop Servers
- Press `Ctrl + C` in each terminal window, OR
- Close the terminal windows

---

## 🔑 Default Login Credentials

**Admin Account:**
- **Email:** admin@msc-scu.com
- **Password:** Admin123!
- **Role:** SuperAdmin

---

## 🌐 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** https://localhost:7157
- **Swagger (API Docs):** https://localhost:7157/swagger (if enabled)

---

## 🐛 Common Issues & Solutions

### Issue: "Database migration failed"
**Solution:**
```powershell
cd MSC.WebAPI
dotnet ef database drop -f
dotnet ef database update
dotnet run seed-admin
```

### Issue: "SQL LocalDB not found"
**Solution:**
1. Install SQL Server Express LocalDB from Microsoft
2. Create instance: `sqllocaldb create mssqllocaldb`
3. Start instance: `sqllocaldb start mssqllocaldb`

### Issue: "npm install failed"
**Solution:**
```powershell
cd msc-webapp
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: "Port 3000 already in use"
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Issue: "Port 7157 already in use"
**Solution:**
```powershell
# Find process using port 7157
netstat -ano | findstr :7157

# Kill process
taskkill /PID <PID> /F
```

### Issue: "Login fails with 'Network Error'"
**Checklist:**
1. [ ] Backend is running on https://localhost:7157
2. [ ] Check CORS configuration in Program.cs
3. [ ] Check browser console for errors (F12)
4. [ ] Verify admin user exists in database

### Issue: "Images not uploading"
**Expected:** Azure Blob Storage is not configured yet
**Workaround:** Add connection string in `appsettings.json`:
```json
"Azure": {
  "BlobStorage": {
    "ConnectionString": "YOUR_AZURE_BLOB_STORAGE_CONNECTION_STRING"
  }
}
```

### Issue: "Toast notifications not appearing"
**Checklist:**
1. [ ] Check browser console for errors
2. [ ] Verify react-toastify is installed: `npm list react-toastify`
3. [ ] Check ToastContainer is in App.js
4. [ ] Clear browser cache and refresh (Ctrl + Shift + R)

### Issue: "Animations not working"
**Checklist:**
1. [ ] Check browser console for errors
2. [ ] Verify framer-motion is installed: `npm list framer-motion`
3. [ ] Test in different browser (Chrome/Edge recommended)
4. [ ] Check if animations are disabled in OS settings (Windows: Settings → Accessibility → Visual effects)

### Issue: "Mobile menu not opening"
**Checklist:**
1. [ ] Resize browser to <768px width
2. [ ] Check browser console for errors
3. [ ] Verify react-icons is installed: `npm list react-icons`
4. [ ] Hard refresh browser (Ctrl + Shift + R)

---

## 🗄️ Database Commands

### View Connection String
```powershell
cd MSC.WebAPI
type appsettings.json | Select-String "ConnectionString"
```

### Create Migration
```powershell
cd MSC.WebAPI
dotnet ef migrations add MigrationName
```

### Apply Migrations
```powershell
cd MSC.WebAPI
dotnet ef database update
```

### Reset Database (WARNING: Deletes all data)
```powershell
cd MSC.WebAPI
dotnet ef database drop -f
dotnet ef database update
```

### Seed Admin User
```powershell
cd MSC.WebAPI
dotnet run seed-admin
# Or with custom credentials:
dotnet run seed-admin custom@email.com MyPassword123!
```

---

## 🧪 Testing Data

### Sample Member (for testing CRUD)
```json
{
  "fullName": "John Doe",
  "positionTitle": "Software Engineer",
  "memberTypeId": 2,
  "displayOrder": 1,
  "imageUrl": "",
  "certificateUrl": ""
}
```

### Sample Event (for testing CRUD)
```json
{
  "title": "Tech Workshop",
  "description": "Learn about web development",
  "eventDate": "2025-11-15T14:00:00",
  "isUpcoming": true,
  "isFeatured": true,
  "imageUrl": ""
}
```

### Member Types (default in database)
1. High Board
2. Board
3. Golden Member

---

## 📊 Performance Benchmarks

### Expected Load Times (on localhost):
- **Landing Page First Load:** <2 seconds
- **Landing Page Cached:** <500ms
- **Admin Dashboard:** <1 second
- **Member Management:** <1 second

### Expected Bundle Sizes:
- **Main JS (gzipped):** ~154 KB
- **Main CSS (gzipped):** ~8.65 KB
- **Total:** ~163 KB

### Expected Lighthouse Scores:
- **Performance:** 85+
- **Accessibility:** 90+
- **Best Practices:** 90+
- **SEO:** 80+

---

## 🔍 Debugging Tips

### Enable Verbose Logging (Backend)
Edit `appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

### View API Logs
Backend logs are written to:
- **Console:** Real-time output in terminal
- **File:** `MSC.WebAPI/logs/msc-api-[date].txt`

### Browser DevTools Shortcuts
- **Open DevTools:** F12
- **Console:** Ctrl + Shift + J
- **Network Tab:** Ctrl + Shift + E
- **Elements Tab:** Ctrl + Shift + C
- **Hard Refresh:** Ctrl + Shift + R
- **Clear Cache:** Ctrl + Shift + Delete

### React DevTools (Optional)
Install browser extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

---

## 📞 Help Commands

### Check Installed Versions
```powershell
# .NET SDK
dotnet --version

# Node.js
node --version

# npm
npm --version

# SQL LocalDB
sqllocaldb info
```

### Verify Project Structure
```powershell
# Backend
cd MSC.WebAPI
dir Controllers, Models, Data, Services

# Frontend
cd msc-webapp
dir src\components, src\pages, src\services
```

### Test API Directly (PowerShell)
```powershell
# Test GET endpoint
Invoke-WebRequest -Uri "https://localhost:7157/api/members" -SkipCertificateCheck

# Test POST login
$body = @{
    email = "admin@msc-scu.com"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://localhost:7157/api/auth/login" -Method POST -Body $body -ContentType "application/json" -SkipCertificateCheck
```

---

## ✅ Pre-Testing Checklist

Before reporting bugs, verify:
- [ ] Both backend and frontend are running
- [ ] Database migrations are applied
- [ ] Admin user exists in database
- [ ] Browser cache is cleared (Ctrl + Shift + R)
- [ ] No console errors in browser DevTools
- [ ] Latest code is pulled from repository
- [ ] npm packages are installed (`npm install` in msc-webapp)
- [ ] NuGet packages are restored (`dotnet restore` in MSC.WebAPI)

---

## 📝 Reporting Issues

When reporting a bug, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser & version**
5. **Screenshots (if applicable)**
6. **Console errors (F12 → Console tab)**
7. **Network errors (F12 → Network tab)**

---

**Last Updated:** October 9, 2025  
**Phase:** 5 (UI/UX Polish Complete)  
**Testing Type:** Manual Testing

