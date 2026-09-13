# Phase 1 Authentication Progress

Status: authentication implementation validated locally; Phase 1 is NOT complete and release remains blocked.

Update (2026-09-12): the user deferred the remaining backend integrations and requested Phase 2 UI work. See PHASE2_UI_PROGRESS.md for the delivered frontend scope and verification boundaries.

## Implemented

- `AdminUser` inherits `IdentityUser<int>`. `ApplicationDbContext` uses `IdentityUserContext<AdminUser, int>` and retains the existing `AdminUsers` table, integer IDs, and single `AdminRole` field. The enum remains the single role authority; there is no parallel role-membership store.
- `CustomPasswordHasher` verifies legacy BCrypt hashes and requests rehashing. `UserManager` saves an Identity-format replacement on successful login. New and changed passwords use Identity hashing.
- Login uses `SignInManager`, persistent failed-attempt counters, and a 15-minute lockout after five failures. New passwords require at least 12 characters plus Identity's uppercase, lowercase, digit, and non-alphanumeric requirements. No public registration endpoint exists.
- JWTs last one hour. Issuer, audience, signature, algorithm, and expiry are checked. Protected requests also check the persisted account role, security stamp, and lockout state. Deletion and account changes invalidate previous sessions.
- Updating or deleting the last SuperAdmin is rejected inside a serializable database transaction. SQL Server concurrency/deadlock behavior still needs a real SQL Server test.
- Admin creation and password changes use Identity validation. The optional seeder no longer has a default password or prints credentials. Startup never seeds users or migrates the database automatically.
- React uses real login, server-validated session restoration, expiry handling, and logout. It no longer grants a fabricated SuperAdmin session. Axios rejects obsolete sessions on 401, preserves sessions on 403, and avoids clearing a new token in response to an old request.

## Authentication Endpoints

| Method | Route | Access | Behavior |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Anonymous | Email/password login; returns token, email, role, and expiry |
| GET | `/api/auth/session` | Valid admin JWT | Returns verified email, role, and expiry without returning a token |
| POST | `/api/auth/logout` | Valid admin JWT | Rotates the security stamp, revoking all JWT sessions for that administrator |
| GET/POST/PUT/DELETE | `/api/admin/users` and `/{id}` | SuperAdmin | Existing admin-management routes retained |

Local logout clears browser storage immediately. If the server is unreachable, remote revocation cannot be guaranteed; the server token remains valid until expiry or another revocation. The auth provider returns a failure result in that case. Tokens still use localStorage, so preventing XSS and configuring a suitable CSP remain deployment requirements.

## SQL Server Migration

The `AdminIdentity` migration adds Identity metadata and claim/login/token tables without replacing admin IDs, roles, or password hashes. It backfills normalized emails/usernames and security/concurrency stamps and enables lockout for existing admins. Empty emails or normalization collisions stop the migration rather than silently merging accounts.

1. Back up the database and rehearse migration against a disposable SQL Server copy.
2. Review and resolve normalized-email collisions. Non-ASCII legacy emails need verification against Identity's invariant normalization and the database collation.
3. Generate a SQL script with `dotnet ef migrations script InitialCreate AdminIdentity --project MSC.WebAPI` and review it.
4. Apply the reviewed script with the hosting provider's SQL tooling during a controlled deployment, then deploy the matching API build.
5. Verify an existing BCrypt account can log in and that its hash is upgraded. Verify role restrictions and last-admin protection.

The design-time factory uses a placeholder local SQL Server connection solely to enable offline scaffolding. Do not run `dotnet ef database update` expecting it to pick up hosting configuration. Use a reviewed script and a deliberately selected database. Do not put connection passwords in chat or source control.

Rolling back only the code after successful logins is unsafe: the old BCrypt-only implementation cannot verify hashes already upgraded to Identity. Plan rollback with a tested database backup or keep the dual-format hasher.

## IIS / MonsterASP Configuration

The authentication code has no background worker, process-local session store, or runtime file-write requirement. Lockout and revocation survive app-pool recycling because their state is in SQL Server. Keep JWT signing settings stable across recycles and configure them outside source control.

