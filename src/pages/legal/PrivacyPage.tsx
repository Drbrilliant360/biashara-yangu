import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHead } from '@/components/seo/PageHead';

const sections = [
  {
    title: '1. Information we collect',
    body: 'Account details (name, email), the business data you enter (shops, products, sales, purchases, expenses, quotations, customers and staff), and basic technical data needed to keep the service secure. We do not collect your location, contacts, photos or advertising identifiers, and we do not track you across other apps or websites.',
  },
  {
    title: '2. How we use it',
    body: 'Only to provide Biashara Yangu: to sign you in, store and display your business records, generate reports and documents, and process subscription payments where available.',
  },
  {
    title: '3. AI assistant (Mauzo AI)',
    body: 'If you choose to use Mauzo AI, your question and a summary of the selected shop\'s current-month data (for example product names, stock, sales and expense totals) are sent to a third-party AI provider to generate an answer. This only happens when you send a message to Mauzo AI and after you agree in the app. Data is not used to advertise to you.',
  },
  {
    title: '4. Payments',
    body: 'Where subscription payments are offered (web and Android), mobile-money payments are processed by our payment provider. We never see your mobile-money PIN. The iOS app does not offer in-app payments.',
  },
  {
    title: '5. Sharing',
    body: 'We do not sell your data. We share it only with service providers that host and run the platform (database, authentication, payments, AI) and when required by law.',
  },
  {
    title: '6. Retention and deletion',
    body: 'We keep your data while your account is active. You can permanently delete your account and all data you own at any time in the app: Settings → Profile → Delete account. Deletion is immediate and cannot be undone.',
  },
  {
    title: '7. Security',
    body: 'Data is transmitted over HTTPS and protected by per-user access rules so each user can only access their own shops and staff-assigned shops.',
  },
  {
    title: '8. Children',
    body: 'Biashara Yangu is a business tool and is not directed to children under 13.',
  },
  {
    title: '9. Contact',
    body: 'For privacy questions or requests, contact us through the app settings or at the support email shown on the Terms page.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <PageHead title="Privacy Policy" description="How Biashara Yangu collects, uses and protects your data." path="/privacy" />
      <header className="bg-background border-b sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Biashara Yangu Privacy Policy</h2>
                <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
              </div>
            </div>
            <div className="space-y-6">
              {sections.map((s) => (
                <section key={s.title} className="border-b last:border-b-0 pb-5 last:pb-0">
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-foreground/90 leading-relaxed">{s.body}</p>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
