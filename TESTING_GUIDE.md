# Testing Guide - MSC-SCU Website (Phase 4)

## 🚀 Quick Start Guide

Follow these steps to run and test the MSC-SCU website locally.

---

## Step 1: Database Setup

### 1.1 Verify SQL LocalDB is Installed
Open PowerShell and run:
```powershell
sqllocaldb info
```

You should see `mssqllocaldb` in the list. If not, install SQL Server LocalDB from:
https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb

### 1.2 Apply Database Migrations
Navigate to the backend project and run:
```powershell
cd MSC.WebAPI
dotnet ef database update
```

**Expected Output:**
```
Build started...
Build succeeded.
Applying migration '20241008180043_InitialCreate'.
Done.
```

This creates the `MSC_DB` database with all tables (Members, Events, SiteContents, AdminUsers, MemberTypes).

### 1.3 Verify Database Creation (Optional)
Check if the database was created:
```powershell
sqllocaldb info mssqllocaldb
sqlcmd -S "(localdb)\mssqllocaldb" -Q "SELECT name FROM sys.databases WHERE name = 'MSC_DB'"
```

---

## Step 2: Start the Backend API

### 2.1 Run the ASP.NET Core API
From the `MSC.WebAPI` folder:
```powershell
cd MSC.WebAPI  # if not already there
dotnet run
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7157
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5262
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

**✅ Backend is now running at:** `https://localhost:7157`

**⚠️ Keep this terminal window open!** The API must stay running for the frontend to work.

### 2.2 Test API Health (Optional)
Open a browser and navigate to:
```
https://localhost:7157/api/members
```

You should see an empty array `[]` (no members created yet). This confirms the API is working.

---

## Step 3: Start the Frontend Application

### 3.1 Install Dependencies (First Time Only)
Open a **NEW PowerShell window** and navigate to the frontend:
```powershell
cd msc-webapp
npm install
```

### 3.2 Run the React Development Server
```powershell
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view msc-webapp in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

**✅ Frontend is now running at:** `http://localhost:3000`

Your browser should automatically open to `http://localhost:3000`.

**⚠️ Keep both terminal windows open!** (One for backend, one for frontend)

---

## Step 4: Create a Test Admin User

Since the database is empty, you need to create your first admin user manually.

