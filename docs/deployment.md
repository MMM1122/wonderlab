# Multi-user deployment

Updated September 16, 2026.

- Home: https://mmm1122.github.io/wonderlab/
- Writing studio: https://mmm1122.github.io/wonderlab/admin/
- Public Blog: https://mmm1122.github.io/wonderlab/blog/
- API: https://wonder-lab-api.yvettewu-wonderlab.workers.dev
- Database migrations: `0001_init.sql`, `0002_users_and_posts.sql`.

The website supports writing, editing, private drafts, publishing, deletion, and profiles. REST post operations enforce author ownership on the server. Existing owner posts are retained under `site-owner`. A database recovery bookmark was recorded before migration.

The owner can use the existing private administrator key on the website. Public email login remains disabled until the Resend sender domain and `RESEND_API_KEY` are verified. See [email setup](../source/backend/EMAIL-LOGIN.md).

The live Worker has passed owner authentication and REST create/update/delete checks using a disposable private draft. Local tests cover two-account isolation, one-time email codes, profile permissions, concurrent edits, and existing-data migration. The local browser flow has also passed email sign-in, draft saving, publication, public reading, and reload/session checks. Real public-email delivery is a separate pending check.

Owner guestbook notifications continue through the existing Cloudflare Email binding. Turnstile is not configured; moderation, honeypot and rate limits remain active.
