# EQOTO — practice investing platform

A complete, original investing-platform concept for the fictional brand **EQOTO**: a marketing site, a member dashboard and an admin panel, backed by Supabase.
React 19 + Vite 6 + Tailwind CSS v4, no UI or backend SDK dependencies (a ~200-line Supabase client lives in `src/lib/supabase.js`).

| Area | Route | What is in it |
|---|---|---|
| Marketing site | `/` | Landing page with generated art, portraits and QR code |
| Sign up / log in | `/signup`, `/login` | Email + password, referral codes (`?ref=`) |
| Member dashboard | `/app/*` | Home (ticker, onboarding, community feed), Community, Watchlist, Portfolio, Discover, Wallet (deposit / withdraw / history), Mirror Pro Investors, Agent Portfolios, Economic Calendar, EQOTO Club, Invite Friends, Verification Centre (document upload), Settings (6 sections), Help (tickets), Academy, Pulse, App Store; real and demo accounts; trade drawer |
| Admin panel | `/admin/*` | Overview, Users (roles, suspend, adjust balance, notify), Verification queue (private document preview), Transactions (approve / decline), Markets (set prices, market shock), Investors, Support inbox, Content (lessons, calendar), Broadcasts, Platform settings, Audit log |

## Backend (Supabase)
The full schema, RLS policies and RPC functions are version-controlled in `supabase/migrations/` (idempotent, non-destructive). Money, orders and every admin action go through `SECURITY DEFINER` functions (`place_order`, `request_withdrawal`, `admin_review_tx`, …) that validate the caller server-side, so the browser can never write balances directly. KYC documents are stored in a private `kyc` bucket.
Setup, market-data and external-integration notes: [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md). Feature status: [`docs/FEATURE_COMPARISON.md`](docs/FEATURE_COMPARISON.md).
The project URL and the **publishable** key are in `src/lib/config.js` (public by design); override with `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`.

To make someone an admin: `update public.profiles set role = 'admin' where email = 'you@example.com';`

## Develop
```
npm install
npm run dev
npm run build          # production build in /dist (Vercel runs this)
npm run build:single   # offline single-file build (dist-standalone/eqoto.html)
```

## Important
EQOTO is a **paper-trading and education platform**. Prices are simulated unless an instrument is explicitly marked as a licensed feed, balances are simulated, investors and returns are illustrative, and no real money moves. EQOTO is not a broker, bank or regulated service. Legal text must be written by a qualified person before any real launch.

## Where to change things
| What | File |
|---|---|
| Brand name, tagline, disclosure, storage keys | `src/brand.js` |
| Marketing copy | `src/content.js` |
| Colours | `@theme` block in `src/index.css` |
| Price sources | `src/lib/marketData.js` |