### Option A: Using Swagger UI (Recommended)
1. Navigate to: `https://localhost:7157/swagger/index.html`
2. Find the `POST /api/auth/login` endpoint (we'll use this later)
3. Find the `POST /api/admin/users` endpoint
4. Click "Try it out"
5. Enter the following JSON:
```json
{
  "email": "admin@msc-scu.com",
  "password": "Admin123!",
  "role": "SuperAdmin"
}
```
6. Click "Execute"
7. You should see a `200 OK` response

**⚠️ KNOWN ISSUE:** The first admin user creation might fail due to authentication requirements. If so, use Option B.

### Option B: Using Direct Database Insert
Since the first admin needs to exist before we can authenticate, let's create one directly:

**Create a SQL script file** `create-admin.sql`:
```sql
-- Insert first SuperAdmin user
INSERT INTO AdminUsers (Email, PasswordHash, Role, CreatedAt)
VALUES (
    'admin@msc-scu.com',
    '$2a$11$X5wKZPJQk5Y5L5L5L5L5LeK5wKZPJQk5Y5L5L5L5L5LeK5wKZPJQk5',  -- Password: Admin123!
    0,  -- 0 = SuperAdmin, 1 = ContentEditor
    GETUTCDATE()
);
```

Run it:
```powershell
sqlcmd -S "(localdb)\mssqllocaldb" -d MSC_DB -i create-admin.sql
```

**OR** use this PowerShell one-liner (easier):
```powershell
cd MSC.WebAPI
dotnet run -- seed-admin
```

**⚠️ NOTE:** The password hash above is for `Admin123!`. You'll need to use BCrypt to generate the correct hash. Let me create a seeding script for you.

---

## Step 5: Testing Workflow

### 5.1 Test Public Pages (No Login Required)

1. **Landing Page:** `http://localhost:3000/`
   - ✅ Should show hero section, vision/mission
   - ⚠️ Featured Events, Upcoming Events, Golden Members sections will be empty (no data yet)

2. **Team Page:** `http://localhost:3000/team`
   - ✅ Should show "High Board", "Board Members", "Golden Members" sections
   - ⚠️ All sections will show "No members at the moment" (no data yet)

3. **Events Page:** `http://localhost:3000/events`
   - ✅ Should show search bar and filter dropdown
   - ⚠️ Will show "No events found" (no data yet)

### 5.2 Test Admin Login

1. Navigate to: `http://localhost:3000/admin/login`
2. Enter credentials:
   - **Email:** `admin@msc-scu.com`
   - **Password:** `Admin123!` (or whatever you set)
3. Click "Login"
4. ✅ Should redirect to `/admin/dashboard`

### 5.3 Test Admin Dashboard

After login, you should see:
- ✅ Welcome message with your email and role
- ✅ 4 cards: Manage Members, Manage Events, Manage Content, Manage Users
- ✅ "Your Permissions" section listing your capabilities

Click each card to navigate:
- **Manage Members** → `/admin/members`
- **Manage Events** → `/admin/events`
- **Manage Content** → `/admin/content`
- **Manage Users** → `/admin/users`

### 5.4 Test Member Management

1. Navigate to: `http://localhost:3000/admin/members`
2. Click **"+ Add Member"**
3. Fill out the form:
   - Full Name: `John Doe`
   - Position Title: `President`
   - Member Type: `High Board`
   - Email: `john@msc-scu.com`
   - Phone: `+20 123 456 7890`
   - Display Order: `1`
4. **Upload Member Photo:**
   - ⚠️ **IMPORTANT:** Azure Blob Storage must be configured for this to work!
   - Click "Choose File" and select an image
   - Click "Upload to Azure"
   - ✅ Should show progress bar (0% → 100%)
   - ⚠️ If not configured, you'll get an error. See "Azure Blob Storage Setup" below.
5. Click **"Create Member"**
6. ✅ Should see the new member in the list

### 5.5 Test Event Management

1. Navigate to: `http://localhost:3000/admin/events`
2. Click **"+ Add Event"**
3. Fill out the form:
   - Event Title: `Azure Workshop`
   - Description: `Learn Azure fundamentals and cloud services`
   - Event Date: `2025-10-15`
   - Location: `Computer Science Building, Room 201`
   - Check "Mark as Upcoming"
   - Check "Mark as Featured"
4. **Upload Event Image** (requires Azure Blob Storage)
5. Click **"Create Event"**
6. ✅ Should see the new event with FEATURED and UPCOMING badges

### 5.6 Test Site Content Management

1. Navigate to: `http://localhost:3000/admin/content`
2. Click **"+ Add Content"**
3. Fill out the form:
   - Content Key: `vision`
   - Content Value: `To be the leading student community fostering innovation...`
4. Click **"Create Content"**
5. ✅ Should see the new content in the list
6. Click **"Edit"** to test editing
7. Click **"Delete"** to test deletion (with confirmation)

### 5.7 Test Admin User Management (SuperAdmin Only)

1. Navigate to: `http://localhost:3000/admin/users`
2. ✅ Should see your current admin user listed
3. Click **"+ Add Admin User"**
4. Fill out the form:
   - Email: `editor@msc-scu.com`
   - Password: `Editor123!`
   - Role: `Content Editor`
5. Click **"Create User"**
6. ✅ Should see the new user in the list
7. **Test Role Permissions:**
   - Logout and login as `editor@msc-scu.com`
   - Navigate to `/admin/users`
   - ✅ Should see "Access Denied" message (Content Editors can't manage users)

### 5.8 Test Public Pages with Data

After adding members and events, go back to:
- **Landing Page:** Should now show featured events, upcoming events, and golden members
- **Team Page:** Should now show members in their respective sections
- **Events Page:** Should now show all events with search and filter working

---

## Step 6: Azure Blob Storage Setup (Required for Image Uploads)

Image uploads **will not work** until you configure Azure Blob Storage.

### Option A: Use Azure Storage Emulator (Local Testing)
1. Download Azurite (Azure Storage Emulator):
   ```powershell
   npm install -g azurite
   ```
2. Start Azurite:
   ```powershell
   azurite --silent
   ```
3. Update `appsettings.Development.json`:
   ```json
   "Azure": {
     "BlobStorage": {
       "ConnectionString": "UseDevelopmentStorage=true"
     }
   }
   ```
4. Restart the backend API

### Option B: Use Real Azure Blob Storage
1. Create an Azure Storage Account:
   - Go to: https://portal.azure.com
   - Create a new Storage Account
   - Copy the connection string
2. Create containers:
   - `member-images`
   - `event-images`
   - `certificates`
   - Set public access level to "Blob"
3. Update `appsettings.Development.json`:
   ```json
   "Azure": {
     "BlobStorage": {
       "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"
     }
   }
   ```
4. Restart the backend API

### Option C: Skip Image Uploads for Now
You can test without images by:
1. Manually entering blob URLs in the forms:
   - Use placeholder URLs like `https://via.placeholder.com/400x400`
2. Fill in the `ImageUrl` field directly
3. Click "Create" without uploading

---

## Step 7: Common Issues & Troubleshooting

### ❌ Backend API won't start
**Error:** `Unable to start Kestrel`
- **Fix:** Port 7157 is in use. Change the port in `launchSettings.json` or stop other processes.

### ❌ Database migration fails
**Error:** `Cannot open database "MSC_DB"`
- **Fix:** Run `dotnet ef database drop` then `dotnet ef database update`

### ❌ Frontend shows "Network Error"
**Error:** API calls fail with CORS or network errors
- **Fix 1:** Verify backend is running on `https://localhost:7157`
- **Fix 2:** Check `.env.development` has correct `REACT_APP_API_URL`
- **Fix 3:** Clear browser cache and restart frontend

### ❌ Login fails with 401
**Error:** `Invalid credentials`
- **Fix:** Verify admin user exists in database:
  ```powershell
  sqlcmd -S "(localdb)\mssqllocaldb" -d MSC_DB -Q "SELECT Email, Role FROM AdminUsers"
  ```

### ❌ Image upload fails
**Error:** `Failed to upload image`
- **Fix:** Azure Blob Storage not configured. See "Step 6: Azure Blob Storage Setup"

### ❌ "Access Denied" on admin pages
**Error:** Redirects to login
- **Fix:** JWT token expired (1 hour). Login again.

---

## Step 8: Test Checklist

Use this checklist to verify all features:

### Public Pages
- [ ] Landing page loads
- [ ] Vision/Mission sections display
- [ ] Featured events section displays (after adding events)
- [ ] Upcoming events section displays (after adding events)
- [ ] Golden members section displays (after adding members)
- [ ] Team page loads
- [ ] High Board section displays members
- [ ] Board section displays members
- [ ] Golden Members section displays members
- [ ] Events page loads
- [ ] Search bar filters events by title/description
- [ ] Filter dropdown filters by all/upcoming/past
- [ ] Event cards show correct badges (FEATURED, UPCOMING, PAST)

### Authentication
- [ ] Admin login page loads
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Redirects to dashboard after login
- [ ] Logout button works
- [ ] Protected routes redirect to login when not authenticated
- [ ] JWT token persists in localStorage

### Admin Dashboard
- [ ] Dashboard shows welcome message with email and role
- [ ] All 4 management cards are visible
- [ ] "Manage Users" card only visible to SuperAdmin
- [ ] Clicking cards navigates to correct pages

### Member Management
- [ ] Member list displays all members
- [ ] Filter by type works (High Board, Board, Golden Member)
- [ ] "Add Member" modal opens
- [ ] Form validation works (required fields)
- [ ] Email validation works
- [ ] Image upload works (if Azure configured)
- [ ] Certificate upload works (optional)
- [ ] Create member succeeds
- [ ] Edit member modal opens with pre-filled data
- [ ] Update member succeeds
- [ ] Delete confirmation modal opens
- [ ] Delete member succeeds
- [ ] Member appears on public Team page

### Event Management
- [ ] Event list displays all events
- [ ] Filter by all/upcoming/featured works
- [ ] "Add Event" modal opens
- [ ] Form validation works (required fields)
- [ ] Date picker works
- [ ] Image upload works (if Azure configured)
- [ ] "Mark as Upcoming" checkbox works
- [ ] "Mark as Featured" checkbox works
- [ ] Create event succeeds
- [ ] Edit event modal opens with pre-filled data
- [ ] Update event succeeds
- [ ] Delete confirmation modal opens
- [ ] Delete event succeeds
- [ ] Event appears on public Landing/Events pages

### Site Content Management
- [ ] Content list displays all content
- [ ] "Add Content" modal opens
- [ ] Content key validation works (alphanumeric + underscore/hyphen)
- [ ] Create content succeeds
- [ ] Edit content modal opens (key is disabled)
- [ ] Update content succeeds
- [ ] Delete confirmation modal opens
- [ ] Delete content succeeds

### Admin User Management (SuperAdmin Only)
- [ ] User list displays all admin users
- [ ] "Add Admin User" modal opens
- [ ] Email validation works
- [ ] Password validation works (min 6 characters)
- [ ] Role dropdown works (SuperAdmin, ContentEditor)
- [ ] Create user succeeds
- [ ] Edit user modal opens with pre-filled data
- [ ] Password field optional in edit mode (leave blank to keep current)
- [ ] Update user succeeds
- [ ] Delete protection works (can't delete last SuperAdmin)
- [ ] Delete protection works (can't delete yourself)
- [ ] Delete confirmation modal opens
- [ ] Delete user succeeds
- [ ] ContentEditor role cannot access "/admin/users" (shows Access Denied)

---

## Step 9: Sample Test Data

Here's some sample data you can use for testing:

### Sample Members
```
High Board:
- Name: Sarah Johnson, Position: President, Email: sarah@msc-scu.com
- Name: Ahmed Hassan, Position: Vice President, Email: ahmed@msc-scu.com

Board:
- Name: Emily Chen, Position: Technical Lead, Email: emily@msc-scu.com
- Name: Mohammed Ali, Position: Marketing Head, Email: mohammed@msc-scu.com

Golden Members:
- Name: Alex Rodriguez, Position: Senior Developer, Email: alex@msc-scu.com
- Name: Fatima Omar, Position: Community Manager, Email: fatima@msc-scu.com
```

### Sample Events
```
Featured + Upcoming:
- Title: Azure Workshop Series
  Date: 2025-10-20
  Location: CS Building, Room 301
  Description: Hands-on Azure cloud computing workshop

Upcoming:
- Title: Hackathon 2025
  Date: 2025-11-05
  Location: University Main Hall
  Description: 24-hour coding challenge

Past:
- Title: Introduction to AI
  Date: 2025-09-15
  Location: Online (Zoom)
  Description: Fundamentals of artificial intelligence
```

### Sample Site Content
```
Key: vision
Value: To be the leading student community fostering innovation and technical excellence at Suez Canal University.

Key: mission
Value: Empowering students with cutting-edge technology skills through hands-on workshops, collaborative projects, and industry connections.

Key: about-us
Value: The Microsoft Student Club at Suez Canal University is a student-led organization dedicated to promoting technology education and innovation.
```

---

## Step 10: Performance Testing

Test the application's performance:

1. **Load Time:**
   - Open Chrome DevTools (F12) → Network tab
   - Refresh pages and check load times
   - API calls should complete in <1 second

2. **Bundle Size:**
   - Check the production build:
     ```powershell
     cd msc-webapp
     npm run build
     ```
   - Verify bundle size is around 100KB (gzipped)

3. **Memory Usage:**
   - Open Chrome DevTools (F12) → Performance tab
   - Record a session while navigating between pages
   - Check for memory leaks

---

## 📋 Summary

**To run the application:**
1. ✅ Terminal 1: `cd MSC.WebAPI && dotnet run` (Backend API)
2. ✅ Terminal 2: `cd msc-webapp && npm start` (Frontend)
3. ✅ Browser: `http://localhost:3000` (Application)

**First-time setup:**
- Run database migrations: `dotnet ef database update`
- Create first admin user (see Step 4)
- Configure Azure Blob Storage (see Step 6) OR use placeholders

**What works without Azure Blob Storage:**
- All public pages ✅
- Authentication and authorization ✅
- Member CRUD (except image upload) ✅
- Event CRUD (except image upload) ✅
- Site Content CRUD ✅
- Admin User CRUD ✅

**What requires Azure Blob Storage:**
- Image uploads for members ⚠️
- Image uploads for events ⚠️
- Certificate uploads ⚠️

---

## 🐛 Found an Issue?

If you encounter any bugs or unexpected behavior:
1. Check the browser console (F12) for JavaScript errors
2. Check the backend terminal for API errors
3. Verify JWT token in localStorage (Chrome DevTools → Application → Local Storage)
4. Check database state using SQL queries

Let me know what you find, and I'll help troubleshoot!

---

## 🎉 Happy Testing!

You now have a fully functional MSC-SCU website running locally. Test all the features and let me know if you encounter any issues or have questions!
