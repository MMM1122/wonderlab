# Multi-user deployment

Updated September 16, 2026.

- Home: https://wonderlab.observer/
- Writing studio: https://wonderlab.observer/admin/
- Public Blog: https://wonderlab.observer/blog/
- API: https://wonder-lab-api.yvettewu-wonderlab.workers.dev
- Database migrations: `0001_init.sql`, `0002_users_and_posts.sql`.

The website supports writing, editing, private drafts, publishing, deletion, and profiles. REST post operations enforce author ownership on the server. Existing owner posts are retained under `site-owner`. A database recovery bookmark was recorded before migration.

The owner can use the existing private administrator key on the website. The Resend domain `auth.yvettewu.com` is verified. A sending-only key restricted to this domain is stored as the Cloudflare Secret `RESEND_API_KEY`. Public email login is enabled; the production request-code flow succeeded and Resend reports the owner’s first sign-in email as delivered. See [email setup](../source/backend/EMAIL-LOGIN.md).

The custom domain Home, Blog, and Studio routes return HTTP 200; the Studio loads without browser errors. The API permits the configured custom-domain origin. The live Worker has passed owner authentication and REST create/update/delete checks using a disposable private draft. Local tests cover two-account isolation, one-time email codes, profile permissions, concurrent edits, and existing-data migration. The local browser flow has also passed email sign-in, draft saving, publication, public reading, and reload/session checks. Production email delivery has passed. The owner’s final code-entry sign-in and a second consenting real-user check remain to be confirmed.

Owner guestbook notifications continue through the existing Cloudflare Email binding. Turnstile is not configured; moderation, honeypot and rate limits remain active.
