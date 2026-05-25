# Port `sammy-store` into this Lovable project

Good news: the repo is already a Lovable TanStack Start project on the same stack as this one (React 19, TanStack Start, Vite 7, Tailwind v4, Supabase). No framework porting needed — this is a file copy + backend re-provision.

## What's in the source repo

- **Pages (~25 routes)**: index, login, signup, products, categories, support, for-buyers, for-sellers, become-seller
- **Buyer dashboard**: dashboard (catalog, orders, seller, settings, wallet)
- **Seller area**: seller (orders, product-logins, products, withdrawals)
- **Admin panel**: admin (users, sellers, products, product-logins, coupons, transactions, withdrawals, wallet-funding, notifications, suspended, settings)
- **Webhooks**: `/api/public/monnify-webhook`, `/api/public/nowpayments-webhook`
- **Server functions**: payments, nowpayments, support
- **Backend**: 6 Supabase migrations (schema + RLS), auth middleware, admin/client supabase setup
- **Components**: admin sidebar, admin page, auth nav, AI support FAB, contact developer FAB

## Plan

1. **Enable Lovable Cloud** in this project (provisions a fresh Supabase instance — needed for auth, db, and webhooks).
2. **Install missing dependencies**: `@lovable.dev/cloud-auth-js`, `@supabase/supabase-js`, `react-icons`. (All other deps already match.)
3. **Copy source files** verbatim from the GitHub repo into this project:
   - All files under `src/routes/` (except `__root.tsx`, `index.tsx`, `routeTree.gen.ts` — those need a merge/overwrite decision; default: overwrite with repo versions since this project is a blank template)
   - All files under `src/components/` (the repo's custom components — UI primitives already exist here)
   - `src/hooks/use-auth.tsx`, `src/hooks/use-is-admin.tsx`
   - `src/lib/*.functions.ts`
   - `src/integrations/lovable/` and `src/integrations/supabase/` (replace this project's `client.ts`/`client.server.ts`/etc. so they point at the newly provisioned Cloud project — keys come from Cloud, not the repo's `.env`)
   - `src/styles.css` (repo version, for the design tokens it uses)
   - `public/.htaccess` if relevant
4. **Apply the 6 Supabase migrations** to the new Cloud database in chronological order — this rebuilds tables, RLS policies, functions, and triggers.
5. **Set required secrets** in Lovable Cloud. The repo uses NOWPayments and Monnify (Nigerian payment gateway). Likely needed:
   - `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`
   - `MONNIFY_API_KEY`, `MONNIFY_SECRET_KEY`, `MONNIFY_CONTRACT_CODE`
   - Any others discovered while reading the server functions
6. **Verify**: build passes, homepage renders, login/signup flow works, admin route is gated, webhooks reachable at `/api/public/*`.

## Open questions before I start

1. **Auth/data**: the source repo has its own Supabase project with existing users and product data. I'll provision a **fresh** Cloud backend here — the schema will be recreated, but **data won't transfer**. Is that fine? (Moving data requires you to export from the old project and import after — happy to do that as a follow-up.)
2. **Payment secrets**: do you have the NOWPayments + Monnify API keys ready to paste in once Cloud is enabled? If you want to use sandbox/test keys first, that's fine too.
3. **Default behavior**: I'll overwrite this project's placeholder `index.tsx`, `__root.tsx`, and `styles.css` with the repo versions. Confirm that's what you want (vs. trying to keep anything from the current template).

Once you confirm, I'll switch to build mode and execute steps 1–6.
