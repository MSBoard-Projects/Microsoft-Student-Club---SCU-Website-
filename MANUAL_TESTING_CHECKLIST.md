# Manual Testing Checklist - Phase 5 UI/UX Polish

## 🚀 Getting Started

### Launch Application
Run the QuickStart script from the project root:
```powershell
.\QuickStart.ps1
```

**Expected Behavior:**
- ✅ Script checks prerequisites (.NET, Node.js, SQL LocalDB)
- ✅ Creates/updates database with migrations
- ✅ Offers to create admin user (admin@msc-scu.com / Admin123!)
- ✅ Installs npm dependencies if needed
- ✅ Launches backend API (https://localhost:7157)
- ✅ Launches frontend app (http://localhost:3000)
- ✅ Browser opens automatically to http://localhost:3000

---

## 📱 Frontend Testing Checklist

### 1. **Landing Page - Initial Load** ⬜
**URL:** http://localhost:3000

**Visual Checks:**
- [ ] Page fades in smoothly (PageTransition animation)
- [ ] Hero section displays vibrant gradient background (navy → blue → cyan)
- [ ] Two animated background circles pulse in hero section
- [ ] Hero text is large and bold (6xl/7xl font size)
- [ ] "Explore Our Mission" button has hover scale effect
- [ ] Page loads without console errors (check DevTools F12)

**Performance:**
- [ ] Skeleton cards appear during data loading (if backend is slow)
- [ ] Images load with lazy loading (check Network tab)
- [ ] Smooth scrolling works when clicking links

---

### 2. **Landing Page - Vision/Mission Section** ⬜

**Visual Checks:**
- [ ] Vision card has FaRocket icon in blue circle
- [ ] Mission card has FaLightbulb icon in blue circle
- [ ] Cards have subtle hover shadow effect (hover:shadow-2xl)
- [ ] Text is readable with proper spacing
- [ ] Cards animate in from left/right (slideInLeft/slideInRight)

---

### 3. **Landing Page - Featured Events** ⬜

**Visual Checks:**
- [ ] Section title "Featured Events" with FaCalendarAlt icon
- [ ] Event cards display with rounded corners (rounded-xl)
- [ ] "🌟 FEATURED" badge has gradient styling
- [ ] Event images are larger (h-56) with hover scale effect
- [ ] Calendar icon (FaCalendar) appears next to date
- [ ] Location icon (FaMapMarkerAlt) appears next to location
- [ ] Cards animate in with staggered delays

**Data Checks:**
- [ ] If no featured events, "No featured events available" message shows
- [ ] Event details display correctly (title, date, description)

---

### 4. **Landing Page - Upcoming Events** ⬜

**Visual Checks:**
- [ ] Section title "Upcoming Events"
- [ ] "🎯 UPCOMING" badge on each card
- [ ] Same visual enhancements as Featured Events
- [ ] Cards animate with staggered delays
- [ ] Hover effects work on images and titles

**Data Checks:**
- [ ] If no upcoming events, "No upcoming events scheduled" message shows

---

### 5. **Landing Page - Golden Members (Team Preview)** ⬜

**Visual Checks:**
- [ ] Section title with FaUsers icon
- [ ] Member avatars are larger (w-36 h-36)
- [ ] Gradient fallback initials display for members without images
- [ ] Member names display below avatars
- [ ] "View Full Team" button with FaArrowRight icon
- [ ] Avatar hover scale effect (group-hover:scale-110)
- [ ] Cards have gradient border (border-[#50e6ff])

**Data Checks:**
- [ ] Only Golden Members display (max 6)
- [ ] If no Golden Members, shows "Meet our accomplished members" message

---

### 6. **Navigation Bar - Desktop** ⬜
**Viewport:** Resize browser to >768px width

**Visual Checks:**
- [ ] Navbar is sticky at top (sticky top-0)
- [ ] Logo displays: Gradient "M" circle + "MSC / SCU" text
- [ ] Navigation links: Home, Events, Team, Admin
- [ ] Active route has underline indicator
- [ ] Admin button styled as rounded pill
- [ ] Navbar background is navy (#203a6c)

**Interaction:**
- [ ] Clicking links navigates correctly
- [ ] Active route updates underline indicator

---

### 7. **Navigation Bar - Mobile** ⬜
**Viewport:** Resize browser to <768px width (e.g., 375px)

**Visual Checks:**
- [ ] Hamburger icon (☰) displays on right side
- [ ] Logo remains visible on left
- [ ] Navbar stays sticky on scroll

**Interaction:**
- [ ] Clicking hamburger opens mobile menu with fadeIn animation
- [ ] Menu icon changes to X (close icon)
- [ ] Mobile menu displays vertically
- [ ] Clicking any link closes mobile menu automatically
- [ ] Clicking X closes mobile menu

---

### 8. **Footer Section** ⬜

**Visual Checks:**
- [ ] Footer background is navy (#203a6c)
- [ ] Social media icons display (Facebook, Instagram, LinkedIn)
- [ ] "Quick Links" section visible
- [ ] Copyright text displays with current year

---

### 9. **All Events Page** ⬜
**URL:** http://localhost:3000/events

**Visual Checks:**
- [ ] Page fades in with PageTransition
- [ ] Page title "All Events" displays
- [ ] Filter buttons: All, Featured, Upcoming
- [ ] Event cards maintain Phase 5 styling (gradients, icons)

**Interaction:**
- [ ] Clicking "Featured" shows only featured events
- [ ] Clicking "Upcoming" shows only upcoming events
- [ ] Clicking "All" shows all events
- [ ] Active filter button has blue background

**Data Checks:**
- [ ] If no events match filter, "No events found" message displays

---

### 10. **All Members Page** ⬜
**URL:** http://localhost:3000/team

**Visual Checks:**
- [ ] Page fades in with PageTransition
- [ ] Page title "Our Team" displays
- [ ] Members grouped by type (High Board, Board, Golden Members)
- [ ] Member cards maintain Phase 5 styling (larger avatars, gradients)
- [ ] Gradient fallback avatars for missing images

**Data Checks:**
- [ ] Members correctly grouped by MemberType
- [ ] Position titles display below names
- [ ] If no members in a type, section still displays with message

---

### 11. **Admin Login** ⬜
**URL:** http://localhost:3000/admin

**Visual Checks:**
- [ ] Login form displays centered
- [ ] "Admin Login" title visible
- [ ] Email and Password inputs have enhanced styling
- [ ] Login button styled with primary blue

**Interaction - Error Validation:**
- [ ] Submit empty form → Red error icons appear in inputs
- [ ] Error messages animate in with fadeIn
- [ ] Enter invalid email → Red border + error icon
- [ ] Enter short password → Red border + error icon

**Interaction - Successful Login:**
- [ ] Enter valid credentials (admin@msc-scu.com / Admin123!)
- [ ] Submit form
- [ ] Toast notification appears: "✅ Login successful!"
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Redirects to Admin Dashboard

**Interaction - Failed Login:**
- [ ] Enter wrong credentials
- [ ] Submit form
- [ ] Toast notification appears: "❌ Invalid credentials"
- [ ] Stays on login page

---

### 12. **Admin Dashboard** ⬜
**URL:** http://localhost:3000/admin (after login)

**Visual Checks:**
- [ ] Page fades in with PageTransition
- [ ] Header has gradient background (navy → blue)
- [ ] Welcome message displays: "Welcome, [email]"
- [ ] Role badge displays: "SuperAdmin" or "Content Editor"
- [ ] Logout button with FaSignOutAlt icon (red hover)

**Management Cards:**
- [ ] "Manage Members" card with blue gradient icon (FaUsers)
- [ ] "Manage Events" card with green gradient icon (FaCalendarAlt)
- [ ] "Manage Site Content" card with purple gradient icon (FaFileAlt)
- [ ] "Manage Admin Users" card (only for SuperAdmin) with cyan gradient
- [ ] All cards animate in with staggered delays (100ms, 200ms, 300ms, 400ms)
- [ ] Cards have hover lift effect (card-hover class)

**Permissions Section:**
- [ ] "Your Permissions" heading displays
- [ ] Each permission has green checkmark icon (FaCheckCircle)
- [ ] Permissions list correct based on role:
  - **SuperAdmin:** All permissions
  - **Content Editor:** Limited permissions (no user management)

**Interaction:**
- [ ] Clicking "Manage Members" navigates to /admin/members
- [ ] Clicking "Manage Events" navigates to /admin/events
- [ ] Clicking "Manage Site Content" navigates to /admin/content
- [ ] Clicking "Manage Admin Users" (SuperAdmin only) navigates to /admin/users
- [ ] Clicking "Logout" logs out and redirects to home

---

### 13. **Member Management Page** ⬜
**URL:** http://localhost:3000/admin/members (requires login)

**Visual Checks:**
- [ ] Page title "Member Management" displays
- [ ] "Add New Member" button visible
- [ ] Members table/cards display existing members

**Create Member Flow:**
1. [ ] Click "Add New Member" button
2. [ ] Modal opens with form (fadeIn animation)
3. [ ] Fill in all fields:
   - Full Name: "Test Member"
   - Position Title: "Test Position"
   - Member Type: Select "Board"
   - Display Order: 1
4. [ ] **Validation Icons Test:**
   - [ ] Valid input shows green border + green checkmark
   - [ ] Invalid input shows red border + red exclamation
5. [ ] Click "Create Member"
6. [ ] **Toast notification appears:** "✅ Member created successfully!"
7. [ ] Toast auto-dismisses after 3 seconds
8. [ ] Modal closes automatically
9. [ ] New member appears in members list

**Edit Member Flow:**
1. [ ] Click "Edit" button on existing member
2. [ ] Modal opens with pre-filled form
3. [ ] Change "Position Title" to "Updated Position"
4. [ ] Click "Update Member"
5. [ ] **Toast notification appears:** "✅ Member updated successfully!"
6. [ ] Modal closes
7. [ ] Member list updates with new position

**Delete Member Flow:**
1. [ ] Click "Delete" button on test member
2. [ ] Confirmation modal appears
3. [ ] Click "Confirm Delete"
4. [ ] **Toast notification appears:** "✅ [Member Name] deleted successfully!"
5. [ ] Member removed from list

**Error Handling:**
1. [ ] Try to create member with missing required fields
2. [ ] Click "Create Member"
3. [ ] **Toast notification appears:** "Please fix the errors in the form"
4. [ ] Form shows validation errors with red icons

---

### 14. **Smooth Scrolling & Custom Scrollbar** ⬜

**Scrolling Test:**
- [ ] Navigate to Landing page
- [ ] Scroll down slowly
- [ ] Scrolling is smooth (not instant jumps)
- [ ] Custom scrollbar visible on right edge (if content overflows)

**Scrollbar Visual:**
- [ ] Scrollbar width: 10px
- [ ] Scrollbar thumb: Gray, rounded
- [ ] Scrollbar track: Light gray background
- [ ] Hover on scrollbar thumb: Darkens to #555

---

### 15. **Accessibility Testing** ⬜

**Keyboard Navigation:**
- [ ] Press Tab key repeatedly
- [ ] All interactive elements receive focus (buttons, links, inputs)
- [ ] Focus indicator visible (2px blue outline with 2px offset)
- [ ] Can navigate entire site using only keyboard
- [ ] Enter key activates focused buttons

**Screen Reader (Optional):**
- [ ] Enable screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] All images have alt text descriptions
- [ ] Buttons have descriptive aria-labels
- [ ] Form inputs have associated labels

---

### 16. **Responsive Design Testing** ⬜

**Test Multiple Viewports:**

**Mobile (375px width):**
- [ ] Hamburger menu works
- [ ] Content stacks vertically
- [ ] Cards are full width
- [ ] Text remains readable
- [ ] Images scale properly

**Tablet (768px width):**
- [ ] Navigation switches to desktop mode
- [ ] Cards display in 2-column grid
- [ ] Typography scales appropriately

**Desktop (1280px+ width):**
- [ ] Full horizontal navigation
- [ ] Cards display in 3-column grid
- [ ] Hero text at largest size (text-7xl)
- [ ] Content centered with max-width container

---

### 17. **Performance Testing (Chrome DevTools)** ⬜

**Lighthouse Audit:**
1. [ ] Open Chrome DevTools (F12)
2. [ ] Navigate to "Lighthouse" tab
3. [ ] Select "Desktop" mode
4. [ ] Click "Analyze page load"
5. [ ] **Expected Scores:**
   - Performance: >85
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >80

**Network Performance:**
1. [ ] Open DevTools → Network tab
2. [ ] Refresh Landing page
3. [ ] Check "Size" column:
   - [ ] Main JS bundle: ~154 KB (gzipped)
   - [ ] Main CSS: ~8.65 KB (gzipped)
4. [ ] Images load only when scrolled into view (lazy loading)

---

### 18. **Browser Compatibility** ⬜

**Test in Multiple Browsers:**
- [ ] **Chrome/Edge** (Chromium): All features work
- [ ] **Firefox**: All features work
- [ ] **Safari** (if available): All features work

**Check for:**
- [ ] Animations render smoothly
- [ ] Gradients display correctly
- [ ] Toast notifications appear
- [ ] Form validation works

---

## 🔙 Backend Testing Checklist

### 1. **API Health Check** ⬜
**URL:** https://localhost:7157 (or check terminal output)

**Expected:**
- [ ] Backend terminal shows "Now listening on: https://localhost:7157"
- [ ] No error messages in terminal
- [ ] Serilog logging displays (Information level)

---

### 2. **Database Verification** ⬜

**Check Database Creation:**
1. [ ] Open SQL Server Management Studio or Azure Data Studio
2. [ ] Connect to `(localdb)\mssqllocaldb`
3. [ ] Verify database `MSC_DB` exists
4. [ ] Expand tables and verify:
   - [ ] AdminUsers
   - [ ] Events
   - [ ] Members
   - [ ] MemberTypes
   - [ ] SiteContent

**Check Admin User:**
1. [ ] Query: `SELECT * FROM AdminUsers`
2. [ ] Verify admin@msc-scu.com exists
3. [ ] Role should be "SuperAdmin"

---

### 3. **API Endpoints** ⬜

**Test Public Endpoints (no auth):**

Using browser or Postman:

1. **GET https://localhost:7157/api/members**
   - [ ] Returns array of members (or empty array)
   - [ ] Status: 200 OK

2. **GET https://localhost:7157/api/events**
   - [ ] Returns array of events (or empty array)
   - [ ] Status: 200 OK

3. **GET https://localhost:7157/api/members/type/Board**
   - [ ] Returns members filtered by type
   - [ ] Status: 200 OK

**Test Authentication:**

4. **POST https://localhost:7157/api/auth/login**
   - Body:
     ```json
     {
       "email": "admin@msc-scu.com",
       "password": "Admin123!"
     }
     ```
   - [ ] Status: 200 OK
   - [ ] Returns JWT token and user details

5. **POST https://localhost:7157/api/auth/login** (wrong password)
   - Body:
     ```json
     {
       "email": "admin@msc-scu.com",
       "password": "WrongPassword"
     }
     ```
   - [ ] Status: 401 Unauthorized

---

## 🐛 Known Issues / Limitations

### Expected Warnings (Non-Critical):
- [ ] **Footer.js**: 3 lint warnings for `href="#"` placeholders (social media links)
- [ ] **Modal.js**: 1 lint warning for unused `Button` import
- [ ] **Events.js**: 1 lint warning for useEffect dependency
- [ ] **MemberManagement.js**: 1 lint warning for unused `setMemberTypes` variable

### Known Limitations:
- [ ] **Azure Blob Storage not configured**: Image uploads will fail until connection string is added
- [ ] **No sample data**: Database starts empty (need to manually create members/events via admin panel)
- [ ] **Placeholder social links**: Footer social media links point to "#"

---

## ✅ Test Summary

### Overall Test Results:
- **Total Tests Passed:** ____ / 18 sections
- **Critical Issues Found:** ____
- **Minor Issues Found:** ____
- **Performance:** ✅ / ⚠️ / ❌
- **Accessibility:** ✅ / ⚠️ / ❌
- **Responsive Design:** ✅ / ⚠️ / ❌

### Recommendations:
1. ✅ Ready for Phase 6 (Automated Testing)
2. ✅ Ready for Phase 7 (Azure Deployment)
3. ⚠️ Minor fixes needed (list issues)
4. ❌ Major fixes required (list issues)

---

## 📝 Feedback Template

**What worked well:**
- 
- 
- 

**What needs improvement:**
- 
- 
- 

**Bugs/Issues found:**
1. 
2. 
3. 

**Feature requests:**
1. 
2. 
3. 

---

**Testing Date:** __________  
**Tested By:** __________  
**Browser(s) Used:** __________  
**Screen Size(s) Tested:** __________

