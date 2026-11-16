# Biashara Yangu — iOS app (Folder 2, App Store compliant build)

Capacitor wrapper that packages the web app (`../src`) as a native iOS app.
App id: `tz.co.biasharayangu.app` · iOS 13+ · **No in-app payments** (see below).

## Requirements (on a Mac)
Xcode 15+ (Capacitor 6), CocoaPods (`sudo gem install cocoapods` or `brew install cocoapods`), Node 20+,
an Apple Developer account.

> This project was generated on a machine without full Xcode, so `pod install` has **not** been run
> and the app has **not** been compiled for iOS here. Step 2 below does that.

## Build & run
```bash
cd mobile-ios
npm install
npm run sync                 # build web (native mode) + copy to ios/ + pod install
npm run open                 # opens ios/App/App.xcworkspace
```
In Xcode: select the **App** target → Signing & Capabilities → choose your Team (bundle id
`tz.co.biasharayangu.app`, change if taken) → Run on a simulator/device → Product ▸ Archive → Distribute to App Store Connect.
Bump `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` for each upload. After Pods install, open
Xcode ▸ Product ▸ Generate Privacy Report to confirm it matches `ios/App/App/PrivacyInfo.xcprivacy`.

## How this build follows the App Store Review Guidelines

| Guideline | What was done |
|---|---|
| **3.1.1 / 3.1.3** In-App Purchase | The subscription is paid with mobile money (Snippe), which Apple does not allow for unlocking app features. On iOS `canPayInApp()` is `false`: `PaymentDialog` renders nothing; Pay/Renew buttons, prices and "pay now" wording are removed (`SubscriptionWidget`, `SubscriptionReminder`, Settings → Billing). No external links or instructions to pay elsewhere are shown. Covered by unit tests. |
| **5.1.1(v)** Account deletion | Settings → Profile → *Delete account* (type DELETE) calls the `delete-account` Supabase edge function, which deletes the user's shops/data and auth user. **You must deploy it:** `supabase functions deploy delete-account`. |
| **5.1.1 / 5.1.2** Privacy | `/privacy` policy page linked from Login, Register and Settings. `PrivacyInfo.xcprivacy` added to the Xcode project. No tracking, no ATT prompt needed. App Store Connect → App Privacy: Email, Name, Other user content — linked to user, not used for tracking. |
| **5.1.2(i)** Sharing with third-party AI | Mauzo AI shows what is sent and requires a one-time "I agree" before any data leaves the device. |
| **4.2** Minimum functionality | Real app, not a link: native splash, status bar, keyboard handling, safe areas, share-sheet export, offline-safe bundle (all JS/CSS ships inside the app; no remote scripts). |
| **2.1** Completeness | Provide App Review with a **demo account** (email/password with a sample shop) in App Store Connect → App Review Information, and make sure the Supabase project is live. |
| **4.8** Sign in with Apple | Not required: only email/password login is used (no third-party social login). If you add Google/Facebook login later, add Sign in with Apple too. |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` (standard HTTPS only). |

### Things only you can decide
- Hiding payment UI means an iOS user whose subscription has expired sees "Your access period has ended" with no way to pay in-app. If you want iOS users to subscribe, implement StoreKit In-App Purchase (e.g. RevenueCat) — requires an Apple Developer account and App Store Connect products.
- Set the App Store *Privacy Policy URL* to `https://www.biashara-yangu.co.tz/privacy` (deploy the web app first).
- Replace the placeholder support email on the Terms page with a real monitored address (Apple requires a working support contact).

## Regenerate icons
Replace `resources/icon-only.png` (1024×1024, **no transparency**) then `npm run assets`.
