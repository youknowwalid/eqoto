# Finvero — investing platform demo

A complete, original investing-platform concept for the fictional brand **Finvero**: a marketing site, a member dashboard and an admin panel, backed by Supabase.
React 19 + Vite 6 + Tailwind CSS v4, no UI or backend SDK dependencies (a ~200-line Supabase client lives in `src/lib/supabase.js`).

| Area | Route | What is in it |
|---|---|---|
| Marketing site | `/` | Landing page with generated art, portraits and QR code |
| Sign up / log in | `/signup`, `/login` | Email + password, referral codes (`?ref=`) |
| Member dashboard | `/app/*` | Home, Watchlist, Portfolio, Discover, Wallet (deposit / withdraw / history), Mirror Pro Investors, Agent Portfolios, Economic Calendar, Finvero Club, Invite Friends, Verification Centre (document upload), Settings (6 sections), Help (tickets), Academy, Pulse, App Store; real and demo accounts; trade drawer |
| Admin panel | `/admin/*` | Overview, Users (roles, suspend, adjust balance, notify), Verification queue (private document preview), Transactions (approve / decline), Markets (set prices, market shock), Investors, Support inbox, Content (lessons, calendar), Broadcasts, Platform settings, Audit log |

## Backend (Supabase)
All data lives in Postgres with row-level security. Money, orders and every admin action go through `SECURITY DEFINER` functions (`place_order`, `request_withdrawal`, `admin_review_tx`, …), so the browser can never write balances directly. KYC documents are stored in a private `kyc` bucket. The admin role can only be set in the database or by another admin.
The project URL and the **publishable** key are in `src/lib/config.js` (they are public by design); override them with `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`.

To make someone an admin, run in the Supabase SQL editor: `update public.profiles set role = 'admin' where email = 'you@example.com';`

## Develop
```
npm install
npm run dev
npm run build          # production build in /dist (Vercel runs this)
npm run build:single   # offline single-file build (dist-standalone/finvero.html)
```

## Important
Everything is **simulated sample content**: prices, investors, returns, balances, fees, regulators and partners are invented. Do not use it to take real money. The legal text must be replaced by a qualified person before any real launch.

---

## Where to change things
| What | File |
|---|---|
| ALL text, numbers, links, names, footer, fictional tickers | `src/content.js` |
| QR code destination | `brand.qrTarget` in `src/content.js` |
| Colours | `@theme` block in `src/index.css` |
| Sections / layout | `src/components/*.jsx` (one file per section) |

## 4. Before any public launch — replace the sample content
Everything below is **invented illustration**, not fact:
- Stats (users, years, countries), fees ($0.99, 0.25%…), protection amounts
- Regulators / entities (EQ Markets UK…), custodian banks, compensation schemes
- Investor names, returns and follower counts; ticker prices (live ticks are simulated)
- Partner wordmarks and sports-club crests
- Legal footer text — have a qualified person write the real disclosures

The page carries a visible "demonstration brand" notice; remove it only when the content is real and verified.
Note: the brand mark and artwork are original and not taken from any other company.
