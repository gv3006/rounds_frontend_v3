# Backend integration guide

The frontend is ready for a backend. All Rounds data passes through one interface, `RoundsApi`, defined in [`src/api/types.ts`](../src/api/types.ts). There are two adapters behind it:

| Mode | Adapter | Data comes from |
|---|---|---|
| `mock` (default) | [`src/api/mock.ts`](../src/api/mock.ts) | The fictional sample dataset ([`src/data/mock.ts`](../src/data/mock.ts)) plus this browser's `localStorage` |
| `http` | [`src/api/http.ts`](../src/api/http.ts) | The Rounds REST API specified in [`openapi.yaml`](openapi.yaml) |

To switch, copy `.env.example` to `.env.local`, then set `VITE_API_MODE=http` and `VITE_API_BASE_URL=https://…`. The UI ([`src/app.js`](../src/app.js)) never calls `fetch` or `localStorage` for Rounds data itself.

Live literature from Europe PMC is a separate concern. It goes through [`src/api/europepmc.ts`](../src/api/europepmc.ts) and is unaffected by the mode. A backend may proxy or cache it later.

## How the UI uses the API

- **Startup.** `boot()` loads five things in parallel: `session.load()`, `content.load()`, `discussions.list()`, `projects.list()` and `jobs.list()`. While they load, a skeleton is shown. If any of them fails, a "Couldn't load Rounds" panel appears with a retry button.
  - In HTTP mode, `session.load()` fans out to the `/me/*` endpoints.
  - A single aggregate `GET /me/state` would be a reasonable optimization later. It would change only `http.ts`.
- **Quick changes are optimistic.** These include follow/pin, journal shelf, scope, data source, bookmarks/collections, ratings, notes, interest, appraisals and role-tag removal. Local state updates and the UI re-renders immediately. If the API call fails, the change is rolled back and a toast explains why. For preferences, "rolled back" means restoring the last copy the API confirmed.
- **Creating records waits for the server.** This covers discussions, comments, collections, role tags, projects, jobs and the profile. The server assigns `id`, `author` and `createdAt`. While the request is in flight the form is disabled. On failure the form stays open, so nothing typed is lost.
- **Paper comments load lazily.** They are fetched when a paper opens (`GET /papers/{key}/comments`). The session preloads only the user's own comments (`GET /me/paper-comments`) for the activity counts.
- **Errors.** Error bodies use the shape `{ "error": { "code", "message" } }`. For 400, 409, 413 and 422, `message` is shown to the user as-is. Network failures and timeouts are reported as `status: 0` (see `describeError` in `src/api/errors.ts`).

## Conventions

- **Paper identity.** The paper key is `${source}:${id}`. Examples: `DEMO:s01` (sample), `MED:39012345` (Europe PMC / PubMed), `DOI:10.1000/xyz` (pasted citation). Keys can contain `/` and `:`, so they are URL-encoded in paths.
- **Paper shape.** Records follow the normalized `Paper` type in [`src/types/paper.ts`](../src/types/paper.ts). Bookmarks store a `paper` snapshot so the library renders without refetching.
- **Server-owned fields.** The server stamps `id`, `createdAt`, `authorId` and `author` (`{ id, display, roles }`). Clients never send them.
- **Lists.** List endpoints return `{ items, nextCursor }`. The UI reads only `items` today, so pagination can be added without breaking the client.
- **Time.** All timestamps are ISO 8601 in UTC.
- **Auth.** Authentication is a session cookie, and requests use `credentials: 'include'`. This means the API needs CORS with credentials for the frontend's origin, or must be served from the same site.
  - `POST /auth/login`, `POST /auth/logout` and `GET /me` are specified.
  - The UI has no login screen yet. `api.auth.getCurrentUser()` is the hook for adding one.

## Where today's localStorage data maps to

