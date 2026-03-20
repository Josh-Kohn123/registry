"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { RECOMMENDED_PRODUCTS } from "@/data/recommended-products";

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

  // ── Featured carousel ──────────────────────────────────────────────────
  // Pick 2 items from each main category for variety
  const FEATURED = (() => {
    const cats = ["bedroom", "kitchen", "living-room", "bathroom", "decor", "electronics"];
    const result: typeof RECOMMENDED_PRODUCTS = [];
    for (const cat of cats) {
      const matches = RECOMMENDED_PRODUCTS.filter((p) => p.category === cat);
      result.push(...matches.slice(0, 2));
      if (result.length >= 10) break;
    }
    return result.slice(0, 10);
  })();

  const [carouselImages, setCarouselImages] = useState<Record<string, string | null | undefined>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    FEATURED.forEach(async (p) => {
      try {
        const r = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: p.url }),
        });
        const d = await r.json();
        setCarouselImages((prev) => ({
          ...prev,
          [p.id]: d.success && d.data?.image ? d.data.image : null,
        }));
      } catch {
        setCarouselImages((prev) => ({ ...prev, [p.id]: null }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={`grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)] ${isRtl ? "rtl" : "ltr"}`}>

        {/* ── Left: Editorial copy ── */}
        <div className={`bg-cream flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-0 ${isRtl ? "text-right items-end" : ""}`}>

          {/* Eyebrow */}
          <p className="eyebrow mb-5">
            {isRtl ? "מרשם המתנות הישראלי" : "The Israeli Gift Registry"}
          </p>

          {/* Headline — EB Garamond with italic sage accent */}
          <h1 className="font-display font-normal text-ink leading-[1.0] tracking-tight mb-5"
              style={{ fontSize: "clamp(2.8rem, 5vw, 4.25rem)" }}>
            {isRtl ? (
              <>
                רשם המתנות שלכם,<br />
                <em className="text-brand">בצורה מושלמת.</em>
              </>
            ) : (
              <>
                Your registry,<br />
                <em className="text-brand">nobody else&apos;s.</em>
              </>
            )}
          </h1>

          {/* Rule */}
          <div className="w-8 h-px bg-warm-border mb-5" />

          {/* Body */}
          <p className="text-pebble font-light text-base leading-relaxed max-w-sm mb-7">
            {isRtl
              ? "הוסיפו מתנות מכל חנות ישראלית, שתפו קישור אחד עם האורחים, וקבלו בדיוק מה שרציתם."
              : "Add gifts from any Israeli retailer, share one link with your guests, and receive exactly what you had in mind."}
          </p>

          {/* CTAs — square-edged, editorial style */}
          {!isLoading && (
            <div className={`flex flex-col sm:flex-row items-start gap-4 mb-6 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
              {user ? (
                <Link href="/dashboard">
                  <button className="bg-ink text-cream text-[11px] font-medium tracking-[0.08em] uppercase px-8 py-3.5 hover:opacity-80 transition-opacity">
                    {isRtl ? "← לדשבורד שלי" : "Go to my dashboard →"}
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <button className="bg-ink text-cream text-[11px] font-medium tracking-[0.08em] uppercase px-8 py-3.5 hover:opacity-80 transition-opacity">
                      {isRtl ? "יצירת רשם חינמי" : "Create your registry — free"}
                    </button>
                  </Link>
                  <Link href="/inspiration">
                    <button className="text-brand text-sm font-light underline underline-offset-4 decoration-brand/40 hover:decoration-brand transition-colors bg-transparent border-none">
                      {isRtl ? "← גלו מוצרים" : "Browse gift ideas →"}
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Trust dots */}
          <div className={`flex items-center gap-3 flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}>
            {(isRtl
              ? ["ללא כרטיס אשראי", "כל חנויות ישראל", "שיתוף בוואטסאפ"]
              : ["No credit card", "All major Israeli retailers", "WhatsApp sharing"]
            ).map((item, i, arr) => (
              <span key={item} className="flex items-center gap-3">
                <span className="text-[11px] text-mist">{item}</span>
                {i < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-warm-border" />}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: Mockup panel ── */}
        <div
          className={`hidden lg:flex items-center justify-center bg-brand-xlight border-warm-border relative overflow-hidden p-12 ${isRtl ? "border-r" : "border-l"}`}
          style={{ backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--brand) 20%, transparent) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        >
          {/* Card wrapper with room for floating badges */}
          <div className="relative w-full max-w-[400px]">

            {/* Floating badge — top */}
            <div className={`absolute -top-5 z-20 ${isRtl ? "-left-5" : "-right-5"}`}>
              <div className="bg-warm-white border border-warm-border rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5">
                <span className="text-base">🔒</span>
                <div>
                  <p className="text-ink text-xs font-semibold leading-none">{isRtl ? "הגנה מפני כפילויות" : "Duplicate-proof"}</p>
                  <p className="text-pebble text-[10px] mt-0.5">{isRtl ? "כל מתנה נשמרת בזמן אמת" : "Gifts reserved in real-time"}</p>
                </div>
              </div>
            </div>

            {/* Registry card */}
            <div className="bg-warm-white border border-warm-border rounded-2xl shadow-xl overflow-hidden">

              {/* Card header */}
              <div className="bg-brand-xlight border-b border-warm-border px-6 py-5 text-center"
                   style={{ background: "color-mix(in srgb, var(--brand) 12%, var(--warm-white))" }}>
                <p className="eyebrow text-[9px] mb-1.5">{isRtl ? "רשם מתנות" : "Gift Registry"}</p>
                <p className="font-display text-2xl font-normal text-ink">
                  {isRtl ? <><em>שרה</em> &amp; <em>דוד</em></> : <><em>Sarah</em> &amp; <em>David</em></>}
                </p>
                <p className="text-pebble text-xs mt-1">{isRtl ? "12 ביוני 2025 · תל אביב" : "June 12, 2025 · Tel Aviv"}</p>
              </div>

              {/* Gift rows */}
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
                  <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 ${item.reserved ? "opacity-45" : ""}`}>
                    <div className="w-11 h-11 rounded-xl bg-brand-xlight flex-shrink-0 flex items-center justify-center text-lg">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink text-sm font-medium truncate">{item.name}</p>
                      <p className="text-pebble text-xs mt-0.5">{item.retailer} · {item.price}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${item.reserved ? "bg-warm-border text-pebble" : "bg-brand text-white"}`}>
                      {item.reserved ? (isRtl ? "שמור" : "Reserved") : (isRtl ? "שמירה" : "Reserve")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div className="bg-cream border-t border-warm-border px-5 py-3 flex items-center justify-between">
                <p className="text-[11px] text-pebble">{isRtl ? "1 מתוך 12 מתנות נשמרו" : "1 of 12 gifts reserved"}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  <span className="w-2 h-2 rounded-full bg-brand/35" />
                  <span className="w-2 h-2 rounded-full bg-brand/15" />
                </div>
              </div>
            </div>

            {/* Floating badge — bottom */}
            <div className={`absolute -bottom-5 z-20 ${isRtl ? "-right-5" : "-left-5"}`}>
              <div className="bg-brand text-white rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5">
                <span className="text-base">📲</span>
                <div>
                  <p className="text-xs font-semibold leading-none">{isRtl ? "שיתוף בוואטסאפ" : "Share via WhatsApp"}</p>
                  <p className="text-white/65 text-[10px] mt-0.5">{isRtl ? "האורחים לא צריכים חשבון" : "Guests need no account"}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Social proof strip ────────────────────────────────────────── */}
      <div className={`bg-warm-white border-y border-warm-border py-4 px-5 ${isRtl ? "rtl" : "ltr"}`}>
        <div className={`max-w-5xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10 text-xs text-pebble tracking-wide ${isRtl ? "flex-row-reverse" : ""}`}>
          {(isRtl ? [
            ["IKEA, ACE, FOX HOME ועוד", "·"],
            ["הגנה מפני כפילויות", "·"],
            ["שיתוף בוואטסאפ", "·"],
            ["חינמי לחלוטין", ""],
          ] : [
            ["IKEA, ACE, FOX HOME + more", "·"],
            ["Duplicate-gift protection", "·"],
            ["WhatsApp sharing", "·"],
            ["Free forever", ""],
          ]).map(([label, sep]) => (
            <span key={label} className="flex items-center gap-6">
              <span>{label}</span>
              {sep && <span className="text-warm-border">{sep}</span>}
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

      {/* ── Featured picks carousel ───────────────────────────────────── */}
      <section className={`py-16 bg-warm-white border-y border-warm-border overflow-hidden ${isRtl ? "rtl" : "ltr"}`}>

        {/* Header row */}
        <div className={`max-w-5xl mx-auto px-5 mb-8 flex items-end justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className={isRtl ? "text-right" : ""}>
            <p className="eyebrow mb-2">
              {isRtl ? "הכי פופולרי" : "Top picks"}
            </p>
            <h2 className="font-display text-3xl font-medium text-ink leading-tight">
              {isRtl ? "מה שזוגות ישראלים אוהבים לקבל" : "Loved by Israeli couples"}
            </h2>
          </div>
          {/* Scroll arrows */}
          <div className={`flex gap-2 shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: isRtl ? 240 : -240, behavior: "smooth" })}
              className="w-9 h-9 rounded-full border border-warm-border bg-warm-white flex items-center justify-center text-pebble hover:border-ink hover:text-ink transition-colors"
              aria-label="Previous"
            >
              {isRtl ? "→" : "←"}
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: isRtl ? -240 : 240, behavior: "smooth" })}
              className="w-9 h-9 rounded-full border border-warm-border bg-warm-white flex items-center justify-center text-pebble hover:border-ink hover:text-ink transition-colors"
              aria-label="Next"
            >
              {isRtl ? "←" : "→"}
            </button>
          </div>
        </div>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth px-5 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FEATURED.map((product) => {
            const imgSrc = carouselImages[product.id];
            const loaded = imgSrc !== undefined;
            const CAT_BG: Record<string, string> = {
              bedroom: "bg-indigo-50", kitchen: "bg-amber-50",
              bathroom: "bg-cyan-50", "living-room": "bg-emerald-50",
              decor: "bg-pink-50", electronics: "bg-blue-50",
              outdoor: "bg-green-50", other: "bg-cream",
            };
            const CAT_EMOJI: Record<string, string> = {
              bedroom: "🛏️", kitchen: "🍳", bathroom: "🛁",
              "living-room": "🛋️", decor: "🕯️", electronics: "💡",
              outdoor: "🌿", other: "🎁",
            };
            return (
              <div
                key={product.id}
                className="w-[210px] flex-shrink-0 snap-start bg-warm-white border border-warm-border rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform duration-200"
              >
                {/* Photo */}
                <div className={`w-full h-44 relative overflow-hidden ${CAT_BG[product.category] || "bg-cream"}`}>
                  {!loaded ? (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-warm-border via-cream to-warm-border" />
                  ) : imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={isRtl ? product.titleHe : product.titleEn}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <span className="text-5xl">{CAT_EMOJI[product.category] || "🎁"}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={`p-3.5 ${isRtl ? "text-right" : ""}`}>
                  <p className="text-ink text-sm font-medium leading-snug line-clamp-2 mb-1">
                    {isRtl ? product.titleHe : product.titleEn}
                  </p>
                  <p className="text-pebble text-xs">{product.retailerName}</p>
                </div>
              </div>
            );
          })}

          {/* Terminal CTA card */}
          <div className="w-[210px] flex-shrink-0 snap-start bg-brand-xlight border border-warm-border rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 gap-3 text-center">
            <p className="font-display text-lg font-normal text-ink leading-tight">
              {isRtl ? <><em>+200 מוצרים</em><br />להוסיף לרשם</> : <><em>200+ products</em><br />to add to your registry</>}
            </p>
            <Link href="/inspiration">
              <button className="text-xs font-medium text-brand border border-brand px-4 py-2 hover:bg-brand hover:text-white transition-colors">
                {isRtl ? "לכל המוצרים ←" : "Browse all →"}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────────────── */}
      <section className={`bg-cream py-20 px-5 border-b border-warm-border ${isRtl ? "rtl" : "ltr"}`}>
        <div className={`max-w-xl mx-auto text-center`}>
          <h2 className="font-display text-4xl font-normal text-ink mb-3 leading-tight">
            {isRtl ? (
              <>מוכנים להתחיל?</>
            ) : (
              <>Your registry,<br /><em className="text-brand">ready in minutes.</em></>
            )}
          </h2>
          <p className="text-pebble text-base mb-8 leading-relaxed font-light">
            {isRtl
              ? "צרו רשם מתנות חינמי, הוסיפו מוצרים מחנויות ישראליות, ושתפו עם האורחים."
              : "Free to create, no credit card needed. Add gifts from any Israeli retailer and share one link."}
          </p>
          {!user && (
            <div className={`flex flex-col sm:flex-row gap-3 justify-center ${isRtl ? "sm:flex-row-reverse" : ""}`}>
              <Link href="/login">
                <button className="bg-ink text-cream text-[11px] font-medium tracking-[0.08em] uppercase px-8 py-3.5 hover:opacity-80 transition-opacity">
                  {isRtl ? "יצירת רשם חינמי" : "Create your registry — free"}
                </button>
              </Link>
              <Link href="/inspiration">
                <button className="text-brand text-sm font-light underline underline-offset-4 decoration-brand/40 hover:decoration-brand transition-colors bg-transparent border-none">
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
