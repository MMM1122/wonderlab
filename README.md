# Wonder Lab

A bilingual personal space for thoughts, perspectives, and unexpected discoveries. Wonder Lab brings a dreamlike forest, a young explorer, and mathematical geometry into a journal that can hold many different interests.

The visual world is deliberately playful: a long-haired explorer walks into a forest cave, falls through a geometric tunnel, and arrives in a surreal garden. Visitors can skip or replay the opening, switch between Chinese and English, and choose whether to play the ambient soundtrack. The forest and character artwork were generated with ImageGen. Music is synthesized in the browser with Web Audio; it begins only when the visitor presses play.

The connected edition is now deployed. See [deployment details and the owner workflow](docs/deployment.md).

## Architecture

The connected edition separates presentation, application logic, and persistent storage:

```text
Visitor or owner
    |
    v
GitHub Pages: HTML, CSS, JavaScript, images
    |
    | HTTPS JSON requests
    v
Cloudflare Worker: validation, authentication, moderation
    |
    +--> D1: articles, messages, sessions, notification queue
    |
    +--> Email binding: reminders to the verified owner address
```

**Frontend.** React and TypeScript render the journal, animated entrance, language controls, guestbook, and owner dashboard. A Vite export produces files that GitHub Pages can serve directly. The public API address is embedded at build time and can be overridden by `site-config.json`. Administrator credentials are never embedded in this build.

**Backend.** A standalone Cloudflare Worker accepts anonymous messages and protects all owner actions. The owner can create bilingual drafts, publish or unpublish articles, edit content, and approve, hide, or delete messages. Drafts and unapproved messages are excluded from the public API.

**Storage.** Cloudflare D1 stores the site's records independently of any visitor's browser. Closing a tab does not delete submitted messages. The database also stores hashed login sessions, rate-limit counters, and a persistent notification queue.

**Notifications.** Saving a message also creates a notification job. A scheduled Worker retries sending when necessary. Email requires a configured binding, sender, and verified destination; messages remain stored while email setup is incomplete. Provider acceptance is shown separately from a guarantee of inbox delivery.

## Two editions

- **Connected website:** the GitHub Pages frontend calls the deployed Worker. Articles and messages come from D1. A fresh database starts empty until the owner publishes content.
- **Offline preview:** a self-contained HTML file displays the design and sample content. It does not send messages or publish articles.

The original Sites implementation remains in the source for reference. Its authentication and database are separate from this edition; see [the original Sites notes](source/docs/original-sites.md). Deploying the new Worker does not migrate those records automatically.

The complete editable project is in [`source/`](source/). Paths and commands below are relative to that folder. The repository root contains the compiled GitHub Pages site.

## Source layout

- `app/page.tsx`: shared journal interface and animated prologue.
- `app/lab-service.ts`: service interface separating the shared UI from its backend.
- `app/turnstile.tsx`: optional visitor verification widget.
- `static/`: connected entry point, API client, owner dashboard, and styles.
- `backend/worker.ts`: standalone API and scheduled notification processing.
- `backend/migrations/`: D1 schema migrations.
- `scripts/export-static.mjs`: GitHub Pages and single-file exports.
- `scripts/configure-backend.mjs`: local deployment configuration and private key generation.
- `tests/backend.test.mjs`: backend integration tests using SQLite.
- `public/`: generated artwork and other public assets.

## Run and deploy

Use Node.js 22.13 or later and install dependencies with `npm ci`. Follow [the backend setup guide](source/backend/README.md) to create D1, apply migrations, deploy the Worker, and configure secrets.

Build the frontend with the Worker URL returned by deployment:

```sh
WONDER_API_URL=https://YOUR_WORKER_URL node scripts/export-static.mjs
```

Upload the contents of `work/static-export/site/` to the GitHub Pages repository root. Keep `index.html`, `styles.css`, `site-config.json`, `.nojekyll`, and the `assets` folder together. The separate `index-connected.html` is an alternative single-file online build. `Wonder-Lab-离线预览.html` is the offline design preview.

Open the connected site and select **Manage / 管理后台**, or append `#admin` to the URL. Use the generated administrator key, kept privately in `backend/admin-key.txt`. Save this key in a password manager. Never upload `admin-key` files, secret JSON files, or local configuration files to a public repository.

## Validation and limits

```sh
node --test tests/backend.test.mjs
npx tsc --noEmit
```

The integration suite covers access control, draft visibility, message moderation, validation, session expiry and revocation, persistent rate limits, notification retries and leases, pagination, and incomplete verification configuration. Local browser checks have also covered submitting a message, approving it, and publishing an article. Production deployment and email delivery require separate live checks.

The public feed currently returns up to 200 published articles and 100 approved messages. The dashboard paginates all records. Turnstile is optional and needs its own Cloudflare configuration; moderation and rate limits remain active without it. Email processing can occasionally send a duplicate after an interrupted attempt, so the dashboard remains the authoritative record of received messages.

Still working on original bilingual writing and further refinements to the writing and exploration experience.
