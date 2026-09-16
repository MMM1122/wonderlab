# Wonder Lab backend

A standalone Cloudflare Worker and D1 database for the GitHub Pages frontend. It does not use the original Sites authentication headers or share the original Sites database.

## Features

- Owner sign-in using a randomly generated administrator key.
- Bilingual articles with private drafts, publication, editing, and deletion.
- Anonymous guestbook submissions, private by default; the owner can approve, hide, or delete them.
- Persistent notification queue, retry handling, and visible send status in the dashboard.
- Exact-origin CORS, bounded JSON bodies, input validation, parameterized SQL, hashed sessions, and persistent rate limits.
- Optional Turnstile verification; if configured, the Worker validates every token and checks its hostname and action.

## Deploy

From the source root, with Node.js 22.13+ and dependencies installed:

```sh
npx wrangler login --scopes account:read user:read workers:write workers_scripts:write d1:write zone:read email_routing:write email_sending:write
npx wrangler d1 create wonder-lab
node scripts/configure-backend.mjs YOUR_DATABASE_ID
npx wrangler d1 migrations apply wonder-lab --remote --config backend/wrangler.local.json
npx wrangler deploy --config backend/wrangler.local.json
npx wrangler secret bulk backend/admin-key-secrets.json --config backend/wrangler.local.json
```

Deployment initially fails closed until the administrator hash and IP hash secret are configured. Save `backend/admin-key.txt` in your password manager. Never commit it or `backend/admin-key-secrets.json`. The browser uses the key only to obtain an 8-hour session. The session token stays in memory and disappears when the page reloads. Signing out revokes it. Rotating the administrator hash also invalidates existing sessions.

Build the frontend using the actual URL returned by Wrangler:

```sh
WONDER_API_URL=https://YOUR_WORKER_URL node scripts/export-static.mjs
```

Upload the contents of `work/static-export/site/` to your GitHub Pages repository root, including `site-config.json`. Alternatively, rename `index-connected.html` to `index.html` for a single-file frontend. Its embedded configuration works without `site-config.json`; if a configuration file exists, it overrides the embedded API URL.

Use the normal Pages build for smaller uploads and separate asset caching. Use the single-file build when you specifically need one HTML file. The file named `Wonder-Lab-离线预览.html` deliberately stays in preview mode.

Open your site and click **Manage / 管理后台**, or add `#admin` to the site URL. The first public article list will be empty until you publish an article; it will not silently substitute sample posts for a failed database connection.

## Email reminders

The owner requested notifications to `yvettewu2017@gmail.com`. Sending is disabled until an email binding and a verified sender are configured. New messages are still saved and queued while email is unavailable.

Enable Cloudflare Email Service for a domain you control and verify the destination email address. Do not replace existing domain mail records without checking the current mail setup. Add the binding to the local Wrangler configuration:

```json
"send_email": [{"name":"EMAIL","destination_address":"yvettewu2017@gmail.com"}]
```

Set `NOTIFY_FROM` to an address on your verified sending domain; `NOTIFY_TO` is the owner's requested destination. Redeploy. Notifications contain the visitor's submitted display name and message and a dashboard link. They do not contain administrator credentials.

The queue retries transient failures and stops after five attempts. Failed notices can be retried from the dashboard. “Submitted to email service” means the provider accepted the send; it does not prove delivery to the inbox. A process interruption after sending but before updating D1 can cause a duplicate reminder. Always use the dashboard as the record of received messages.

Official email binding reference: https://developers.cloudflare.com/email-service/api/send-emails/workers-api/

## Turnstile

For a public guestbook, configure a widget for `mmm1122.github.io`. Set the public `TURNSTILE_SITE_KEY` variable and the private `TURNSTILE_SECRET_KEY` secret. Both are required together; a partial configuration blocks submissions. Without Turnstile, moderation, a honeypot, and per-IP rate limits remain active, but do not provide equivalent bot protection.

Official validation reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## Development and checks

```sh
node --test tests/backend.test.mjs
npx tsc --noEmit
WONDER_API_URL=http://localhost:5174 node scripts/export-static.mjs work/connected-preview
node scripts/dev-connected.mjs
```

The integration preview binds only to the local computer, uses an in-memory SQLite database, and has the test-only key `local-development-only`. It never sends email. It exists to test the interface on machines that cannot run Cloudflare's local runtime.

Production uses D1. Cloudflare runtime behavior and email delivery must also be verified after deployment.

The public API currently returns up to 200 published posts and 100 approved messages. The owner dashboard paginates all records in groups of 20. Existing Sites records are not migrated automatically. Back up D1 before schema changes or large content edits.
