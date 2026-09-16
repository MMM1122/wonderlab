# Connected deployment

Deployed on September 15, 2026 (America/Vancouver).

- Website: https://mmm1122.github.io/wonderlab/
- Owner dashboard: https://mmm1122.github.io/wonderlab/#admin
- API: https://wonder-lab-api.yvettewu-wonderlab.workers.dev
- Cloudflare Worker: `wonder-lab-api`
- D1 database: `wonder-lab`, with migration `0001_init.sql` applied.
- Notification sender: `wonderlab@lab-mail.yvettewu.com`.
- Notification recipient: the verified owner address configured in Cloudflare.
- Scheduled notification retries: every five minutes.

## Verified

The live API health check returns HTTP 200. Owner sign-in succeeds; anonymous management requests and revoked sessions return HTTP 401. A private draft persisted in remote D1 and remained absent from the public feed. A test guestbook message was saved pending moderation, and Cloudflare accepted its email notification on the first attempt. Provider acceptance does not prove inbox delivery. Disposable test content was removed after verification.

The published HTML, JavaScript, CSS, and walking animation asset match the local build. The deployed opening sequence and connected guestbook render without browser console errors. Fourteen local backend integration tests pass.

## Owner workflow

1. Open the dashboard link and enter the privately supplied administrator key.
2. Write an article in Chinese and optionally English. Save a draft or choose Published.
3. Review incoming messages. Approve makes a message public; Hide keeps it private.
4. Check the notification status in the dashboard if a reminder does not arrive.
5. Sign out when finished. Refreshing the page also clears the browser's in-memory token.

The initial database contains no sample articles. Original Sites records and old offline samples have not been imported.

## Further work

Turnstile remains optional and is not configured in this deployment. Moderation, a honeypot, and per-IP limits are active. Add a widget for `mmm1122.github.io` and configure both its public and secret keys to enable it.

Still working on original bilingual writing and further improvements to the exploration experience.
