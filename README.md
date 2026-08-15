# Biashara Yangu — Platform Documentation

> **Language:** English & Swahili (bilingual UI and reports)  
> **Stack:** React 18 · Vite 5 · TypeScript 5 · Tailwind CSS v3 · Supabase backend  
> **Project type:** Multi-shop business management platform (inventory, sales, quotations, expenses, subscriptions, AI insights)

---

## 1. What the platform does

Biashara Yangu lets a business owner create one or more independent shops and manage them from a single account. Each shop tracks products, stock, sales, purchases, quotations, expenses, customers, and staff roles. A built-in AI assistant (Mauzo AI) answers business questions using live shop data. Super admins can manage shops, users, subscriptions, and platform-wide revenue.

Key modules:
- **Inventory** — products, stock levels, low-stock alerts, purchases
- **Sales & Quotations** — sales records and printable quotations (POS removed in favor of quotations)
- **Expenses** — categorized business spending
- **Customers** — customer records linked to sales
- **Dashboard & Reports** — revenue, profit, trends, exportable reports
- **Subscriptions & Billing** — trial periods, Snippe.sh mobile payments, registration fee tracking
- **Admin** — super admin panel for platform oversight
- **Invoice Generator** — free public tool to generate branded PDF invoices

---

## 2. Database structure

### 2.1 Core entity model

```text
auth.users (Supabase managed)
    │
    ├──► profiles          (one-to-one, user details + default role)
    │
    ├──► shops             (one owner can own many shops)
    │      │
    │      ├──► products
    │      ├──► sales  ──► sale_items
    │      ├──► purchases ──► purchase_items
    │      ├──► quotations ──► quotation_items
    │      ├──► expenses
    │      └──► shop_users (staff/roles per shop)
    │
    ├──► subscriptions     (one per user, billing lifecycle)
    │      │
    │      └──► subscription_events (audit log of status/payment changes)
    │
    └──► user_roles        (global roles: super_admin, admin, user)
```

### 2.2 Table reference

| Table | Purpose | Key links |
|-------|---------|-----------|
| `profiles` | Public mirror of `auth.users`; stores full name, phone, avatar, role. | `user_id → auth.users.id` |
| `shops` | A business unit. Owned by a user. Has currency, logo, location. | `owner_id → auth.users.id` |
| `shop_users` | Staff members assigned to a shop with a role. | `shop_id → shops.id`, `user_id → auth.users.id` |
| `products` | Catalog items per shop. Tracks buying price, selling price, stock. | `shop_id → shops.id` |
| `sales` | Header for each completed sale. | `shop_id → shops.id`, `user_id → auth.users.id` |
| `sale_items` | Line items of a sale. | `sale_id → sales.id`, `product_id → products.id` |
| `purchases` | Stock purchase headers. | `shop_id → shops.id`, `user_id → auth.users.id` |
| `purchase_items` | Line items of a purchase. | `purchase_id → purchases.id`, `product_id → products.id` |
| `quotations` | Customer quotations (replaced POS workflow). | `shop_id → shops.id`, `user_id → auth.users.id` |
| `quotation_items` | Line items of a quotation. | `quotation_id → quotations.id`, `product_id → products.id` |
| `expenses` | Business expenses per shop. | `shop_id → shops.id`, `user_id → auth.users.id` |
| `subscriptions` | User subscription lifecycle: trial, active, expired, amount, dates. | `user_id → auth.users.id` |
| `subscription_events` | Immutable audit of every subscription change. | `subscription_id → subscriptions.id` |
| `user_roles` | Global role assignments for super admin features. | `user_id → auth.users.id` |

### 2.3 Important columns

- `products.buying_price` — cost of one unit (used for COGS/profit)
- `products.selling_price` — standard price before discounts
- `products.stock_quantity` — current on-hand quantity
- `products.min_stock_level` — threshold for low-stock warnings
- `sales.subtotal / discount / tax / total` — header-level totals
- `sale_items.unit_price / discount / total` — line-level totals
- `purchases.total_amount / payment_status` — purchase cost and whether it is paid
- `expenses.amount / expense_date / category` — operating expenses
- `subscriptions.status / trial_end / current_period_end / amount` — billing state

### 2.4 Database triggers

| Trigger | What it does |
|---------|--------------|
| `handle_new_user` | Creates the `profiles` row when a new `auth.users` row is inserted. |
| `handle_new_user_subscription` | Creates a trial `subscriptions` row for every new user. |
| `update_stock_after_sale` | Decrements `products.stock_quantity` when a sale is recorded. |
| `update_stock_after_purchase` | Increments `products.stock_quantity` when a purchase is recorded. |
| `log_subscription_event` | Writes a row to `subscription_events` whenever `subscriptions` changes status/payment. |
| `prevent_role_change` | Blocks users from changing their own `role` in `profiles`. |
| `update_updated_at_column` | Auto-updates `updated_at` timestamps. |

---

## 3. Business calculations

All calculations are scoped to a single `shop_id`. Data is never mixed across shops.

### 3.1 Revenue

Revenue is the sum of completed sale totals for the selected period:

