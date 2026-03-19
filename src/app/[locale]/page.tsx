"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

/* ── FAQ data ────────────────────────────────────────────────────────── */

const FAQ_EN = [
  {
    q: "Is SimchaList free to use?",
    a: "Yes — creating a registry, adding gifts, and sharing it with guests is completely free. SimchaList does not charge couples or guests any fees.",
  },
  {
    q: "How do guests buy gifts from the registry?",
    a: "Guests visit your public registry page, choose a gift they'd like to give, and are taken directly to the retailer's website to complete the purchase. The gift is then marked as reserved so no one else buys the same item.",
  },
  {
    q: "Which stores are supported?",
    a: "We support all major Israeli retailers including IKEA, FOX HOME, ACE, and more. You can add any product from an approved Israeli retailer using its direct product URL.",
  },
  {
    q: "How do I share my registry with guests?",
    a: "Once published, you'll receive a unique public link. Share it via WhatsApp, email, or print it on your invitation — guests need no account to view or reserve gifts.",
  },
  {
    q: "Can two guests accidentally buy the same gift?",
    a: "No. The moment a guest reserves a gift it is marked as taken and hidden from others. Duplicate purchases are prevented automatically.",
  },
  {
    q: "What is the return or exchange policy?",
    a: "Each purchase is made directly on the retailer's own website, so their return and exchange policy applies. SimchaList does not process transactions.",
  },
  {
    q: "Can guests outside Israel participate?",
    a: "Your registry is accessible from anywhere in the world. Most products are sold by Israeli retailers, so delivery is typically within Israel — guests abroad may wish to coordinate with a local contact.",
  },
  {
    q: "What if a product goes out of stock?",
    a: "Availability is managed by each retailer. We recommend reviewing your registry occasionally and swapping out unavailable items — the Inspiration page makes finding replacements easy.",
  },
];

const FAQ_HE = [
  {
    q: "האם SimchaList חינמי?",
    a: "כן — יצירת רשם, הוספת מתנות ושיתוף עם האורחים הם חינמיים לחלוטין. SimchaList לא גובה עמלות מהזוג ולא מהאורחים.",
  },
  {
    q: "כיצד אורחים קונים מתנות מהרשם?",
    a: "האורחים נכנסים לדף הרשם הציבורי שלכם, בוחרים מתנה ומועברים ישירות לאתר החנות לביצוע הרכישה. לאחר הרכישה המתנה מסומנת כתפוסה כדי שאף אחד אחר לא יקנה את אותו פריט.",
  },
  {
    q: "אילו חנויות נתמכות?",
    a: "אנחנו תומכים בכל החנויות הישראליות הגדולות — IKEA ,FOX HOME ,ACE ועוד. ניתן להוסיף כל מוצר מחנות ישראלית מאושרת בעזרת קישור ישיר לדף המוצר.",
  },
  {
    q: "כיצד אני משתף את הרשם עם האורחים?",
    a: "לאחר פרסום הרשם תקבלו קישור ציבורי ייחודי. שתפו אותו בוואטסאפ, באימייל, או הדפיסו על ההזמנות — האורחים לא זקוקים לחשבון.",
  },
  {
    q: "האם שני אורחים יכולים לקנות את אותה מתנה?",
    a: "לא. ברגע שאורח שומר מתנה היא מסומנת כתפוסה ומוסתרת מהאחרים. מניעת כפילויות מתבצעת אוטומטית.",
  },
  {
    q: "מה מדיניות ההחזרות?",
    a: "כל רכישה מתבצעת ישירות באתר החנות ולכן מדיניות ההחזרות היא של אותה חנות. SimchaList לא מעורב בתהליך הרכישה.",
  },
  {
    q: "האם אורחים מחוץ לישראל יכולים לקנות?",
    a: "הרשם נגיש מכל מקום בעולם. רוב המוצרים נמכרים על ידי חנויות ישראליות — משלוח הוא בדרך כלל בתוך ישראל.",
  },
  {
    q: "מה קורה אם מוצר אזל מהמלאי?",
    a: "מלאי ומחירים מנוהלים ישירות על ידי כל חנות. מומלץ לבדוק את הרשם מדי פעם ולהחליף פריטים שאינם זמינים.",
  },
];

/* ── FAQ accordion item ─────────────────────────────────────────────── */

