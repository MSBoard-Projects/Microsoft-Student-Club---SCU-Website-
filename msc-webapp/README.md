# MSC-SCU Frontend (React SPA)

This is the React frontend for the Microsoft Student Club - Suez Canal University website.

## Glass Frontend

The public home, events, people and achievements experiences use strict TypeScript, React 19, Tailwind utilities, scoped CSS design tokens, and Framer Motion. The admin workspace keeps its existing styling. Both local preview and a validated API-backed content mode are supported. Persistence code, authenticated administration, tests and a database migration are prepared; no migration has been applied to a live database and no production deployment was performed.

### Current Layout And Identity Checks

After the grouped-logo, canonical-member and five-portrait updates: 64 tests passed across PublicExperience, CommunityFeatures, MemberDirectory and Events, together with strict TypeScript and scoped editor diagnostics. Headless Edge verified all five new portraits in profiles and leadership, the old-ID redirect, matching Golden name/role/image and search, 20 decoded logo assets, 11/5 accessible strip images, opposite movement, pause and reduced motion. Home and leadership had no horizontal overflow at 320, 390, 768, 1440 and 1920px. Desktop/mobile screenshots were inspected; no browser runtime errors were reported. No production build, live database update or deployment was performed for this change.

### Architecture

```text
App
	PublicThemeProvider              persisted night / day / forest choice
		ShowcaseProvider               local preview or shared API snapshot
		SiteFrame                      scoped theme tokens; excludes admin paths
			PublicHeader                 desktop/mobile navigation and theme controls
			ClubLanding
				HeroSection                headline, parallax photo, logo, photo selector
				SupporterPrograms          Microsoft and GitHub program relationships
				UpcomingEvent              precision-aware schedule and countdown
				Club story                 About, Goals, Vision and Mission
				EventGrid -> EventDetails   upcoming/past events, dates and galleries
				StatisticsBanner           four viewport-triggered counters
				CommunityMoments           two opposing photo rows with pause and keyboard access
				HighBoardSection           prominent president and optional public contact icons
				RecurringGoldenSection     nine recurring workbook honourees
				SupporterWall compact      opposing Logos 1 / Logos 2 strips
			EventCollection              search, status/year/category filters, six-event pages
			EventPage                    shareable /events/:id with shared gallery
			GalleryPage                  searchable /gallery albums with shared photo viewer
			MembersPage / LeadershipPage separate public directories and PDF links
			Achievements                 curated student achievements
			PublicFooter
```

- [src/content/club.ts](src/content/club.ts): hero assets and statistics, composed with the event catalogue.
- [src/content/eventsData.ts](src/content/eventsData.ts): the three user-confirmed events, schedules and image URLs.
- [src/content/membersData.json](src/content/membersData.json): generated public roster; set each member's `imageUrl` here.
- [src/content/achievements.ts](src/content/achievements.ts): typed achievement records, intentionally empty until published.
- [src/components/public/types.ts](src/components/public/types.ts): `ClubAssets`, `ClubStatistics`, `ClubEvent`, and theme contracts.
- [src/components/public/public.css](src/components/public/public.css): shared tokens, glass surfaces, typography, and responsive layouts. Tailwind handles local utilities; CSS handles reusable themed components.
- [src/components/public/OptimizedImage.tsx](src/components/public/OptimizedImage.tsx): lazy/eager loading, glass skeleton, cached-image handling, responsive `srcSet`/`sizes`, stable geometry, accessible fallback, optional edge mask, and reduced-motion-aware hover. `GlassImage` remains a compatible alias.

### Homepage Community Highlights (2026-09-13)

The homepage starts with the hero, primary Microsoft/GitHub programs, next upcoming event, club story, and full upcoming/past event catalogue. Two opposite-direction community photo rows appear above the High Board, followed by recurring Golden honourees and compact supporter strips. Photos come from supplied local albums, not third-party sites. Photo motion slows to 35% speed on hover, and pauses offscreen or through the explicit pause control. Keyboard focus switches the focused row to manual scrolling and brings the focused photo into view. Repeated visual copies stay outside the tab order. Reduced-motion preference disables animation and leaves horizontally scrollable photos. No founding year is asserted.

The existing `ali-arabi-ali` profile remains President and is highlighted without adding a duplicate member. Leadership portraits retain their complete framing; missing portraits use initials. The following optional fields render icon links on leadership cards, member cards and profiles only when valid: `githubUrl`, `linkedInUrl`, `facebookUrl`, `instagramUrl`, `websiteUrl`, `publicEmail`, `publicPhone`. Social/site links require HTTPS without embedded credentials; phone uses international format such as `+201012345678` (example only). Empty values produce no icon. Only publish member-approved contact values; private roster contact fields are not imported. Ali approved publication but has not supplied the actual contact values, so no accounts have been guessed or added.

