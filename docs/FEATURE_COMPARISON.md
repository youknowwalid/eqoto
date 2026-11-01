# EQOTO vs. reference platform — feature status

Status: **Complete** = implemented and exercised; **Implemented, untested in prod** = code/SQL written, verified only locally or by mocked-backend smoke test; **Partial**; **Blocked**; **Different by design**.

| Area | Status | Notes |
|---|---|---|
| Landing page | Complete | Content rewritten to remove invented trust claims (regulators, custodians, user counts, sponsors). |
| Authenticated home | Implemented, untested in prod | Ticker, getting-started checklist, community feed, watchlist, movers, trending, earnings, learning, ideas. Portfolio stats/chart/mirrors/activity moved to the "My portfolio" tab. |
| Global search / discover / watchlist | Complete (pre-existing) | Unchanged. |
| Paper trading lifecycle | Implemented; DB logic verified on PostgreSQL 16 | Buy/sell, validation, balance check, avg price, fees, realised P&L, ledger, rejected orders recorded, idempotency + row-lock concurrency. |
| Market data layer | Partial | Provider abstraction + labelling done. **Blocked:** no licensed provider connected (needs contract/API key). |
| Social investing | Implemented, untested in prod | Posts, comments, likes, follows, feeds, trending, rate limits, admin moderation. Original content only. |
| Copy investing | Implemented | Simulated allocation to an investor index; start/stop with persisted records. Does **not** copy real trades. |
| Wallet | Different by design | Simulated deposit/withdraw requests with admin review; no processor. |
| Verification | Implemented | Private document bucket; admin review RPCs. No vendor KYC. |
| Support, academy, calendar, notifications | Complete (pre-existing) + server hardening | |
| Admin | Implemented | Server-side `is_admin()` checks in every RPC and RLS policy; audit log; community moderation added. |
| Roles | Partial | `user` and `admin` only. |
| Real-money trading, live quotes, payments | Intentionally absent | Requires licensed broker/provider and compliance. |
| Pixel-level visual match / copy / media | Different by design | EQOTO uses its own design system and original copy. |
