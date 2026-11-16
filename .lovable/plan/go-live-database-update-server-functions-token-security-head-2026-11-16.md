# Go-live: database update, server functions, token, security header

## Important differences from your checklist
- **No separate staging database.** This project has one backend that serves both the preview and the live site. I can't apply to "staging first". Instead I'll do a dry-run check against real data before applying.
- **No manual `supabase functions deploy`.** Server functions deploy from here with the built-in deploy step.
- **Order:** I'll apply the database update first, then deploy functions. Sales, purchases and quotations stay broken for the shortest time this way.

## Steps
1. **Pre-check the data.** The update adds rules that block negative prices, quantities and amounts on products, sales, purchases, quotations and expenses. I'll first count existing rows that break these rules. If any exist, I'll stop and show them to you before going further, because they would make the update fail.
2. **Apply the database update** (`20261117090000_audit_atomic_hardening.sql`) exactly as written. It adds:
   - atomic create sale / purchase / quotation actions
   - a single stock-update trigger, replacing duplicates that were counting stock twice
   - an audit log, and a guard that stops the last super admin from being removed
   - speed indexes
3. **Deploy server functions:** snippe-create-payment, snippe-check-payment, mauzo-ai, delete-account.
4. **Verify:** sign in on the preview and record one test sale, purchase and quotation. Confirm stock changes once and the records show up. Run the existing hardening tests.
5. **Security header:** open the live site (biashara-yangu.lovable.app and www.biashara-yangu.co.tz) in a headless browser and collect any "Content Security Policy" console warnings across the main pages (login, dashboard, products, sales, payment dialog, Mauzo AI). If there are none, rename the header in `vercel.json` to the enforcing version and update SECURITY.md. If there are some, fix the allow-list first.
   - Note: this header only applies on Vercel hosting. The lovable.app domain does not use `vercel.json`.
6. **PalmPesa token:** you have to do this yourself in your PalmPesa account, because I can't access it. Nothing in the app uses PalmPesa any more, so you don't need to add a new key here afterwards.

## After this
Publish the app so the live site picks up the new frontend and the enforcing header.