In API mode, edit these fields in `/admin/members`. They are explicitly public, may be cleared, and are persisted by the authenticated member API and exposed by `/api/showcase`. [MemberPublicContacts migration](../MSC.WebAPI/Migrations/20260913135706_MemberPublicContacts.cs) adds seven nullable columns only and has **not** been applied to any live database. Apply the reviewed pending migrations and activate API content mode only through the existing approved deployment procedure. Local previews continue to use the local member records and do not persist admin API changes into source files.

The homepage now uses workbook recognition history: nine people recognised in both February and April 2026, grouped into Heads, Instructors and Members. `/golden-members` retains all 36 honourees and 45 recognitions, with category, month, recurrence and name/role filters. Linked names, current roles, images and profile URLs come directly from the shared member roster; awards store recognition months/categories and historical source labels, not an independently maintained profile. A shared member update changes the Golden card and search results too. The 17 currently unlinked honourees retain historical recognition labels without invented portraits or profile links; confirmed roster IDs are needed before they can use shared identity data.

The earlier ratings-based `GoldenMembersSection` remains available separately, but is no longer the homepage recognition source. Its latest-completed-month/top-three-with-ties rule and the published leaderboard are unchanged. Workbook honours do not fabricate leaderboard scores. Verification paragraphs below describe their historical implementation phases, not a fresh full-suite run.

Verification: all 137 frontend tests passed, then 16 focused public tests passed after photo interaction refinements; TypeScript and editor diagnostics passed. The rebuilt backend content suite passed all 25 tests, including eight new public-contact validation/removal cases and extended roundtrip coverage. EF reported no pending model changes after migration generation. Headless Edge verified real opposite movement, pause, reduced motion, six responsive widths, portraits, section order, duplicate-photo clicks and visible keyboard focus with Enter/Escape restoration. A separate intercepted API-mode browser verified seven contact icons, admin save/read/remove, profile links, four winners tied at third place and four responsive widths; no fixture data was published. Temporary API preview was stopped. Screenshots were reviewed and this turn's generated images were then removed because C: ran out of space. No production build, live database update or deployment was performed.

### Student Branch Website Comparison (2026-09-13)

Reviewed public pages only; third-party application submissions, membership payment, authentication and administration were not tested. Observed labels and published claims are not independent verification of those services.

