# GitHub Copilot Instructions - MSC-SCU Website

## Project Overview

This is a **Microsoft Student Club (SCU) website** built with a decoupled architecture:
- **Frontend**: React SPA with client-side routing
- **Backend**: ASP.NET Core Web API (RESTful)
- **Database**: Azure SQL Database with Entity Framework Core
- **Hosting**: Microsoft Azure (App Services)

## Architecture & Project Structure

### Expected Solution Layout
```
/
├── MSC.WebAPI/          # ASP.NET Core Web API project
│   ├── Controllers/     # API endpoints
│   ├── Models/          # Entity classes (Member, Event, etc.)
│   ├── Data/            # DbContext and migrations
│   └── appsettings.json # Connection strings
├── MSC.WebApp/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   └── services/    # API client utilities
│   └── package.json
└── MSC.sln              # Visual Studio solution file
```

### Data Flow
1. React app makes HTTP requests to `/api/*` endpoints
2. ASP.NET Core controllers validate & process requests
3. Entity Framework Core handles database operations
4. Responses return as JSON to the frontend

## Database Schema

### Core Entities (use these exact names)
- **`Members`**: `Id`, `FullName`, `PositionTitle`, `ImageUrl`, `CertificateUrl` (nullable), `MemberTypeId` (FK), `DisplayOrder`
- **`MemberTypes`**: `Id`, `TypeName` (e.g., "High Board", "Board", "Golden Member")
- **`Events`**: `Id`, `Title`, `Description`, `EventDate`, `IsUpcoming`, `IsFeatured`, `ImageUrl`
- **`SiteContent`**: `Id`, `ContentKey`, `ContentValue` (key-value store for editable text)

### Relationships
- `Members.MemberTypeId` → `MemberTypes.Id` (many-to-one)

## API Endpoint Conventions

### Public Endpoints (no auth required)
```
GET /api/members
GET /api/members/{id}
GET /api/members/type/{typeName}
GET /api/events
GET /api/events/upcoming
GET /api/events/featured
```

### Admin Endpoints (JWT required)
```
POST /api/members
PUT /api/members/{id}
DELETE /api/members/{id}
POST /api/events
PUT /api/events/{id}
DELETE /api/events/{id}
POST /api/auth/login
```

**Important**: All CUD (Create, Update, Delete) operations must be secured with ASP.NET Core Identity + JWT authentication.

## Frontend Guidelines

### Brand Color Palette (use these exact hex codes)
- **Primary Action**: `#0078d4` (buttons, links)
- **Backgrounds**: `#ffffff` (white), `#f2f2f2` (light gray section dividers)
- **Text**: `#2e2e2e` (body text), `#ffffff` (on dark backgrounds)
- **Navbar/Footer**: `#203a6c` (dark blue)
- **Accents/Hover**: `#50e6ff` (light blue)

### Component Structure
- Build reusable components: `Button`, `Card`, `Navbar`, `Footer`
- Use React Router for client-side navigation
- Fetch data via API service utilities (e.g., `apiClient.js`)

### Key Pages
1. **Landing Page**: Hero, Vision/Mission, Events (featured + upcoming), Team (Golden Members carousel)
2. **All Events Page**: List all events with filtering
3. **All Members Page**: Display by type (High Board, Board, Golden Members)
4. **Admin Dashboard**: Login + CRUD interfaces for Members and Events

## Development Workflows

### Backend Setup (First Time)
```powershell
# Install EF Core tools
dotnet tool install --global dotnet-ef

# Create initial migration
cd MSC.WebAPI
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Running Locally
```powershell
# Backend (run from MSC.WebAPI/)
dotnet run

# Frontend (run from MSC.WebApp/)
npm install
npm start
```

### Database Migrations
After modifying entity classes:
```powershell
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

## Azure Deployment Checklist

1. **Azure SQL Database**: Provision instance and update connection string in `appsettings.json`
2. **App Services**: Create two App Services (one for API, one for React build)
3. **CORS Configuration**: Backend must allow requests from frontend URL
4. **Environment Variables**: Store connection strings and JWT secrets in Azure App Service configuration

## Testing Strategy

### Backend
- **Unit Tests**: Use xUnit for service logic (e.g., filtering members by type)
- **Integration Tests**: Use `WebApplicationFactory` to test API endpoints with in-memory database
- **Auth Tests**: Verify 401 errors on secured endpoints without valid JWT

### Frontend
- **E2E Tests**: Use Cypress or Playwright to simulate user flows (e.g., navigate to events, verify data loads)
- **Admin Panel E2E**: Test login → create member → verify member appears on public site

## Critical Patterns

### Entity Framework Configuration
- Use **Code First** approach with Fluent API in `OnModelCreating` for complex relationships
- Always include `.AsNoTracking()` for read-only queries to improve performance

### API Response Format
Return consistent JSON structures:
```csharp
// Success
return Ok(data);

// Not Found
return NotFound(new { message = "Resource not found" });

// Bad Request
return BadRequest(new { errors = validationErrors });
```

### Frontend API Error Handling
Always handle network errors and display user-friendly messages:
```javascript
try {
  const response = await fetch('/api/members');
  if (!response.ok) throw new Error('Failed to fetch members');
  const data = await response.json();
} catch (error) {
  console.error(error);
  // Show error UI
}
```

## Phase-Based Development

**Current Phase**: Foundation (Phase 1)
- Focus on setting up ASP.NET Core Web API and Azure SQL Database
- Create entity models and initial migrations
- Establish project structure before implementing endpoints

**Next Phases**: Follow the sprint plan in README.md
