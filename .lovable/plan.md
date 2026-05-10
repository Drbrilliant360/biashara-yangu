## Super Admin Panel for Biashara Yangu

Build a complete super-admin area to manage the entire platform: users, shops, subscriptions, revenue, and platform-wide CRUD.

### 1. Role & Access Control (Database)
Add a proper roles system (separate `user_roles` table — never on profiles, to prevent privilege escalation).

- Create enum `app_role` with values: `super_admin`, `admin`, `user`.
- Create table `user_roles (id, user_id, role, created_at)` with unique `(user_id, role)`.
- Security-definer function `has_role(_user_id, _role)` to safely check roles inside RLS.
- Security-definer function `is_super_admin()` shortcut.
- RLS on `user_roles`: users can read their own roles; only super_admins can insert/update/delete roles.
- Add super_admin override policies on existing tables (`shops`, `profiles`, `subscriptions`, `sales`, `expenses`, `purchases`, `products`, `quotations`) so super admins can read/update/delete everything.
- Seed: provide a one-time SQL the user runs to grant their own account `super_admin` (we'll show them how after migration).

### 2. Frontend — Auth Guard
- `useUserRole()` hook → reads `user_roles` for current user.
- `<RequireSuperAdmin>` wrapper redirects non-admins to `/`.

### 3. Super Admin Layout & Routes
New section under `/admin` with its own sidebar (kept inside `MainLayout` for consistency, but only visible to super admins). Routes:

- `/admin` — Overview dashboard
- `/admin/shops` — All shops (CRUD)
- `/admin/users` — All users (view, change role, deactivate)
- `/admin/subscriptions` — All subscriptions (extend trial, mark paid, cancel)
- `/admin/revenue` — Platform revenue analytics
- `/admin/products` — All products across shops (read + delete)
- `/admin/sales` — All sales across shops (read)

### 4. Overview Dashboard (`/admin`)
KPI cards + charts:
- Total shops (active / inactive)
- Total users
- Active subscribers vs. trial vs. expired
- Total platform revenue (sum of paid subscription amounts)
- MRR estimate (active subs × 5,000 TZS)
- Total sales volume across all shops (TZS)
- Total platform-wide profit (sum of (selling − buying) × qty across all sale_items, joined with products)
- Charts: subscriptions over time, new shops per month, revenue per month (recharts).

### 5. Shops Management (`/admin/shops`)
Table with search + filter (active/inactive). Per row:
- View details (owner, location, phone, currency, created_at, # products, # sales, total revenue)
- Edit (name, location, phone, currency, is_active)
- Delete (with confirm dialog — cascades handled by app logic + warning)
- Toggle active

### 6. Users Management (`/admin/users`)
Table of all profiles joined with auth metadata + roles + subscription status:
- Search by name/phone
- Change role (user / admin / super_admin)
- View shops they own
- Soft-disable (toggle subscription status to `cancelled`)

### 7. Subscriptions (`/admin/subscriptions`)
Table of all subscriptions:
- Filter by status (trial / active / expired / cancelled)
- Extend trial by N days
- Manually mark as paid (sets `status='active'`, `last_payment_date=now()`, `current_period_end=now()+30d`)
- Cancel
- Stats footer: total revenue, active count, churn

### 8. Revenue Analytics (`/admin/revenue`)
- Monthly recurring revenue chart (last 12 months)
- Total lifetime revenue
- Conversion rate (trial → active)
- Top-paying shops/owners table
- Export CSV button

### 9. Bilingual Support
All admin labels in English + Swahili (extend `LanguageContext` translations: "Super Admin", "All Shops", "Subscribers", "Platform Revenue", etc.).

### 10. Navigation
Add a "Super Admin" link in `Sidebar.tsx` and `MobileSidebar.tsx`, only rendered when `useUserRole()` returns `super_admin`.

### Technical Notes
- All admin queries bypass shop scoping by using new RLS policies guarded by `has_role(auth.uid(), 'super_admin')`.
- Use react-query for caching.
- All tables paginated (page size 25) with shadcn `Table` + simple pagination controls.
- Reuse existing UI tokens (semantic colors, no hardcoded hex).
- Charts use existing recharts setup (same as `ReportsPage`).
- After migration, I'll tell the user the exact SQL snippet to run via the data tool to grant themselves `super_admin`.

### Files to Create
- `supabase/migrations/*` — roles + super_admin policies
- `src/hooks/useUserRole.ts`
- `src/components/admin/RequireSuperAdmin.tsx`
- `src/pages/admin/AdminOverviewPage.tsx`
- `src/pages/admin/AdminShopsPage.tsx`
- `src/pages/admin/AdminUsersPage.tsx`
- `src/pages/admin/AdminSubscriptionsPage.tsx`
- `src/pages/admin/AdminRevenuePage.tsx`
- `src/pages/admin/AdminProductsPage.tsx`
- `src/pages/admin/AdminSalesPage.tsx`
- Edit `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileSidebar.tsx`, `src/context/LanguageContext.tsx`

Approve to proceed — I'll start with the database migration, then build the UI.