Required settings:

- `ConnectionStrings__DefaultConnection`: the hosting SQL Server connection, including appropriate encryption/certificate settings.
- `Jwt__Key`: a cryptographically random secret of at least 32 bytes; use a secret generator, not a human password.
- `Jwt__Issuer` and `Jwt__Audience`: explicit, stable values shared with the token issuer/validator.
- `Cors__AllowedOrigins__0`, etc.: exact trusted frontend origins when frontend and API are on different origins. Do not allow arbitrary origins.
- `REACT_APP_API_URL`: `/api` for same-origin hosting, or an absolute HTTPS API URL ending in `/api` for separate hosting. CRA embeds this at build time. Check existing ignored `.env` files for stale development-port overrides; the existing HTTPS API launch profile uses port 7064.

Confirm the host has the .NET 8 IIS hosting runtime, HTTPS configuration, and the necessary SQL permissions. Confirm whether React is served by IIS separately or packaged with the API before adding SPA fallback rules. IIS integration is supplied by the ASP.NET Core Web SDK; do not blindly trust arbitrary forwarded headers. Review logging configuration so it does not require an unwritable file sink.

Existing blob-upload endpoints still depend on their original Azure storage settings. They have NOT been redesigned for the new hosting plan. SMTP, certificate storage, and uploaded-image access remain separate open decisions. The `.gitignore` update protects untracked configuration files but does not remove secrets or build outputs that were already tracked; review those separately and rotate any exposed credentials.

## Verification (2026-09-12)

| Check | Result |
| --- | --- |
| Full backend compilation | Passed, zero warnings/errors |
| `dotnet test MSC.WebAPI.Tests/MSC.WebAPI.Tests.csproj` | 18 passed, 0 failed; exit code 0 |
| Focused CRA tests: `AuthContext.test.js`, `apiClient.test.js` | 11 passed, 0 failed; exit code 0 |
| React production build | Passed with existing Footer, Modal, Events, and MemberManagement lint warnings |
| EF SQL script generation | Passed; script was NOT executed |
| EF pending-model check | No pending model changes |
| Test-project NuGet vulnerability scan, including transitives | No vulnerable packages reported by configured sources after replacing the vulnerable SQLite bundle |

Backend HTTP tests run the real middleware/controllers through `WebApplicationFactory` using an isolated in-memory SQLite database. They cover BCrypt rehash persistence, one-hour expiry, lockout, 401/403, last-admin protection, password changes, session restoration/revocation, and rejection of expired JWTs and invalid issuer/audience/signature. SQLite is test-only; production remains SQL Server.

The SQLite dependency scan initially reported GHSA-2m69-gcr7-jv3q in `SQLitePCLRaw.lib.e_sqlite3` 2.1.10. The test project now explicitly uses `SQLitePCLRaw.bundle_e_sqlite3` 3.0.2; tests and the follow-up NuGet scan passed. This scan is not a full application security audit.

Not verified: SQL Server migration execution and concurrent requests, MonsterASP/IIS deployment, browser E2E, SMTP delivery, storage access, or the full legacy CRA test suite. The frontend tests are component/client tests, not browser E2E. These results are not release certification.

## Remaining Phase 1 Work

- Confirm SMTP host, port, TLS mode, sender address, and secret-injection mechanism. Never send SMTP credentials through chat.
- Confirm frontend/API origins for CORS and routing.
- Provide an anonymized Excel header/sample and confirm a required unique member email. Memory-only Excel parsing must also prevent ASP.NET multipart model binding from spilling uploads to disk and enforce upload/decompression/row limits.
- Confirm whether guest certificates require email verification for retrieval. No public student directory or email-based certificate lookup has been introduced.
- Implement admin-only Excel import, persistent one-time OTP challenges, replay-resistant QR attendance, member/guest matching, certificate storage and an authenticated idempotent external-script callback.
- Repair member/event request DTO contracts and add their persistence tests.
- Complete shared-hosting integration checks before enabling live attendance, imports, and certificate workflows. Independent Phase 2 UI work is proceeding at the user's request.