```text
Revenue = SUM(sales.total)
WHERE sales.shop_id = :shop_id
  AND sales.created_at BETWEEN :start AND :end
```

`sales.total` is calculated at creation time as:

```text
sales.total = sales.subtotal - sales.discount + sales.tax
```

### 3.2 Cost of Goods Sold (COGS)

COGS is computed from the actual line items sold, using each product’s current `buying_price`:

```text
COGS = SUM(sale_items.quantity × products.buying_price)
WHERE sale_items.sale_id IN (sales for the shop/period)
```

If a product’s buying price changes later, historical COGS is **not** recalculated — it uses the buying price read at report time.

### 3.3 Purchases

Purchases represent stock bought during the period:

```text
Purchases = SUM(purchases.total_amount)
WHERE purchases.shop_id = :shop_id
  AND purchases.purchase_date BETWEEN :start AND :end
```

### 3.4 Expenses

Operating expenses are summed directly:

```text
Expenses = SUM(expenses.amount)
WHERE expenses.shop_id = :shop_id
  AND expenses.expense_date BETWEEN :start AND :end
```

### 3.5 Net Profit

The dashboard uses this formula:

```text
Net Profit = Revenue - COGS - Expenses - Purchases
```

Breakdown columns shown:
- Revenue
- COGS
- Expenses
- Purchases
- Net Profit

> **Note:** Purchases are treated as a cash-outflow deduction in this dashboard view, separate from COGS.

### 3.6 Stock valuation

```text
Stock Value = SUM(products.stock_quantity × products.buying_price)
WHERE products.shop_id = :shop_id
```

### 3.7 Low-stock flag

A product is flagged when:

```text
products.stock_quantity <= products.min_stock_level
```

### 3.8 Gross margin per product

```text
Gross Margin = selling_price - buying_price
Margin %     = (selling_price - buying_price) / selling_price × 100
```

### 3.9 Subscription billing

- New users start on a **trial**.
- Subscription status values: `trial`, `active`, `expired`, `cancelled`.
- `current_period_end` is extended when a payment is confirmed.
- `amount` is the recurring subscription price.
- Registration fee tracking exists in the schema but is currently disabled in the UI.

---

## 4. Multi-tenancy & access control

### 4.1 Shop isolation

Every business table has `shop_id`. RLS policies ensure:

- A user sees only shops they own or are assigned to via `shop_users`.
- Product, sales, purchase, quotation, and expense data is filtered by `shop_id`.
- Switching shops clears the React Query cache and refetches data for the new shop.

### 4.2 Roles

Two role systems exist:

1. **Global roles** (`user_roles` table + `app_role` enum)
   - `super_admin` — platform-wide admin access
   - `admin`
   - `user`

2. **Per-shop roles** (`shop_users.role`)
   - `owner`
   - `manager`
   - `cashier`
   - `stock keeper`
   - `accountant`
   - `viewer`

Access helpers (security definer functions) check ownership/staff membership without causing RLS recursion.

### 4.3 RLS rules of thumb

- `CREATE TABLE` in `public` is always followed by `GRANT` statements in the same migration.
- `service_role` is granted on tables touched by Edge Functions or admin code.
- Internal trigger/helper functions live in a `private` schema and are not executable by `anon`.

---

## 5. Payments (Snippe.sh)

The platform uses Snippe.sh for real mobile payments.

Flow:
1. `snippe-create-payment` Edge Function calls Snippe.sh with amount, phone number, and a `webhook_url`.
2. Snippe.sh sends a USSD push to the customer’s phone.
3. `snippe-check-payment` Edge Function is called by the webhook (or polled) to verify status.
4. On success, the subscription is extended and a `subscription_events` audit row is written.
5. `last_payment_reference` prevents duplicate crediting.

---

## 6. Edge Functions

| Function | Purpose |
|----------|---------|
| `mauzo-ai` | Answers natural-language business queries using shop data + Lovable AI Gateway. |
| `snippe-create-payment` | Initiates a Snippe.sh payment request. |
| `snippe-check-payment` | Verifies and records a completed payment. |

---

## 7. Public pages

These routes do **not** require login:

- `/invoice-generator` — generate and download branded PDF invoices
- `/terms` — terms and conditions
- `/login` and `/register` — authentication

---

## 8. Development notes

- Client import for Supabase: `import { supabase } from "@/integrations/supabase/client"`
- Auto-generated files to avoid editing: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`
- Currency is set per shop in `shops.currency`.
- All dates are stored as `timestamptz` / `date` in UTC; the UI formats them for the user.

---

## 9. Glossary

| Term | Meaning |
|------|---------|
| **Mauzo** | Swahili for “sales” — also the name of the AI assistant. |
| **COGS** | Cost of Goods Sold — what sold stock cost the business. |
| **Net Profit** | Revenue minus all operating deductions (COGS, expenses, purchases). |
| **Quotation** | A price estimate given to a customer before a sale. |
| **RLS** | Row Level Security — database rules that enforce data access per user. |
| **Shop** | An independent business unit inside the platform. |

---

*Last updated: 2026-08-15*
