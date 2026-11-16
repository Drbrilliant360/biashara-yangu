import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle, ArrowRight, BarChart3, Check, FileDown, FileText, Globe,
  Package, Receipt, Sparkles, Store, Wallet,
} from 'lucide-react';
import { PageHead } from '@/components/seo/PageHead';

const display = { fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" } as const;

const features = [
  { icon: Package, title: 'Inventory and low-stock alerts', body: 'Know what is on the shelf and get warned before a best seller runs out.' },
  { icon: Receipt, title: 'Sales records', body: 'Record every sale with items, discounts and payment method. Stock updates by itself.' },
  { icon: FileText, title: 'Quotations', body: 'Build multi-product quotations with VAT and export them to PDF, Excel or Word.' },
  { icon: Wallet, title: 'Expenses and purchases', body: 'Log spending by category and supplier so profit is never a guess.' },
  { icon: BarChart3, title: 'Reports you can share', body: 'Revenue, profit and product performance by date range, exported to PDF or Excel.' },
  { icon: Store, title: 'Many shops, one account', body: 'Switch between shops in a tap and give staff their own access.' },
  { icon: Sparkles, title: 'Mauzo AI assistant', body: 'Ask questions about your shop and get answers from your own numbers.' },
  { icon: Globe, title: 'English and Kiswahili', body: 'Use the whole app in the language you and your team are most comfortable with.' },
  { icon: FileDown, title: 'Free invoice generator', body: 'Create a clean PDF invoice in seconds, even without an account.' },
];

const stats = [
  { label: 'Revenue', value: 'TZS 4.2M' },
  { label: 'Profit', value: 'TZS 1.1M' },
  { label: 'Products', value: '248' },
  { label: 'Low stock', value: '3' },
];

const bars = [
  { h: 40, o: 0.45 }, { h: 62, o: 0.55 }, { h: 48, o: 0.5 },
  { h: 78, o: 0.7 }, { h: 66, o: 0.6 }, { h: 92, o: 0.85 }, { h: 100, o: 1 },
];

const questions = [
  'How much profit have I made this month?',
  'Which products are running low on stock?',
  'What is my total revenue this month?',
  'List items that are out of stock',
];

const steps = [
  { n: 1, title: 'Create your shop', body: 'Sign up, add your shop name and currency. Your 30-day trial starts right away.' },
  { n: 2, title: 'Add products and record sales', body: 'List your stock once, then record sales, purchases and expenses as they happen.' },
  { n: 3, title: 'See how you are doing', body: 'Open the dashboard and reports, or just ask Mauzo AI.' },
];

const included = [
  'Products, sales, purchases and quotations',
  'Multiple shops and staff access',
  'Reports exported to PDF and Excel',
  'Mauzo AI business assistant',
  'English and Kiswahili',
  'Works on web and Android',
];

const Eyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <div className={`text-sm font-semibold uppercase tracking-wider ${light ? 'text-[#B9BBFF]' : 'text-[#1A1AE6]'}`}>{children}</div>
);

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-3 text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.1] tracking-tight" style={display}>{children}</h2>
);

