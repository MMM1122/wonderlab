# Wonder Lab

Bilingual personal journal, signed-in guestbook, owner writing desk, generative ambient audio. Chinese is the initial language; the language preference is device-local. Posts and comments live in Cloudflare D1, not browser storage. Sample entries are shown only until the first real article is published.

## Owner setup

This Site is initially deployed with owner-only platform access. While it is still private, the owner opens the writing desk; the first authenticated account is bound atomically as the journal owner. Every later publishing and editing request checks this stored identity server-side. **Complete owner setup before broadening Sites access.** Authentication comes from dispatch-owned SIWC headers; it is not inferred from the client UI.

## Development

`npm run dev` runs the Vinext preview. Because the current Mac cannot run workerd, development alone aliases the Cloudflare binding to a SQLite adapter in `dev/local-env.ts`. On a fresh checkout, run `node scripts/init-local-db.mjs` before first use. This database and mock sign-in are never shipped. Production builds use the Cloudflare Vite plugin and the D1 binding.

`npm run db:generate` creates schema migrations. `npm run build` builds the Worker and client assets. `npx tsc --noEmit` checks types.

## Validation

Local HTTP checks covered anonymous write rejection, sign-in, owner setup, bilingual article publication and editing, comment persistence, and invalid input rejection. Disposable test entries were removed. Browser automation was unavailable on this host, so visual browser QA, actual audio playback QA, and WebMCP runtime validation could not be completed. The optional WebMCP category tool is feature-detected and uses the same visible filter state.

## Assets

`public/cosmic-garden.png` is original generated artwork. Background music is generated in the browser from sine tones; it starts only after the visitor clicks play. Motion honors reduced-motion preferences.

## Animated prologue

The initial HTML directly renders the forest opening. It no longer depends on a dialog portal, session viewing flags, or the URL hash. Once the image assets load, the 13.9-second prologue automatically starts after 1.1 seconds. The long-haired explorer uses eight individual walking poses, then falls through the geometric tunnel into the cosmic world. Skip/Escape cancel pending timers; the visible header intro button replays from the beginning. Reduced-motion visitors receive a static entrance with direct entry. Asset failures keep the skip/direct-entry controls available.

`public/intro-walk-longhair.png` is a 4-by-2, 1536-by-1024 RGBA walking sprite sheet. Background removal was performed programmatically with the user's explicit permission. The sheet preserves the character's warm colors while removing the neutral checkerboard. The forest and character source art were generated with built-in ImageGen.

## Download

The download includes the source project, final artwork, and a self-contained offline HTML preview. The offline preview shows sample entries; its publishing and sign-in controls lead to the online Site. D1 records (published articles and visitor messages) are not part of a source export. Secrets, credentials, dependency folders, and local development databases are excluded.