The mock adapter keeps the prototype's original keys (prefixed `rounds-`), so existing visitors keep their data. On first load it runs a one-time migration, `migrateLocalData`, versioned by `rounds-schema-version`. The migration:
- adds ids and timestamps
- converts author strings into author snapshots
- addresses thread comments by id instead of array index
- wraps bookmarks as `{ paperKey, paper, savedAt }`
- renames collection `keys` to `paperKeys`
- merges `interests` and `interest-reasons`

| localStorage key | Endpoint |
|---|---|
| `profile` | `GET /me`, `PUT /me/profile` |
| `role-tags` | `GET/POST /me/role-tags`, `DELETE /me/role-tags/{id}` |
| `following`, `pinned-specs`, `journal-feed`, `spec-journals`, `journal-topics`, `spec-journal-topics`, `data-mode`, `scope` | `GET/PATCH /me/preferences` (fields `following`, `pinned`, `feedJournals`, `specJournals`, `journalTopics`, `specJournalTopics`, `dataMode`, `scope`) |
| `bookmarks` | `GET /me/bookmarks`, `PUT/DELETE /me/bookmarks/{paperKey}` |
| `collections` | `GET/POST /me/collections`, `DELETE /me/collections/{id}`, `PUT/DELETE /me/collections/{id}/papers/{paperKey}` |
| `appraisals` | `GET /me/appraisals`, `PUT /me/appraisals/{paperKey}` |
| `paper-ratings` | `GET /me/ratings`, `PUT/DELETE /me/ratings/{paperKey}` |
| `paper-notes` | `GET /me/notes`, `PUT/DELETE /me/notes/{paperKey}` |
| `interests` (formerly with `interest-reasons`) | `GET /me/interests`, `PUT/DELETE /me/interests/{paperKey}` |
| `threads` | `GET/POST /discussions`, `POST /discussions/{id}/comments` |
| `paper-comments` | `GET/POST /papers/{paperKey}/comments`, `GET /me/paper-comments` |
| `projects` | `GET/POST /projects` |
| `jobs` | `GET/POST /jobs` |
| *(sample dataset)* | `GET /papers`, `GET /discussions/highlights`, `GET /topics/trending` |

### Collection invariants (implemented by the mock; the server should match)

- The `reading` collection (Reading list) always exists and can't be deleted (400).
- A new bookmark (`PUT /me/bookmarks/{key}`) joins the Reading list.
- Adding a paper to a collection, or creating a collection seeded with a paper, bookmarks the paper. It does not also add it to the Reading list.
- Removing a bookmark removes the paper from every collection.
- After a collection is deleted, any bookmarks left without a collection return to the Reading list.

## What stays client-side for now

- **Reference data and catalogs.** The taxonomy, appraisal tools, 15 specialties and about 70 journals live in [`src/data/reference.ts`](../src/data/reference.ts) and [`src/data/catalog.ts`](../src/data/catalog.ts). They could be served later in the same shapes.
- **Paper normalization and classification.** This covers study type, sample size, specialty and deduplication, in [`src/domain/papers.ts`](../src/domain/papers.ts). These are pure functions, so they can move server-side unchanged.
- **Feed filtering and ranking in sample mode.** This is `matches()` and `sortPapers()` in `app.js`. Live mode instead builds Europe PMC query clauses (`liveQuery()`).

## Before going live with the HTTP adapter

- **UI copy.** Much of the copy says things are "stored on this device only", "Local draft" or "Sample data". Update it once the data is really server-backed.
- **Sample content.** `GET /papers` replaces the fictional sample set. Records that are still fictional must keep `demo: true`, because the UI labels those as samples.

## Open questions (from the README's engineering handoff)

- Account model and sign-up, privacy/consent, and data export/deletion.
- Licensed-role verification: role tags stay `pending` until a verification service exists. Don't collect license numbers before then.
- Moderation and abuse reporting for discussions, comments, projects and jobs.
- IRB verification and file upload. Today only the file name is recorded.
- Publication source licensing and attribution, including the hotlinked journal covers and demo impact tiers.
- Whether paper comments and appraisals are public, private or role-gated. Today appraisals, ratings, notes and interests are private per user.
