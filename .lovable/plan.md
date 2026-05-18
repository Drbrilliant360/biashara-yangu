## Goal

1. Make sure each user only sees their own shop(s) — no cross-tenant leakage.
2. Fix the error you see on the published/Vercel URL when navigating back and forth.

---

## 1. Shop isolation audit & hardening

Current RLS on `shops`:

- `Users can view shops they own or work at` → `(owner_id = auth.uid()) OR user_has_shop_access(id)`
- `Super admins full access shops select` → `is_super_admin()`

In theory a normal user can only see a shop if they are the owner, are listed in `shop_users` for it, or are a super_admin. If you're seeing other people's shops as a normal user, the most likely causes are:

- Your test account has a `super_admin` role in `user_roles` (so RLS lets them see everything).
- Some shop has a stray `shop_users` row linking your account to it.

What I'll do:

- Run a read-only check on `user_roles` and `shop_users` to confirm which case it is.
- Tighten the SELECT policy on `shops` so it's split clearly: one policy for owners, one for explicit `shop_users` members, one for super_admins. No `OR` ambiguity.
- Add the same explicit owner-only model to the shop switcher query: `select('*').eq('owner_id', user.id)` as a defense-in-depth filter in `ShopContext.loadShops` (so even if RLS ever loosens, the client only requests its own shops).
- Verify dependent tables (`products`, `sales`, `purchases`, `expenses`, `quotations`, `sale_items`, `purchase_items`, `quotation_items`) all gate on `user_has_shop_access(shop_id)` — they already do, but I'll re-confirm after the shop policy changes still resolve correctly.

If you want me to also stop staff (shop_users) from seeing the owner's *other* shops they aren't assigned to, that's already the case — `user_has_shop_access(id)` checks per-shop membership.

## 2. Published-site error (Vercel)

You mentioned the live URL shows a "Vercel error" when you go back/forward. Two things are almost certainly going on:

a) **SPA 404 on direct/refresh navigation.** Vercel doesn't know to fall back to `index.html` for client routes like `/customers` unless you tell it to. When the browser back/forward hits a path that Vercel treats as a static request, it returns its built-in 404 page. Fix: add `vercel.json` at the project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

b) **Missing environment variables on Vercel.** The app needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set in the Vercel project's Environment Variables, then redeployed. Without them, the Supabase client crashes on first auth call and React Router can throw a runtime error on navigation.

Note: if you publish via **Lovable's own publish button** (`*.lovable.app`), SPA routing is handled automatically and you don't need `vercel.json`. The `vercel.json` only matters for your Vercel deployment.

## 3. Back/forward UX polish

Add a small `ScrollToTop` component mounted inside `<BrowserRouter>` so each route change resets scroll. This won't fix a true error, but it removes the "feels broken when I navigate back" perception that often gets reported alongside SPA-fallback issues.

---

## Files I'll touch

- `supabase/migrations/<new>.sql` — split shops SELECT policy into owner / member / super_admin.
- `src/context/ShopContext.tsx` — add `.eq('owner_id', user.id)` filter to `loadShops` as defense-in-depth.
- `src/components/ScrollToTop.tsx` — new tiny component.
- `src/App.tsx` — mount `<ScrollToTop />` inside `<BrowserRouter>`.
- `vercel.json` — new file at project root for SPA fallback.

## What I will NOT change

- Auth flow, registration, billing, RegistrationFeeBanner, sidebar/branding/colors — all stay as is.
- Lovable publish flow — still works exactly the same.

## Open question for you

For the Vercel error specifically: can you confirm whether the "live URL" you mean is `https://biashara-smart-pos-system.lovable.app` (Lovable's hosting) or a separate `*.vercel.app` URL you deployed yourself? If it's the Lovable one, the `vercel.json` step is unnecessary and the error is something else — I'll need a screenshot or the exact error text to keep going on that part.
