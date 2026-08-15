import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHead } from '@/components/seo/PageHead';

const sections = [
  {
    title: '1. Acceptance of Terms',
    swahili: 'Kubali Masharti',
    body: 'By accessing or using Biashara Yangu, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.',
    swahiliBody: 'Kwa kufikia au kutumia Biashara Yangu, unakubali kufungwa na Masharti haya. Ikiwa hukubali, tafadhali usitumie jukwaa.',
  },
  {
    title: '2. Description of Service',
    swahili: 'Maelezo ya Huduma',
    body: 'Biashara Yangu provides tools to manage inventory, sales, quotations, expenses, customers, and business insights for one or more shops.',
    swahiliBody: 'Biashara Yangu hutoa zana za kusimamia hesabu, mauzo, quotation, gharama, wateja, na ufahamu wa biashara kwa duka moja au zaidi.',
  },
  {
    title: '3. User Accounts',
    swahili: 'Akaunti za Watumiaji',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
    swahiliBody: 'Wewe una jukumu la kuhifadhi siri ya taarifa za kuingia kwenye akaunti yako na shughuli zote zinazotokea chini ya akaunti yako.',
  },
  {
    title: '4. Subscription & Payments',
    swahili: 'Usajili na Malipo',
    body: 'Some features require an active subscription. Fees are billed as shown at checkout and are non-refundable unless required by law.',
    swahiliBody: 'Baadhi ya vipengele vinahitaji usajili wa kulipia. Ada zinalipwa kama ilivyoonyeshwa wakati wa kulipa na hazirudishwi isipokuwa sheria inayohitaji.',
  },
  {
    title: '5. Data Ownership & Privacy',
    swahili: 'Umiliki wa Data na Faragha',
    body: 'You retain ownership of your business data. We process it in accordance with our privacy practices and only to provide and improve the service.',
    swahiliBody: 'Unadumisha umiliki wa data yako ya biashara. Tunaihifadhi kwa mujibu wa sera yetu ya faragha na kwa lengo la kutoa na kuboresha huduma.',
  },
  {
    title: '6. Acceptable Use',
    swahili: 'Matumizi Yanayoruhusiwa',
    body: 'You may not use the platform for unlawful purposes, transmit malicious code, attempt unauthorized access, or interfere with other users.',
    swahiliBody: 'Huruhusiwi kutumia jukwaa kwa madhumuni yasiyo halali, kutuma programu hatari, kujaribu kufikia bila idhini, au kuingilia wengine.',
  },
  {
    title: '7. Intellectual Property',
    swahili: 'Mali ya Kiakili',
    body: 'All trademarks, logos, software, and content provided by Biashara Yangu remain our property or that of our licensors.',
    swahiliBody: 'Alama za biashara, nembo, programu, na maudhui yaliyotolewa na Biashara Yangu ni mali yetu au ya waliotupa leseni.',
  },
  {
    title: '8. Limitation of Liability',
    swahili: 'Kikomo cha Dhamana',
    body: 'We are not liable for indirect, incidental, or consequential damages arising from your use of the platform beyond the amount paid in the last 12 months.',
    swahiliBody: 'Hatubebei dhamana kwa uharibifu usio wa moja kwa moja au wa matokea yatokanayo na matumizi yako ya jukwaa zaidi ya kiasi kilicholipwa miezi 12 iliyopita.',
  },
  {
    title: '9. Termination',
    swahili: 'Kumaliza Makubaliano',
    body: 'We may suspend or terminate your account if you violate these terms. You may also delete your account at any time from the settings page.',
    swahiliBody: 'Tunaweza kusitisha au kumaliza akaunti yako ikiwa unakiuka masharti haya. Unaweza pia kufuta akaunti yako wakati wowote kutoka kwenye ukurasa wa mipangilio.',
  },
  {
    title: '10. Changes to Terms',
    swahili: 'Mabadiliko ya Masharti',
    body: 'We may update these terms from time to time. Continued use of the platform after changes means you accept the revised terms.',
    swahiliBody: 'Tunaweza kusasisha masharti haya mara kwa mara. Matumizi yako ya jukwaa baada ya mabadiliko yanamaanisha unakubali masharti yaliyorekebishwa.',
  },
  {
    title: '11. Governing Law',
    swahili: 'Sheria Inayotumika',
    body: 'These terms are governed by the laws of the United Republic of Tanzania.',
    swahiliBody: 'Masharti haya yanatwaliwa na sheria za Jamhuri ya Muungano wa Tanzania.',
  },
  {
    title: '12. Contact',
    swahili: 'Mawasiliano',
    body: 'For questions about these terms, contact us through the settings or support channels within the app.',
    swahiliBody: 'Kwa maswali kuhusu masharti haya, wasiliana nasi kupitia mipangilio au njia za msaada zilizopo katika programu.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <PageHead
        title="Terms & Conditions"
        description="Read the terms and conditions for using Biashara Yangu. English and Swahili summaries included."
        path="/terms"
      />

      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-lg font-semibold">Terms & Conditions</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Biashara Yangu Terms & Conditions</h2>
                <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-8">
              The English version below is the legally binding document. The Swahili summary is provided for convenience only.
            </p>

            <div className="space-y-8">
              {sections.map((section) => (
                <section key={section.title} className="border-b last:border-b-0 pb-6 last:pb-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{section.title}</h3>
                  <p className="text-foreground/90 leading-relaxed mb-3">{section.body}</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      {section.swahili}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{section.swahiliBody}</p>
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
              If you have any questions, reach out through the app settings or email{' '}
              <a href="mailto:support@biashara-yangu.lovable.app" className="text-primary hover:underline">
                support@biashara-yangu.lovable.app
              </a>
              .
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
