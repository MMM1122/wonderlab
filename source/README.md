# Wonder Lab

A bilingual home for curious minds: personal thoughts, perspectives, and discoveries, set in a surreal forest shaped by mathematical geometry.

Wonder Lab now has a public journal and a personal writing studio. Write directly on the website, keep unfinished ideas private, and publish when you are ready. Each verified email account has its own profile and articles. The forest entrance, long-haired explorer, generated artwork, geometric covers, and optional Web Audio soundtrack remain part of the experience.

## Application structure

```text
Public website
  Home                         Dream forest, recent writing, guestbook
  Blog                         Published articles from all authors
  Blog post                    Shareable article, author, language toggle

Writing studio /admin/
  Email sign-in                One-time code; first verification creates an account
  My posts                     Only the signed-in author's articles
  New / edit post              Bilingual text, category, preview
  Draft / published            Private writing or public publication
  Delete                       Explicit confirmation
  Profile                      Public display name and biography
  Owner tools                  Guestbook review and legacy owner-key access

Cloudflare Worker
  Authentication, authorization, validation, rate limits
  D1: users, posts, email challenges, hashed sessions, guestbook, mail queue
  Resend: email sign-in codes, once the sender and secret are configured
  Cloudflare Email: existing owner notifications
```

The frontend uses React, TypeScript, and a standalone Vite build. GitHub Pages serves the public assets; the Worker handles all database operations. The browser never receives a D1 credential, mail API key, or administrator secret as part of its bundle.

The shared visual components live in `app/`; `static/` contains the Pages entry point, router, Blog, and writing studio. `backend/worker.ts` is the separate API. SQL migrations live in `backend/migrations/`, and integration tests in `tests/backend.test.mjs`. The earlier Sites implementation is retained for reference and has a separate database and authentication system.

## Routes and API

On the existing GitHub Pages repository, routes are below `/wonderlab/`:

- `/wonderlab/`: home.
- `/wonderlab/admin/`: email login and personal writing studio.
- `/wonderlab/blog/`: public article list.
- `/wonderlab/blog/?post=<slug>`: a shareable article URL that also works on direct visits and reloads without server rewrites.

The Worker exposes the requested REST endpoints:

- `POST /api/posts`: create your article.
- `GET /api/posts`: paginated published articles.
- `GET /api/posts?mine=1`: your private and published articles; authentication required.
- `GET /api/posts/:slug`: one published article.
- `PUT /api/posts/:id`: update your article; requires its current `version`.
- `DELETE /api/posts/:id`: delete your article.

Email login uses `POST /api/auth/request-code` and `POST /api/auth/verify-code`. `GET /api/auth/me` returns the current account, `POST /api/auth/logout` revokes its session, and `PUT /api/profile` edits its display name and bio. Existing guestbook endpoints remain available.

## Account and data boundaries

Eight-digit codes expire after ten minutes, permit at most five verification attempts, and are consumed atomically. Codes are stored as keyed hashes, never returned by the API, and never placed in URLs. Requests are limited by IP, recipient, and a global daily quota. A failed send invalidates its challenge.

Sessions are random bearer tokens with hashed server-side records. Email sessions last twelve hours; owner-key sessions last eight. The browser retains its session in tab-scoped `sessionStorage`, so refreshing the page preserves sign-in. Signing out revokes the server record and clears the local token. Shared-device users should explicitly sign out; a browser that restores a tab may also restore its session storage.

Every write checks the authenticated author on the server. A submitted `user_id`, email, or role cannot change ownership or grant privileges. Public article responses contain author names, never account emails. Version checks prevent an older editor window from silently overwriting newer changes. Rendering uses plain React text rather than executing submitted HTML.

The schema migration preserves existing posts and assigns them to the site owner. A verified login matching the configured owner email reaches that same account. The old owner key remains available during the transition. No original Sites records or offline sample posts are imported automatically.

## Development

Use Node.js 22.13 or later:

```sh
npm ci
npm run test:backend
npx tsc --noEmit
WONDER_API_URL=http://localhost:5180 WONDER_BASE_PATH=/ npm run build:pages -- work/connected-preview
PORT=5180 npm run dev:connected
```

The local preview uses disposable SQLite data and a mock email sender. Its most recent test email is written to ignored `work/dev-auth-inbox.json`; it never sends real email. This development adapter is not deployed to the Worker.

## Deployment

Follow [the backend guide](backend/README.md) to apply migrations and deploy. For GitHub Pages:

```sh
WONDER_API_URL=https://YOUR_WORKER_URL npm run build:pages
```

Publish the contents of `work/static-export/site/`, preserving the `assets`, `admin`, and `blog` directories. The default base path is `/wonderlab/`; set `WONDER_BASE_PATH=/` for a root-domain deployment. The offline HTML export remains a design preview with no live publishing.

Public email sign-in stays disabled until a working sender and secret are configured. See [email login setup](backend/EMAIL-LOGIN.md). The owner can still publish directly through the site's owner-key login during setup. Keep all administrator keys, mail secrets, local configuration, backups, and test inboxes out of GitHub.

## Validation

Twenty-four backend integration tests cover authentication, code expiry and replay prevention, two-user isolation, private drafts, CRUD, profile privilege boundaries, session revocation, edit conflicts, CORS, mail failures, guestbook moderation, and migration of existing data. Local browser checks cover email sign-in, creating a draft, publishing, reading a standalone article, and maintaining sign-in across refreshes.

Still working on production email-login onboarding, original bilingual writing, and the little details that make this world feel alive.
