# Sample Data Seeding Instructions

## ✅ Sample Data Created Successfully!

I've created a comprehensive sample data seeder with the events you requested and additional members for testing.

---

## 🎯 What Gets Seeded

### **Events (8 Total)**

#### Featured & Upcoming:
1. **Tech Summit 2025** (Dec 15, 2025)
   - Full-day conference with Microsoft speakers
   - Featured ✅ | Upcoming ✅

2. **Game Development Hackathon** (Nov 8, 2025)
   - 48-hour hackathon with Unity/Unreal Engine
   - Featured ✅ | Upcoming ✅

#### Featured & Past:
3. **Azure AI Bootcamp** (Apr 20, 2025)
   - Three-day intensive bootcamp with certificates
   - Featured ✅ | Past Event

#### Upcoming Only:
4. **Cloud Computing Workshop** (Nov 22, 2025)
5. **Introduction to DevOps** (Nov 30, 2025)
6. **Mobile App Development with React Native** (Dec 5, 2025)

#### Past Events:
7. **Web Development Basics** (Mar 10, 2025)
8. **Cybersecurity Essentials** (Feb 15, 2025)

All events include:
- Professional Unsplash images (cloud, AI, gaming, technology themes)
- Realistic descriptions
- Proper dates and flags

---

### **Members (13 Total)**

#### High Board (3):
- Sarah Johnson (President)
- Michael Chen (Vice President)
- Emily Rodriguez (Secretary)

#### Board (4):
- David Kim (Technical Lead)
- Jessica Thompson (Events Coordinator)
- Ahmed Al-Rashid (Marketing Director)
- Maria Garcia (Community Manager)

#### Golden Members (6):
- Robert Anderson (Alumni - Software Engineer at Microsoft)
- Lisa Nguyen (Alumni - Cloud Architect at Azure)
- James Patterson (Alumni - AI Researcher)
- Sophia Williams (Alumni - Data Scientist at Google)
- Daniel Lee (Alumni - DevOps Engineer)
- Olivia Brown (Alumni - Product Manager at Microsoft)

All members include:
- Avatar placeholders using UI Avatars API
- Color-coded avatars (blue for High Board, navy for Board, gold for Golden Members)
- Professional position titles

---

### **Site Content (6 Entries)**

- Hero title and subtitle
- Vision title and description
- Mission title and description

---

## 🚀 How to Seed the Data

### **Important: Stop the Backend Server First!**

The backend API is currently running (from QuickStart.ps1). You need to stop it before seeding:

1. **Find the PowerShell window** running the backend (titled "MSC Backend API")
2. **Press Ctrl + C** to stop the server
3. **Wait for it to fully shut down** (5-10 seconds)

### **Option 1: Run the SeedSampleData Script (Recommended)**

```powershell
.\SeedSampleData.ps1
```

This script will:
- Check if you want to proceed
- Run the data seeder
- Show you what was created
- Provide next steps

### **Option 2: Manual Command**

```powershell
cd MSC.WebAPI
dotnet run seed-data
```

### **Option 3: Re-run QuickStart (Easiest)**

```powershell
.\QuickStart.ps1
```

When prompted "Do you want to add sample members and events for testing? (Y/n)", answer **Y**.

---

## ✅ Verification

After seeding, you'll see output like:

```
========================================
  Seeding Sample Data
========================================

⏭️  Member types already exist. Skipping...
✅ Created 13 sample members:
   - 3 High Board
   - 4 Board
   - 6 Golden Members
✅ Created 8 sample events:
   - 5 Upcoming
   - 3 Past
   - 3 Featured
✅ Created 6 site content entries

========================================
  ✅ Sample Data Seeded Successfully!
========================================
```

---

## 🌐 Testing the Data

### **View Events:**
1. Navigate to http://localhost:3000
2. **Featured Events section** should show:
   - Tech Summit 2025
   - Game Development Hackathon
   - Azure AI Bootcamp
3. **Upcoming Events section** should show all upcoming events

### **View Members:**
1. Navigate to http://localhost:3000/team
2. Should see all 13 members organized by type
3. **Golden Members (6)** should appear in the Landing page "Team Preview"

### **Admin Panel:**
1. Login: admin@msc-scu.com / Admin123!
2. Go to **Member Management** to see all 13 members
3. Go to **Event Management** to see all 8 events
4. You can edit, delete, or add more test data

---

## 🔄 Reset Data (If Needed)

If you want to reset and re-seed:

```powershell
cd MSC.WebAPI
dotnet ef database drop -f
dotnet ef database update
dotnet run seed-admin
dotnet run seed-data
```

---

## 📸 Sample Images

All images are from **Unsplash** (free, high-quality stock photos):

- **Tech Summit**: Conference/technology image
- **Game Dev Hackathon**: People gaming/coding
- **Azure AI Bootcamp**: AI/ML technology
- **Cloud Workshop**: Cloud/technology
- **Mobile Dev**: Mobile devices
- **Cybersecurity**: Security/lock imagery
- **Web Dev**: Computer with code
- **DevOps**: Containers/infrastructure

Member avatars use **UI Avatars API** with color-coded backgrounds.

---

## ✨ Next Steps

1. **Stop the backend server** (if running)
2. **Run the seeder** using one of the methods above
3. **Restart the application** (QuickStart.ps1 or manually)
4. **Test all Phase 5 UI features** with real data!
5. **Explore the admin panel** to manage the sample data

---

**Created:** October 9, 2025  
**Phase:** 5 (UI/UX Polish) - Testing with Sample Data  
**Status:** Ready to seed! 🚀