| Reference | Observed features | Decision for MSC-SCU |
| --- | --- | --- |
| [IEEE El Shorouk events](https://ieeesha.org/events) | Upcoming/past sections, event details with location/date ranges, paginated archive | Retain our existing event details; add six-event pages and data-derived year/category filters alongside status and search. |
| [El Shorouk applications](https://ieeesha.org/applications) | Registration/survey/feedback/general categories; no available forms during review | Defer until official forms, eligibility, data handling and submission ownership are supplied. |
| [IEEE SCU home](https://ieeescu.org/) | Community photo gallery, mission/vision, awards, executive officers, Member of the Month | Gallery and animated homepage rows use our own photos. Leadership and public contact icons are implemented; homepage honours now use the supplied recognition workbooks. |
| [IEEE SCU committees](https://ieeescu.org/committees) and [El Shorouk committees](https://ieeesha.org/committees) | Committee descriptions; SCU also exposes technical/non-technical filters and detail pages | Defer until our committee names, descriptions and leaders are confirmed. Do not infer membership from job titles. |
| [IEEE SCU join](https://ieeescu.org/join) and [membership](https://ieeescu.org/membership) | Recruitment link, benefits, eligibility/fees guidance, FAQ | A club joining/FAQ page needs MSC-specific policies and official links; IEEE membership benefits are not MSC benefits. |
| [IEEE SCU contact](https://ieeescu.org/contact) and [El Shorouk contact](https://ieeesha.org/contact) | Official email, social channels, location; SCU separates partnership contacts | Defer until MSC public contact channels are approved; do not republish private roster contacts. |

The `/gallery` route uses shared event galleries plus supplied community albums in local mode. It uses `gallery`, or a single `imageUrl` when no gallery is supplied; events without pictures are omitted. Repeated URLs within an album count once. Search matches event title, category and location; six-album pagination and the existing accessible event dialog provide photo browsing and event links. The original event gallery contains 14 photos, supplemented by the local community-photo import. No third-party photos or text were copied.

The event archive combines title/description/category/location search with status, start year and category. Unknown dates have their own filter. Filter changes reset pagination; reset clears every filter. Both additions retain local/API content selection, loading/error/empty states and the existing public themes. No backend, database migration, registration workflow or production deployment was changed for this comparison.

Verification: 47 focused frontend tests across events/gallery, app routing and public components; TypeScript check; headless Edge image loading, album navigation, Escape/focus restoration, search/reset, event filters, mobile navigation and deep-link reload. Gallery/header layout passed at 320, 390, 768, 1001, 1280, 1440, 1451 and 1920px; events passed at five widths. Desktop/night and mobile/day screenshots were reviewed. No production build or live API-to-database validation was performed in this change.

### Supply Images

The initial selection is served from [public/club-media](public/club-media), using photos from the repository's `Images Microsoft website` collection. Original albums are untouched. Put additional optimized images in this public folder and use `/club-media/filename.jpg`, or provide a hosted HTTPS image URL.

Set `assets.logo`, `assets.hero`, `assets.heroAlt`, and optionally `assets.heroGallery`. A nonempty `heroGallery` supplies the hero photo selector and takes precedence over `hero`; omit it to use a single hero image. Each gallery entry has `src`, `alt`, and `label`. Keep `alt` factual and descriptive.

```tsx
import GlassImage from './components/public/GlassImage';

<GlassImage
	src="/club-media/microsoft-egypt.jpg"
	alt="Microsoft Student Club members at Microsoft Egypt"
	aspectRatio="4 / 3"
	fit="cover"
	position="center 35%"
	softEdges
/>
```

Use `fit="contain"` for uncropped logos, `priority` for above-the-fold images, `framed={false}` for images inside an already-framed card, and `srcSet` plus `sizes` when multiple resolutions are available. Replacing a failed URL immediately restores image rendering. Use `null` for an intentional placeholder.

The image component does not compress source files or generate smaller renditions. Supply optimized image files or hosted renditions through `srcSet` to reduce mobile download size; CSS sizing alone cannot reduce bytes. A default 4:3 ratio reserves space, and component-specific classes or `aspectRatio` can override it. The loading skeleton clears on load/error and resets when the source changes.

Season 2 now uses the user-confirmed Orientation 2 album: 14 photographs with 640px/1280px JPEG renditions (smaller originals are not enlarged), totaling approximately 4.22 MB across all renditions. [src/content/season2Media.json](src/content/season2Media.json) maps each published image to its responsive sources. `OptimizedImage` selects these automatically; small gallery thumbnails load lazily. Regenerate assets from the repository root with `& .\msc-webapp\scripts\Optimize-EventImages.ps1`. This Windows/.NET script respects EXIF orientation and leaves originals untouched.

### Supply Statistics

Edit `clubContent.statistics`, or pass a `ClubStatistics` object to `StatisticsBanner` or the `statistics` prop of `ClubLanding`.

```tsx
import StatisticsBanner from './components/public/StatisticsBanner';
import type { ClubStatistics } from './components/public/types';

const previewStatistics: ClubStatistics = {
	registeredAttendees: 2450,
	eventLocations: 8,
	beneficiaries: 12000,
	eventsConducted: 36,
};

<StatisticsBanner statistics={previewStatistics} />
```

These example numbers are demonstration values, not club claims. The confirmed local catalogue uses **8,000 registered attendees and 8,000 beneficiaries**, separately confirmed by the user. Locations remain `null`; member counts are not attendance counts. The local completed-event counter is derived from the two documented past events, not an assertion about the club's entire history. In API mode statistics are editable persisted totals, loaded on navigation and refreshed after administration writes; there is no background polling. Zero is a valid total, not an unknown value. Negative, non-finite, and unsafe values display as unpublished. Counters start at zero when entering the viewport, compact values from 10,000 upward, expose exact totals to screen readers, and stop animations on unmount or prop changes. Reduced-motion users get the final number immediately.

### Supply Events

Edit [src/content/eventsData.ts](src/content/eventsData.ts). Each `ClubEvent` includes `id`, `title`, `category`, `summary`, `description`, `imageUrl`, `gallery`, `startsAt`, optional `endsAt`, `location`, and `status`. Use stable unique IDs and `upcoming`, `past`, or `unannounced` status. URLs are `/events/orientation-season-2`, `/events/canal-startup-sprint`, and `/events/orientation-season-3`.

- `summary` is the short card description; `description` is the full text in the detail dialog.
- `startsAt: '2026-10-20T18:00:00+03:00'` represents a scheduled time. Include an offset for timed events. Display uses `Africa/Cairo`.
- `startsAt: '2026-10-20'` shows a date without inventing a time; `null` displays "Date not published".
- `startsAt: '2026-10'` shows "October 2026", not October 1. `startsAt: '2026-07', endsAt: '2026-08'` displays the supplied July-August range.
- `location: null` displays "Location not published". No dates or locations were inferred from photo filenames.
- `gallery` is an array of image URL strings, shared between quick view and the full event page. It supports thumbnails, previous/next wrapping and a photo counter. The dialog supports native focus containment, Escape, close button, backdrop dismissal, scroll locking, and focus restoration.

The three event records use the latest club-confirmed information: **Season 2 on December 1, 2025** (corrected from the initial 2024 date, with the album explicitly confirmed); Canal Startup Sprint in July-August 2026; and **Season 3 on October 19, 2026, 3 PM-7 PM at Creativa Innovation Hub Ismailia**, represented with the Cairo `+03:00` offset applicable on that date. Season 2 has its full optimized gallery. Sprint/Season 3 photo links remain unassigned until supplied. Existing community hero images remain in place.

The homepage selects the earliest dated `upcoming` event from the same catalogue. Its live countdown now targets `2026-10-19T15:00:00+03:00`; the event details also show the confirmed 7 PM finish. Countdown inputs must be complete ISO timestamps including `Z` or an offset. Month-only and date-only values still display an exact-time-pending message. At zero the timer stops and shows that the scheduled start has been reached; it does not automatically claim the event is over.

For production deep links, configure your static host to serve the SPA entry document for frontend routes such as `/events/:id`. Keep normal file handling for `/club-media/*` and `/club-certificates/*`; a missing PDF should not return the SPA document.

`eventSource: 'local'` remains the default preview mode. Set `REACT_APP_CONTENT_SOURCE=api` at frontend build/start time to load all four public collections from `GET /api/showcase`. [src/context/ShowcaseContext.tsx](src/context/ShowcaseContext.tsx) validates the response and exposes loading/retry states. Failed requests and empty API catalogues never fall back to the local catalogue. Local files remain the initial import source, not a shadow copy of live database changes. Hero branding remains file-configured.

### Members And Certificates

The supplied workbook retains 102 raw records for import provenance. The public roster now has 101 canonical profiles: 73 Members, 5 Instructors (source spelling `Instructure`), 16 Board and 7 High Board. `Role` supplies the title; `Position` determines the group, with user-confirmed High Board overrides for Salwa Alaa Eldin Hegazy, Ahmed Hatem and Mohamed Mahmoud. The President's blank source `Position` for Ali Arabi Ali is explicitly mapped to High Board. All seven High Board profiles appear on the homepage, with the President first.

The user confirmed that the old Mohamed Ahmed / Cyber V.Head identity is Mohamed Abdelazim / Cyber Security Vice Head. [src/content/members.ts](src/content/members.ts) maps `mohamed-ahmed` to `mohamed-abdelazim` and excludes the duplicate from the public projection without deleting source workbook records. The old profile URL redirects to the canonical profile, and Golden recognitions resolve to the same member. This local projection does not merge existing live database rows.

- `/members`: Members and Instructors segments, name/role search, role filter and 12-profile pagination.
- `/leadership`: separate High Board and Board sections with search and role filtering.
- `/team`: compatibility redirect to `/members`.
- 101 source certificates remain in [public/club-certificates](public/club-certificates); 100 are linked by canonical public profiles after deduplication. Ali Arabi Ali has no supplied PDF, so no link is rendered for that profile.
- 63 roster-approved portraits, including the five newly confirmed leadership photos, are served from [public/club-media/members](public/club-media/members). The JPEGs total 3.97 MB, have a maximum dimension of 720px, respect EXIF orientation, and omit original metadata. Square frames use `contain` so portraits are not cropped. Ordinary member portraits are compact (180px maximum), Golden portraits 220px, while Board/High Board retain their original full card width. Originals are unchanged.
- 37 canonical profiles have no assigned local portrait and retain initials. One additional profile, Mai Elsayed Hafez Amen, was explicitly skipped because the supplied WebP cannot be decoded by the installed Windows codec. The user chose to skip unsupported images rather than install another converter.

Re-import after updating the workbook or certificate files, from the repository root:

```powershell
& .\msc-webapp\scripts\Import-Members.ps1 -InspectOnly
& .\msc-webapp\scripts\Import-Members.ps1
```

[scripts/Import-Members.ps1](scripts/Import-Members.ps1) reads the XLSX using standard ZIP/XML APIs without extra dependencies. It publishes only IDs, names, role titles, normalized groups, image URLs and certificate URLs. Email, subject, LinkedIn captions/links and the workbook itself are not copied into the site. It uses the explicit `Certificate_PDF_File` field, rejects duplicate identifiers/unknown groups/invalid filenames, warns about absent PDFs, and preserves existing portrait URLs by ID on re-import. The original workbook and PDFs are never modified. It does not delete older copied PDFs; remove retired files from the public folder explicitly when unpublishing a certificate. Published certificates are publicly accessible, not protected documents.

### Roster-Only Portrait Import

The certificate workbook remains the sole membership allowlist. Photo response workbooks under `Microsoft Data` are only identity evidence, never a source of additional profiles. [scripts/member-photo-matches.json](scripts/member-photo-matches.json) contains 64 explicitly reviewed assignments, not fuzzy guesses. Most matches use exact private email equality; five reviewed name-only matches and the named President portrait are marked separately. Five `user-confirmed` exceptions require exact approved IDs, Board folder and filenames: Ahmed Eyadaa, Ahmed Hariedy, Haidy mohamed salah, Salwa, and Mohamed Abdelazim. Neither emails, phone numbers, national IDs, response workbooks nor remote upload links are published. The raw 102-row report records 63 matched, 38 unassigned (including the suppressed duplicate) and one conversion-skipped.

```powershell
& .\msc-webapp\scripts\Import-MemberPhotos.ps1 -InspectOnly
& .\msc-webapp\scripts\Import-MemberPhotos.ps1 -PrepareOnly
& .\msc-webapp\scripts\Import-MemberPhotos.ps1
```

The Windows PowerShell importer uses built-in ZIP/XML, System.Drawing, WPF and Windows PDF APIs. Inspection validates the current roster and requires exactly one local file per assignment. Preparation writes only to a temporary staging directory. Publication updates only `imageUrl`, writes [scripts/member-photo-report.json](scripts/member-photo-report.json), and manages generated JPEGs in its dedicated public folder. Old generated portraits outside the current successful selection are removed from that folder; originals are never deleted. Unsupported codecs are reported and skipped, while disk failures stop the import. Ensure free disk space before running. Repeated imports preserve member data and leave 101 certificate links unchanged. No API calls, live database writes or migrations are involved.

The report lists every profile as `matched`, `unassigned`, or `conversion-skipped`. Do not automatically assign the remaining files by first name. In particular, these require confirmation:

| Roster profile or source label | Reason left unassigned |
| --- | --- |
| Aya Mohamed | Multiple similarly named response owners and portrait files |
| Mahmoud Mohamed Ali | Several Mahmoud Mohamed identities; ambiguous file label |
| Salma Mohammad | Similarly named response has a different role and email |
| DKWN, Denji, jujjj, Kim Jasmine | Upload labels do not establish a roster identity |

Ahmed Hariedy and Mohamed Abdelazim now use their explicitly named, user-confirmed Board files. Mohamed Abdelmaksoud is a different person and is not used as a substitute portrait.

Jana Alaa has two existing roster IDs with different roles, linked by the supplied workbooks. Both existing profiles are preserved; this import does not merge or add profiles. People present only in the response files remain excluded. After live API activation, changing these local seed URLs does not overwrite existing database rows: the initial catalogue import is additive. Use authenticated administration to update existing live portraits after separately approving activation.

### Member Profiles And Ratings

Member names and portraits now link to `/members/:id`. Profiles display the roster name, role, uncropped portrait, biography, optional certificate, and published rating history. Ali Arabi Ali's initial biography is exactly the user-supplied text in [src/content/members.ts](src/content/members.ts). Other biographies remain unpublished. The member editor at `/admin/members` persists a plain-text `bio` of up to 3,000 characters. React renders it as text, not HTML. In API mode the database biography is authoritative; the local biography is an initial import value, not an override for live edits. Existing records are not overwritten by the additive catalogue import, so update their biography explicitly in administration.

Per the user's choice, only administrators edit biographies for now. Member sign-in and self-editing are **not** implemented or implicitly granted by a public profile URL.

`/leaderboard` displays published final scores, with period selection, name/role search, Members versus Board/High Board filters, pagination, member profile links and optional criterion breakdowns. Instructors are excluded. Equal scores share the same competition rank (for example, 1, 1, 3); search preserves the rank, while group selection ranks within that group. Unrated people are not assigned zero or inserted into the ranking. Member profiles link to their historical periods.

The user selected **a final Rate supplied in Excel**, not a weighted calculation. The template uses values from **0 to 100 with at most two decimal places**. No attendance/task/project weights are calculated. Optional criterion scores are reported separately, with missing scores shown as "Not reported".

After API activation, use `/admin/ratings`:

1. Download the authenticated Excel template, populated with eligible database member IDs, names and groups.
2. Fill the `Ratings` worksheet. Required columns are `MemberId` and `Rate`; `Name` and `Group` are references only. Optional columns are `OnlineAttendance`, `OfflineAttendance`, `Tasks`, and `Projects`. Keep the stable `MemberId` unchanged. Fill only the people being rated; rows with all score cells blank are skipped, not assigned zero.
3. Enter a period title and inclusive start/end dates for the desired week or month, then upload and preview the workbook.
4. Correct unknown IDs, duplicate IDs, formulas or invalid scores before publishing. Changing the file or period invalidates the preview.
5. Confirm publication explicitly. Reusing the same start/end dates replaces only that period, and requires its current ID/version. A stale preview receives HTTP 409 and must be refreshed. Omitted members lose their rating in the replaced period; other periods are unchanged.

The XLSX limit is 2 MB, 2,000 rows, 1,000 ZIP entries and 20 MB decompressed content. External workbook links, macros and formula cells in `Ratings` are rejected. Workbooks and contact fields are not stored. Publication is one EF transaction and does not create member records. The period stores its publication timestamp, update version and administrator ID. Deleting a member also removes their rating entries; replacing a period does not preserve prior revisions within that same period.

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /api/leaderboard` | Public | Published periods and final scores |
| `GET /api/leaderboard/template` | SuperAdmin or ContentEditor | Download XLSX template |
| `POST /api/leaderboard/preview` | SuperAdmin or ContentEditor | Multipart `file`, `startDate`, `endDate`; read-only validation |
| `POST /api/leaderboard` | SuperAdmin or ContentEditor | Publish normalized rows or explicitly replace a versioned period |

### Sponsors And Partners

Local `/sponsors` displays the 20 supplied logos in their approved relationship categories. The homepage shows Microsoft Student Club (SCU branch / Microsoft Campus Club), powered by Microsoft, and GitHub Campus Expert as community sponsor, powered by GitHub, without a full-width white background. The bottom has two compact opposing strips: 11 `Logos 1` assets (including KAAF) and five `Logos 2` assets. The four `LogoPro` images appear only in the primary-program area. Pause, keyboard scrolling, offscreen pausing and reduced motion are supported; logos remain uncropped.

Regenerate logos without reprocessing photographs using `& .\msc-webapp\scripts\Import-CommunityMedia.ps1 -SponsorsOnly` from the repository root. [src/content/supporterLogos.json](src/content/supporterLogos.json) retains source grouping; [src/components/public/Supporters.tsx](src/components/public/Supporters.tsx) owns approved role labels. Alternate `(2)` files are excluded. Do not infer additional endorsements or event associations from a logo.

In API mode, `/sponsors` retains Diamond, Gold, Silver, Bronze and Community tiers, with tier and event/club-wide filters. Event detail pages show only explicitly linked sponsors; general club partners are not automatically event sponsors. Local assets do not create live sponsor records.

`/admin/sponsors` manages names, tier, description, logo URL, website URL, optional associated event, display order and publication status. New records start as drafts; a logo is required before publication. Logos use uncropped containment. URLs must be site-relative or HTTPS. Add optimized logo assets to the frontend or use approved hosted URLs; this feature does not introduce a new file-upload storage container.

Public `GET /api/sponsors` excludes drafts. `GET /api/sponsors/manage` and `POST/PUT/DELETE /api/sponsors[/{id}]` require SuperAdmin or ContentEditor. Removing an event detaches its sponsor records, retaining them as club-wide records, so review those associations when deleting events.

### Community Feature Activation And Checks

[../MSC.WebAPI/Migrations/20260913121929_MemberProfilesRatingsSponsors.cs](../MSC.WebAPI/Migrations/20260913121929_MemberProfilesRatingsSponsors.cs) adds `Members.Bio`, `RatingPeriods`, `MemberRatings`, and `Sponsors`. **Generated but not applied to a live database.** Review this migration together with the earlier Identity and PublicShowcaseContent migrations under the activation checklist below. Rating rows have unique period/member constraints; periods have unique date ranges and optimistic concurrency versions. A rollback drops ratings, sponsors and biographies.

The public preview remains `REACT_APP_CONTENT_SOURCE=local`. It shows confirmed profiles, Ali's supplied bio, workbook honours and supplied supporter assets, but no fabricated ratings. Persisted changes become public only after separately approved database activation and API-mode startup/build. The admin pages use real authenticated endpoints; they do not simulate successful saves or store records only in the browser.

Validation on 2026-09-13: 124 frontend tests, 35 backend tests, strict types, production compilation without new ESLint warnings, and an offline EF model/snapshot check passed. The eight newly introduced ClosedXML dependency coordinates had no known CVEs in the dependency assessment. API tests use isolated SQLite and real XLSX generation/parsing, including anonymous access rejection, invalid rows, versioned replacement and sponsor draft/event behaviour. Edge/Playwright verified the real profile route/bio and, in isolated API-mode contexts, ranking search, multipart preview/retry, confirmed publication/read-back, biography update/read-back, sponsor publication/event association, logo rendering and responsive views at 320-1440px. All five browser write requests were intercepted; no live database or deployment was involved. Production output is in `%TEMP%/msc-community-build`; tracked build artifacts were not overwritten. Generic CRA browser-database deprecation notices remain.

### Student Achievements

For local preview, add real entries to [src/content/achievements.ts](src/content/achievements.ts) using the `StudentAchievement` contract: `id`, `title`, `studentNames`, `achievedAt`, `summary`, `imageUrl`, `evidenceUrl`. After API activation, create/update/delete them in `/admin/achievements`. Use a date-only or month-only date when an exact time is irrelevant. Evidence links must use HTTPS. `/achievements` remains honestly empty until real achievements are entered; no awards or accomplishments were invented.

### Persistence Activation

The user approved preparing code, tests and migrations **without applying changes to a live database**. The current preview therefore stays local. Administration forms require the configured API, an authenticated session and the updated database schema; preview mode does not simulate successful saving.

Prepared endpoints:

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /api/showcase` | Public | Events, members, achievements and statistics from EF |
| `GET /api/showcase/member-types` | Public | Database-backed member category options |
| `POST/PUT/DELETE /api/events` | SuperAdmin or ContentEditor | Existing event CRUD, now with slug, precise schedule, location and gallery |
| `POST/PUT/DELETE /api/members` | SuperAdmin or ContentEditor | Existing member CRUD with safe request DTO, optional photos and certificates |
| `GET/POST/PUT/DELETE /api/achievements` | Reads public; writes authenticated | Student achievement CRUD |
| `GET/PUT /api/showcase/statistics` | Read public; write authenticated | Nullable nonnegative statistics, singleton ID 1 |
| `POST /api/showcase/import` | SuperAdmin only | Add missing initial events/members and initial statistics |

CRUD update/delete URLs include the numeric record ID. Events retain an optional stable public `slug`; members retain an optional `publicId`. Updates are full replacements, so clients must preserve fields they do not edit. The shared [src/pages/ContentManagement.js](src/pages/ContentManagement.js) editor does this, preserves legacy date-only schedules, and supplies route IDs in update bodies. Existing admin paths `/admin/events` and `/admin/members` use this editor; `/admin/achievements` and `/admin/statistics` are new. Authentication and role restrictions remain enforced by the API, including import rejection for ContentEditor.

Activation checklist, to execute only after separately approving a target database:

1. Back up the target and review its migration history, including the earlier Identity migration. Keep connection strings and JWT keys in local secret storage or deployment configuration, never in frontend variables or chat.
2. Review [../MSC.WebAPI/Migrations/20260913075052_PublicShowcaseContent.cs](../MSC.WebAPI/Migrations/20260913075052_PublicShowcaseContent.cs). It adds event metadata/gallery, member public IDs, achievement/statistic tables and Member/Instructor types. It retains existing members/events and allows missing images. Check that MemberTypes IDs 4 and 5 are available or reconcile existing categories before applying. Unique slug/public-ID indexes must remain valid. Rolling this migration back removes the new content columns/tables and can lose their data.
3. Apply the reviewed migration to the approved database using your controlled deployment process. No `database update`, production seeding or cloud deployment has been run in this phase.
4. Start the configured API and ensure the frontend origin is allowed. Set `REACT_APP_API_URL` to its public API base URL and `REACT_APP_CONTENT_SOURCE=api`, then restart/rebuild the frontend; these are build-time settings.
5. Sign in as SuperAdmin. Select **Import initial catalogue**, inspect the confirmation and explicitly confirm once. This imports the current 3 events and 102 profiles with references to the published assets, and initializes the confirmed statistics only if absent. It does not upload/copy files to the API: deploy `public/club-media` and `public/club-certificates` with the frontend, or replace relative URLs with approved HTTPS asset URLs.
6. Import matches by event slug/member public ID, not name. Existing matched records/statistics are untouched on repeated imports. Review legacy rows without public IDs to avoid duplicate people when importing; these cannot be safely merged just by name. Later edits belong in the admin UI, not in local seed files. Removing a database record does not delete its public asset file.
7. Confirm an authenticated save, public read-back, direct event link and certificate download in the target environment before publishing. This live-environment acceptance step remains unperformed.

The import is explicit and not executed on API startup. EF saves import changes atomically. Gallery URLs and student-name collections are stored as JSON in `nvarchar(max)`; item-count validation is separate from SQL string length. Date precision, URL schemes, lengths, role/category IDs and nonnegative totals are validated server-side. Monthly schedules remain monthly; the legacy `EventDate` is retained only for compatibility/sorting.

### Themes And Motion

Night uses charcoal glass with lime, cyan, and coral accents; Day uses white surfaces and Microsoft blue; Forest provides a green alternative. Icon controls have accessible names and tooltips. Selection persists under `club-theme` in localStorage. The hero, stats, and event reveals honor `prefers-reduced-motion`; the hero does not auto-advance photos.

### Verification

Portrait import verification on 2026-09-13: 110 frontend tests across 16 suites and strict TypeScript passed; the 7 member-directory tests were rerun successfully after the final uncropped-frame adjustment. Repeating the import preserved all member values. Browser checks decoded all 58 JPEGs, checked nonblank pixels and 100-720px dimensions, traversed all seven member pages and leadership, verified the skipped-image initials and a real certificate PDF response, and checked square uncropped frames without horizontal overflow at 320/390/768/1440px. Desktop homepage and mobile portrait screenshots were reviewed. This change did not rerun backend tests or a production build. Disk exhaustion was resolved by clearing generated CRA cache and this session's temporary portrait files; the current preview runs with webpack disk caching disabled. Source files and original media were not deleted. Free space remains low and should be increased before a production build or the normal cached preview task.

```powershell
npm run typecheck
npm test -- --watchAll=false --runInBand
npm run build
```

Validation on 2026-09-13 includes strict TypeScript, production compilation, public API-mode/error tests, admin save/retry/import/pagination tests, exact roster/PDF checks and SQL-backed controller tests. Backend tests use disposable in-memory SQLite through WebApplicationFactory; an additional SQL Server model test checks JSON column sizes without opening a connection. `dotnet ef migrations has-pending-model-changes --project MSC.WebAPI --startup-project MSC.WebAPI` reports no pending model changes through the offline design-time factory.

Playwright/Edge checked public themes, real 14-photo gallery navigation, mobile selection of the 640px rendition, countdown visibility, confirmed date/time range, direct links, native dialog focus, people filters, real PDF delivery and responsive layouts at 320-1920px. A separate isolated admin browser context exercised seven intercepted writes: validation error/retry, schedule/gallery preservation, certificates, achievement creation/deletion, statistics and explicit import. These UI requests did not reach any backend database. Real persistence is verified separately by API/SQLite tests; live SQL Server, a live deployment and an end-to-end live browser-to-database flow remain unverified. Generic CRA browser-data deprecation notices remain. Production output was redirected to `%TEMP%/msc-persistence-build` instead of overwriting tracked builds.

## Project Structure

```
msc-webapp/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── public/         # Typed public design system and event views
│   │   └── PrivateRoute.js # Protected route wrapper
│   ├── pages/              # Page-level components
│   │   ├── ClubLanding.tsx # Glass hero, statistics, events, and club story
│   │   ├── MemberDirectory.tsx # Members and leadership pages
│   │   ├── Achievements.tsx # Student achievements
│   │   ├── AdminLogin.js   # Admin login page
│   │   └── AdminDashboard.js # Admin dashboard
│   ├── services/           # API service layer
│   │   ├── apiClient.js    # Axios instance with interceptors
│   │   └── api.js          # API endpoint functions
│   ├── context/            # React Context providers
│   │   └── AuthContext.js  # Authentication state management
│   ├── hooks/              # Custom React hooks (future)
│   ├── assets/             # Images, fonts, etc. (future)
│   ├── App.js              # Main app component with routing
│   └── index.js            # App entry point
├── .env                    # Environment variables
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## Tech Stack

- **React 19**: UI library
- **TypeScript (strict)**: Public components and content contracts
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Viewport reveals, counters, hover and parallax motion
- **Context API**: Global state management

## Brand Colors (from Tailwind config)

- **Primary**: `#0078d4` (Microsoft blue)
- **Primary Hover**: `#50e6ff` (Light blue accent)
- **Navy**: `#203a6c` (Dark blue for navbar/footer)
- **Accent**: `#50e6ff`
- **Background White**: `#ffffff`
- **Background Light**: `#f2f2f2`
- **Text**: `#2e2e2e`
- **Text Light**: `#ffffff`

## Routes

### Public Routes
- `/` - Landing page (hero gallery, statistics, event previews, club story)
- `/members` - Members and Instructors directory with certificates
- `/leadership` - High Board and Board directory
- `/team` - Redirect to `/members`
- `/events` - All events page with filtering
- `/events/:id` - Shareable event detail page
- `/achievements` - Curated student achievements
- `/admin/login` - Admin login page

### Protected Routes (require authentication)
- `/admin/dashboard` - Admin dashboard (SuperAdmin and ContentEditor)

## API Integration

### API Base URL
- **Development**: `https://localhost:7157/api` (ASP.NET Core Web API)
- **Production**: Configure in `.env.production`

### Authentication Flow
1. User enters email/password on `/admin/login`
2. `AuthContext.login()` calls `/api/auth/login`
3. JWT token stored in localStorage
4. `apiClient` automatically attaches token to all requests via interceptor
5. `PrivateRoute` checks `isAuthenticated()` before rendering protected routes
6. Token expiration checked on each request (1-hour lifetime)

### API Services (src/services/api.js)
- `authApi`: Login
- `membersApi`: CRUD operations for members
- `eventsApi`: CRUD operations for events
- `siteContentApi`: CRUD operations for site content
- `adminUsersApi`: CRUD operations for admin users (SuperAdmin only)
- `uploadApi`: Generate SAS tokens and upload to Azure Blob Storage

## Available Scripts


In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