const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-bold tracking-tight ${className}`} style={display}>
    biashara<span className="text-[#1A1AE6]">-yangu</span>
  </span>
);

const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-[#F4F6FB] text-[#0B0B3B] leading-normal">
    <PageHead
      title="Biashara Yangu — Multi-Shop Inventory & Sales Platform"
      description="Manage inventory, sales, expenses, quotations and reports across multiple shops, in English and Kiswahili, with AI-powered insights."
      path="/"
    />
    <Helmet>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
    </Helmet>

    {/* NAV */}
    <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Link to="/" aria-label="Biashara Yangu home" className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1AE6]">
          <Package className="h-[22px] w-[22px] text-white" aria-hidden="true" />
        </span>
        <Wordmark className="text-[22px]" />
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-medium text-[#3A4062]">
        <a className="hover:text-[#1A1AE6]" href="#features">Features</a>
        <a className="hover:text-[#1A1AE6]" href="#how">How it works</a>
        <a className="hover:text-[#1A1AE6]" href="#pricing">Pricing</a>
        <Link className="hover:text-[#1A1AE6]" to="/invoice-generator">Free invoice tool</Link>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/login" className="flex min-h-[44px] items-center px-2 text-[15px] font-semibold hover:text-[#1A1AE6]">Sign in</Link>
        <Link to="/register" className="flex min-h-[44px] items-center rounded-xl bg-[#1A1AE6] px-[22px] text-[15px] font-semibold text-white transition hover:-translate-y-px">
          Start free trial
        </Link>
      </div>
    </header>

    {/* HERO */}
    <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-[72px] pt-12">
      <div className="min-w-0 flex-[1_1_460px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DDE2F0] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#3A4062]">
          <span className="h-2 w-2 rounded-full bg-[#1A1AE6]" /> Manage. Track. Grow.
        </div>
        <h1 className="mt-5 text-[clamp(38px,5.4vw,66px)] font-bold leading-[1.04] tracking-[-0.025em]" style={display}>
          Run every shop from one simple app.
        </h1>
        <p className="mt-5 max-w-[540px] text-[clamp(17px,1.6vw,20px)] text-[#3A4062]">
          Track stock, record sales, send quotations and see your real profit. Works in English and Kiswahili, on your phone or computer.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="flex min-h-[56px] items-center gap-2.5 rounded-[14px] bg-[#1A1AE6] px-7 text-[17px] font-semibold text-white shadow-[0_10px_24px_rgba(26,26,230,0.28)] transition hover:-translate-y-px">
            Start your free trial <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link to="/login" className="flex min-h-[56px] items-center rounded-[14px] border border-[#DDE2F0] bg-white px-7 text-[17px] font-semibold transition hover:-translate-y-px">
            Sign in
          </Link>
        </div>
        <p className="mt-[18px] text-sm text-[#4A5170]">30-day free trial · then TZS 5,000 per month · pay with mobile money</p>
      </div>

      <div className="min-w-0 flex-[1_1_460px]" aria-hidden="true">
        <div className="rounded-3xl border border-[#DDE2F0] bg-white p-6 shadow-[0_24px_60px_rgba(11,11,59,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-[#4A5170]">Dashboard</div>
              <div className="text-xl font-semibold" style={display}>My Shop · this month</div>
            </div>
            <span className="rounded-full bg-[#E3F6EC] px-3 py-1.5 text-xs font-semibold text-[#067647]">Profit up</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-[#F4F6FB] p-4">
                <div className="text-[13px] text-[#4A5170]">{s.label}</div>
                <div className="mt-1 text-[22px] font-bold" style={display}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-[#F4F6FB] p-4">
            <div className="text-[13px] font-medium text-[#4A5170]">Sales, last 7 days</div>
            <div className="mt-3 flex h-[120px] items-end gap-2.5">
              {bars.map((b, i) => (
                <div key={i} className="flex-1 rounded-t-lg rounded-b bg-[#1A1AE6]" style={{ height: `${b.h}%`, opacity: b.o }} />
              ))}
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2.5 rounded-[14px] bg-[#FFF4E5] px-3.5 py-3 text-sm text-[#7A4A00]">
            <AlertTriangle className="h-[18px] w-[18px]" /> 3 products are running low on stock
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[#4A5170]">Sample data for illustration</p>
      </div>
    </section>

    {/* FEATURES */}
    <section id="features" className="mx-auto max-w-[1200px] px-6 pb-20 pt-6">
      <div className="max-w-[640px]">
        <Eyebrow>Everything in one place</Eyebrow>
        <H2>The tools a growing shop actually needs</H2>
      </div>
      <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-[20px] border border-[#DDE2F0] bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(11,11,59,0.10)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#E8E8FC]">
              <Icon className="h-6 w-6 text-[#1A1AE6]" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-semibold" style={display}>{title}</h3>
            <p className="mt-2 text-[15px] text-[#3A4062]">{body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* MAUZO AI */}
    <section className="bg-[#0B0B3B] text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 py-20">
        <div className="min-w-0 flex-[1_1_440px]">
          <div className="inline-flex items-center gap-2"><Sparkles className="h-[18px] w-[18px] text-[#B9BBFF]" aria-hidden="true" /><Eyebrow light>Mauzo AI</Eyebrow></div>
          <H2>Just ask your shop a question</H2>
          <p className="mt-4 max-w-[520px] text-lg text-[#C9CCF2]">
            Mauzo AI reads this month's stock, sales, expenses and purchases and answers in plain language. No spreadsheets, no formulas.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {questions.map((q) => (
              <span key={q} className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium">{q}</span>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_400px]" aria-hidden="true">
          <div className="rounded-3xl bg-white p-6 text-[#0B0B3B] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-[18px] rounded-br bg-[#1A1AE6] px-4 py-3 text-[15px] text-white">Which product is selling the most this month?</div>
            </div>
            <div className="mt-3.5 flex">
              <div className="max-w-[90%] rounded-[18px] rounded-bl bg-[#F4F6FB] px-4 py-3.5 text-[15px]">
                <div className="font-semibold">Top sellers this month</div>
                <ol className="mt-2 list-decimal pl-5 text-[#3A4062]">
                  <li>Sample product A · 120 sold</li>
                  <li>Sample product B · 86 sold</li>
                  <li>Sample product C · 54 sold</li>
                </ol>
              </div>
            </div>
            <p className="mt-4 text-xs text-[#4A5170]">Example answer with sample data</p>
          </div>
        </div>
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section id="how" className="mx-auto max-w-[1200px] px-6 pb-20 pt-[88px]">
      <div className="max-w-[640px]">
        <Eyebrow>How it works</Eyebrow>
        <H2>Up and running in three steps</H2>
      </div>
      <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {steps.map((s) => (
          <div key={s.n} className="rounded-[20px] border border-[#DDE2F0] bg-white p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1AE6] text-xl font-bold text-white" style={display}>{s.n}</div>
            <h3 className="mt-5 text-[22px] font-semibold" style={display}>{s.title}</h3>
            <p className="mt-2 text-[15px] text-[#3A4062]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* PRICING */}
    <section id="pricing" className="mx-auto max-w-[1200px] px-6 pb-[88px]">
      <div className="max-w-[640px]">
        <Eyebrow>Pricing</Eyebrow>
        <H2>One simple price</H2>
        <p className="mt-3 text-[17px] text-[#3A4062]">Try everything free for 30 days. No card needed to start.</p>
      </div>
      <div className="mt-10 flex flex-wrap gap-5">
        <div className="min-w-0 flex-[1_1_360px] rounded-3xl bg-[#0B0B3B] p-9 text-white">
          <div className="text-sm font-semibold text-[#B9BBFF]">Biashara Yangu</div>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-[52px] font-bold tracking-tight" style={display}>TZS 5,000</span>
            <span className="text-[17px] text-[#C9CCF2]">per month</span>
          </div>
          <p className="mt-2 text-[15px] text-[#C9CCF2]">After your 30-day free trial. Pay with mobile money on the web or Android.</p>
          <ul className="mt-6 flex flex-col gap-3 text-base">
            {included.map((i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-5 w-5 flex-none text-[#7DE0A8]" aria-hidden="true" /> <span>{i}</span>
              </li>
            ))}
          </ul>
          <Link to="/register" className="mt-7 flex min-h-[56px] items-center justify-center rounded-[14px] bg-white text-[17px] font-semibold text-[#0B0B3B] transition hover:-translate-y-px">
            Start your free trial
          </Link>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col rounded-3xl border border-[#DDE2F0] bg-white p-9">
          <div className="text-sm font-semibold text-[#1A1AE6]">Free tool</div>
          <div className="mt-3 text-[52px] font-bold tracking-tight" style={display}>TZS 0</div>
          <h3 className="mt-2 text-[22px] font-semibold" style={display}>Invoice generator</h3>
          <p className="mt-2 text-[15px] text-[#3A4062]">Make a branded PDF invoice in seconds. Pick a template, add your items and download. No sign-up required.</p>
          <div className="flex-1" />
          <Link to="/invoice-generator" className="mt-7 flex min-h-[56px] items-center justify-center rounded-[14px] border-2 border-[#1A1AE6] text-[17px] font-semibold text-[#1A1AE6] transition hover:-translate-y-px">
            Create an invoice
          </Link>
        </div>
      </div>
    </section>

    {/* FINAL CTA */}
    <section className="mx-auto max-w-[1200px] px-6 pb-[88px]">
      <div className="rounded-[28px] bg-[#1A1AE6] p-[clamp(32px,6vw,72px)] text-center text-white">
        <h2 className="text-[clamp(30px,4vw,48px)] font-bold leading-[1.1] tracking-tight" style={display}>Know your stock. Know your profit.</h2>
        <p className="mx-auto mt-4 max-w-[520px] text-lg text-[#E6E6FF]">Set up your first shop in minutes and see where your business stands today.</p>
        <Link to="/register" className="mt-8 inline-flex min-h-[56px] items-center rounded-[14px] bg-white px-8 text-[17px] font-semibold text-[#1A1AE6] transition hover:-translate-y-px">
          Start your free trial
        </Link>
      </div>
    </section>

    {/* FOOTER */}
    <footer className="border-t border-[#DDE2F0] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-8 text-sm text-[#4A5170]">
        <Wordmark className="text-lg text-[#0B0B3B]" />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
          <Link className="hover:text-[#1A1AE6]" to="/terms">Terms</Link>
          <Link className="hover:text-[#1A1AE6]" to="/privacy">Privacy</Link>
          <Link className="hover:text-[#1A1AE6]" to="/login">Sign in</Link>
          <Link className="hover:text-[#1A1AE6]" to="/register">Create account</Link>
        </nav>
        <span>© 2026 Biashara Yangu</span>
      </div>
    </footer>
  </div>
);

export default LandingPage;