function FaqItem({ q, a, isRtl }: { q: string; a: string; isRtl: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-warm-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full py-5 flex items-start gap-4 text-left group ${
          isRtl ? "flex-row-reverse text-right" : ""
        }`}
      >
        <span
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border border-warm-border flex items-center justify-center text-brand font-medium text-sm transition-all duration-200 ${
            open ? "bg-brand border-brand text-white" : "group-hover:border-brand group-hover:text-brand"
          }`}
        >
          {open ? "−" : "+"}
        </span>
        <span className="font-medium text-ink text-base leading-snug">
          {q}
        </span>
      </button>
      {open && (
        <p
          className={`pb-5 text-pebble leading-relaxed text-sm ${
            isRtl ? "pr-9 text-right" : "pl-9"
          }`}
        >
          {a}
        </p>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
  }, []);

  const isRtl = locale === "he";
  const faqs = isRtl ? FAQ_HE : FAQ_EN;

  return (
    <div className={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-cream overflow-hidden relative">
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-xlight opacity-60 translate-x-1/3 -translate-y-1/4" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-light opacity-25 -translate-x-1/2 translate-y-1/3" />

        <div className="max-w-6xl mx-auto px-5 relative">
          <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-20 lg:py-28 ${isRtl ? "lg:flex-row-reverse" : ""}`}>

            {/* ── Left: Copy ── */}
            <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-center lg:text-left"}`}>

              {/* Eyebrow pill */}
              <div className={`inline-flex items-center gap-2 bg-warm-white border border-warm-border rounded-full px-4 py-1.5 mb-6 shadow-sm ${isRtl ? "" : ""}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                <span className="text-brand text-xs font-semibold tracking-widest uppercase">
                  {isRtl ? "מרשם המתנות הישראלי" : "The Israeli Gift Registry"}
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] font-medium text-ink leading-[1.08] mb-5">
                {isRtl ? (
                  <>
                    רשם המתנות שלכם,<br />
                    <em className="text-brand not-italic">בצורה מושלמת.</em>
                  </>
                ) : (
                  <>
                    Your registry,<br />
                    <em className="text-brand not-italic">beautifully done.</em>
                  </>
                )}
              </h1>

              {/* Body copy */}
              <p className={`text-pebble text-lg leading-relaxed mb-8 ${isRtl ? "max-w-md mr-0 ml-auto lg:ml-0" : "max-w-md mx-auto lg:mx-0"}`}>
                {isRtl
                  ? "הוסיפו מתנות מכל חנות ישראלית, שתפו קישור אחד עם האורחים, וקבלו בדיוק מה שרציתם."
                  : "Add gifts from any Israeli retailer, share one link with guests, and receive exactly what you want."}
              </p>

              {/* CTAs */}
              {!isLoading && (
                <div className={`flex flex-col sm:flex-row gap-3 mb-8 ${isRtl ? "justify-end sm:flex-row-reverse lg:justify-start" : "justify-center lg:justify-start"}`}>
                  {user ? (
                    <Link href="/dashboard">
                      <button className="px-8 py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition-colors shadow-sm text-base">
                        {isRtl ? "לדשבורד שלי ←" : "Go to my dashboard →"}
                      </button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login">
                        <button className="px-8 py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition-colors shadow-sm text-base">
                          {isRtl ? "יצירת רשם חינמי" : "Create free registry"}
                        </button>
                      </Link>
                      <Link href="/inspiration">
                        <button className="px-8 py-3.5 border border-warm-border bg-warm-white text-ink rounded-xl font-semibold hover:border-ink-mid transition-colors text-base">
                          {isRtl ? "← גלו מוצרים" : "Browse gift ideas →"}
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Trust chips */}
              <div className={`flex flex-wrap gap-4 text-xs text-pebble ${isRtl ? "justify-end lg:justify-start flex-row-reverse" : "justify-center lg:justify-start"}`}>
                {(isRtl
                  ? ["✦ חינמי לחלוטין", "✦ ללא כרטיס אשראי", "✦ שיתוף בוואטסאפ"]
                  : ["✦ Completely free", "✦ No credit card", "✦ Share via WhatsApp"]
                ).map((chip) => (
                  <span key={chip} className="flex items-center gap-1.5">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right: Registry mockup ── */}
            <div className="w-full lg:w-[420px] lg:flex-shrink-0 relative">
              {/* Floating badge — top */}
              <div className={`absolute -top-4 z-20 ${isRtl ? "-left-3 sm:-left-5" : "-right-3 sm:-right-5"}`}>
                <div className="bg-warm-white border border-warm-border rounded-2xl px-3.5 py-2.5 shadow-md flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <div>
                    <p className="text-ink text-xs font-semibold leading-none">{isRtl ? "הגנה מפני כפילויות" : "Duplicate-proof"}</p>
                    <p className="text-pebble text-[10px] mt-0.5">{isRtl ? "כל מתנה נשמרת בזמן אמת" : "Gifts reserved in real-time"}</p>
                  </div>
                </div>
              </div>

              {/* Main mockup card */}
              <div className="bg-warm-white border border-warm-border rounded-2xl shadow-xl overflow-hidden">
                {/* Registry header */}
                <div className="bg-brand-xlight border-b border-warm-border px-6 py-5 text-center">
                  <p className="eyebrow text-[10px] mb-1.5">{isRtl ? "רשם מתנות" : "Gift Registry"}</p>
                  <p className="font-display text-2xl font-semibold text-ink">{isRtl ? "שרה ודוד" : "Sarah & David"}</p>
                  <p className="text-pebble text-xs mt-1">{isRtl ? "12 ביוני 2025 · תל אביב" : "June 12, 2025 · Tel Aviv"}</p>
                </div>

                {/* Gift items */}
                <div className="divide-y divide-warm-border">
                  {(isRtl ? [
                    { name: "ספת קטיפה 3 מושבים", retailer: "IKEA", price: "₪2,490", emoji: "🛋️", reserved: false },
                    { name: "מיקסר מטבח KitchenAid", retailer: "ACE", price: "₪1,490", emoji: "🍴", reserved: true },
                    { name: "סט מצעים פרימיום", retailer: "FOX HOME", price: "₪349", emoji: "🛏️", reserved: false },
                  ] : [
                    { name: "IKEA HEMNES Bed Frame", retailer: "IKEA", price: "₪1,699", emoji: "🛏️", reserved: false },
                    { name: "KitchenAid Stand Mixer", retailer: "ACE", price: "₪1,490", emoji: "🍴", reserved: true },
                    { name: "Velvet Cushion Set ×4", retailer: "FOX HOME", price: "₪249", emoji: "🛋️", reserved: false },
                  ]).map((item, i) => (
                    <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 ${item.reserved ? "opacity-50" : ""}`}>
                      <div className="w-10 h-10 rounded-xl bg-brand-xlight flex-shrink-0 flex items-center justify-center text-lg">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ink text-sm font-medium truncate">{item.name}</p>
                        <p className="text-pebble text-xs mt-0.5">{item.retailer} · {item.price}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${item.reserved ? "bg-ink/10 text-ink/50" : "bg-brand text-white"}`}>
                        {item.reserved
                          ? (isRtl ? "שמור" : "Reserved")
                          : (isRtl ? "שמירה" : "Reserve")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="bg-cream/60 border-t border-warm-border px-6 py-3 flex items-center justify-between">
                  <p className="text-xs text-pebble">{isRtl ? "1 מתוך 12 מתנות נשמרו" : "1 of 12 gifts reserved"}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    <span className="w-2 h-2 rounded-full bg-brand/40" />
                    <span className="w-2 h-2 rounded-full bg-brand/20" />
                  </div>
                </div>
              </div>

              {/* Floating badge — bottom */}
              <div className={`absolute -bottom-4 z-20 ${isRtl ? "-right-3 sm:-right-5" : "-left-3 sm:-left-5"}`}>
                <div className="bg-brand text-white rounded-2xl px-3.5 py-2.5 shadow-md flex items-center gap-2">
                  <span className="text-base">📲</span>
                  <div>
                    <p className="text-xs font-semibold leading-none">{isRtl ? "שיתוף בוואטסאפ" : "Share via WhatsApp"}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">{isRtl ? "ללא צורך בהורדת אפליקציה" : "Guests need no account"}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Social proof strip ────────────────────────────────────────── */}
      <div className="bg-warm-white border-y border-warm-border py-4 px-5">
        <div className={`max-w-5xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-pebble ${isRtl ? "flex-row-reverse" : ""}`}>
          {(isRtl ? [
            ["🏪", "חנויות ישראליות מובילות"],
            ["🎁", "מתנות מכל קטגוריה"],
            ["🔒", "הגנה מפני כפילויות"],
            ["💸", "חינמי לחלוטין"],
          ] : [
            ["🏪", "All major Israeli retailers"],
            ["🎁", "Any gift category"],
            ["🔒", "Duplicate-gift protection"],
            ["💸", "100% free forever"],
          ]).map(([icon, label]) => (
            <span key={label} className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="bg-warm-white py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="eyebrow mb-3">
              {isRtl ? "פשוט ומהיר" : "Simple by design"}
            </p>
            <h2 className="font-display text-4xl font-medium text-ink">
              {isRtl ? "כיצד זה עובד" : "How it works"}
            </h2>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-10 ${
              isRtl ? "direction-rtl" : ""
            }`}
          >
            {(isRtl
              ? [
                  {
                    n: "01",
                    title: "צרו את הרשם שלכם",
                    body: "הירשמו עם אימייל וצרו את רשם המתנות שלכם תוך דקות — חינמי לגמרי.",
                  },
                  {
                    n: "02",
                    title: "הוסיפו מתנות",
                    body: "הדביקו קישור לכל מוצר מחנות ישראלית מאושרת, או בחרו מרשימת ההמלצות שלנו.",
                  },
                  {
                    n: "03",
                    title: "שתפו עם האורחים",
                    body: "שתפו קישור אחד בוואטסאפ או בהזמנות — האורחים רואים מה נשאר ובוחרים מה לקנות.",
                  },
                ]
              : [
                  {
                    n: "01",
                    title: "Create your registry",
                    body: "Sign up with your email and create your registry in minutes — completely free.",
                  },
                  {
                    n: "02",
                    title: "Add gifts",
                    body: "Paste a link to any product from an approved Israeli retailer, or pick from our curated Inspiration list.",
                  },
                  {
                    n: "03",
                    title: "Share with guests",
                    body: "Share one link via WhatsApp or your invitations — guests see what's available and choose what to buy.",
                  },
                ]
            ).map((step) => (
              <div key={step.n} className={isRtl ? "text-right" : ""}>
                {/* Ghost number */}
                <p className="font-display text-7xl font-medium text-brand-light select-none leading-none mb-3">
                  {step.n}
                </p>
                <h3 className="text-lg font-semibold text-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-pebble leading-relaxed text-sm">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────────────── */}
      <section className="bg-ink py-24 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-medium text-warm-white mb-4">
            {isRtl ? "מוכנים להתחיל?" : "Ready to get started?"}
          </h2>
          <p className="text-mist text-lg mb-10 leading-relaxed">
            {isRtl
              ? "צרו את רשם המתנות שלכם היום — בחינם, ללא כרטיס אשראי."
              : "Create your gift registry today — free, no credit card required."}
          </p>
          {!user && (
            <div
              className={`flex flex-col sm:flex-row gap-3 justify-center ${
                isRtl ? "sm:flex-row-reverse" : ""
              }`}
            >
              <Link href="/login">
                <button className="px-8 py-4 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors shadow-sm text-base">
                  {isRtl ? "יצירת רשם חינמי" : "Create free registry"}
                </button>
              </Link>
              <Link href="/inspiration">
                <button className="px-8 py-4 border border-white/20 text-warm-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-base">
                  {isRtl ? "גלו מוצרים ←" : "Browse gift ideas →"}
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-cream py-24 px-5 scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <div className={`mb-12 ${isRtl ? "text-right" : ""}`}>
            <p className="eyebrow mb-3">
              {isRtl ? "יש שאלות?" : "Got questions?"}
            </p>
            <h2 className="font-display text-4xl font-medium text-ink">
              {isRtl ? "שאלות נפוצות" : "Frequently asked"}
            </h2>
          </div>

          <div className="bg-warm-white rounded-2xl border border-warm-border px-6 shadow-sm">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} isRtl={isRtl} />
            ))}
          </div>

          <p className={`mt-8 text-sm text-pebble ${isRtl ? "text-right" : ""}`}>
            {isRtl ? "עדיין יש שאלות? " : "Still have questions? "}
            <a
              href="mailto:hello@simchalist.com"
              className="text-brand hover:text-brand-dark transition-colors font-medium"
            >
              {isRtl ? "צרו קשר" : "Get in touch"}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
