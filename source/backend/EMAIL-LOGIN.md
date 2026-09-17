# Email sign-in setup

The app implements passwordless email verification. Sending codes to regular visitors requires a mail service that can send to arbitrary recipients. The existing Cloudflare binding is restricted to the owner's notification address and is intentionally kept separate.

## Live deployment status

As of September 16, 2026, `auth.yvettewu.com` is verified. A sending-only key restricted to this domain is stored in Worker `wonder-lab-api` as `RESEND_API_KEY`. Public email sign-in is enabled, and Resend confirmed delivery of the first production sign-in email to the owner. The final owner sign-in and a second consenting real-user check remain to be confirmed; local verification and account-isolation tests have passed. Never copy the production key into this repository.

## Resend

1. Create or sign in to your Resend account.
2. Add the dedicated sender domain `auth.yvettewu.com` in Resend. Add the exact DNS records it provides in Cloudflare. Do not replace the root domain's mail records or the existing `lab-mail.yvettewu.com` notification setup.
3. Wait for Resend to mark the sender domain verified.
4. Create a sending-only API key limited to that domain.
5. Add it to Worker `wonder-lab-api` as secret `RESEND_API_KEY`. Do not paste it into source code, an issue, or a chat message. The Wrangler alternative is interactive:

```sh
npx wrangler secret put RESEND_API_KEY --config backend/wrangler.local.json
```

Set these non-secret Worker variables:

```json
{
  "AUTH_MAIL_PROVIDER": "resend",
  "AUTH_FROM": "Wonder Lab <login@auth.yvettewu.com>",
  "OWNER_EMAIL": "yvettewu2017@gmail.com"
}
```

`AUTH_FROM` must match a verified Resend sender domain. The app limits sign-in requests to 90 emails per UTC day by default, in addition to recipient and IP limits. Check your actual provider quota and delivery logs before opening the site broadly. This limit does not account for other applications using the same mail account.

The first successful email verification creates an account. The configured owner email maps to the existing site-owner account. Other verified addresses become regular members. Editing a profile cannot change the account email or role.

Verify the live flow with your own email, then a second consenting test user. Confirm that codes arrive, sign-in succeeds, drafts remain private, and each user can only modify their own articles. Do not mark email delivery complete just because the API key exists.

Official references:
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/dashboard/domains/introduction
- https://developers.cloudflare.com/email-service/platform/pricing/

## Alternative Cloudflare provider

The Worker also supports a separate `AUTH_EMAIL` binding with `AUTH_MAIL_PROVIDER=cloudflare`. Arbitrary-recipient sending requires the appropriate Cloudflare paid service and verified sending domain. The existing restricted `EMAIL` notification binding is not sufficient. Do not enable a paid plan without the owner's authorization.
