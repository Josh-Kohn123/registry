"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const FAQ_EN = [
  {
    q: "Is SimchaList free to use?",
    a: "Yes — creating a registry, adding gifts, and sharing it with guests is completely free. SimchaList does not charge couples or guests any fees.",
  },
  {
    q: "How do guests buy gifts from the registry?",
    a: "Guests visit your public registry page, browse the gift list, and click on any item they would like to give. They are taken directly to the retailer's website to complete the purchase. Once purchased, the gift is marked as reserved so no one else buys the same item.",
  },
  {
    q: "Which stores are supported?",
    a: "We support all major Israeli retailers including IKEA, FOX HOME, ACE, and more. You can add any product from an approved Israeli retailer using its direct product URL.",
  },
  {
    q: "How do I share my registry with guests?",
    a: "Once your registry is published, you will receive a unique public link. Share it via WhatsApp, email, or print it on your wedding invitation — guests need no account to view or reserve gifts.",
  },
  {
    q: "Can two guests accidentally buy the same gift?",
    a: "No. As soon as a guest reserves a gift, it is marked as taken and hidden from other guests. This prevents duplicate purchases automatically.",
  },
  {
    q: "What is the return or exchange policy?",
    a: "Each purchase is made directly on the retailer's own website, so the return and exchange policy is that retailer's. SimchaList does not process or handle any transactions.",
  },
  {
    q: "Can guests outside Israel view and buy from the registry?",
    a: "Your registry is accessible from anywhere in the world. However, most products are sold by Israeli retailers, so delivery is typically within Israel. Guests abroad may need to coordinate with a local contact.",
  },
  {
    q: "What if a product goes out of stock or the price changes?",
    a: "Prices and availability are managed directly by each retailer. We recommend reviewing your registry occasionally and swapping out unavailable items. The Recommended Products section makes it easy to find great replacements.",
  },
];

const FAQ_HE = [
  {
    q: "האם SimchaList חינמי?",
    a: "כן — יצירת רשם, הוספת מתנות ושיתוף עם האורחים הם חינמיים לחלוטין. SimchaList לא גובה עמלות מהזוג ולא מהאורחים.",
  },
  {
    q: "כיצד אורחים קונים מתנות מהרשם?",
    a: "האורחים נכנסים לדף הרשם הציבורי שלכם, בוחרים מתנה שמעניינת אותם ומועברים ישירות לאתר החנות לביצוע הרכישה. לאחר הרכישה, המתנה מסומנת כ'תפוסה' כדי שאף אחד אחר לא יקנה את אותו פריט.",
  },
  {
    q: "אילו חנויות נתמכות?",
    a: "אנחנו תומכים בכל החנויות הישראליות הגדולות כולל IKEA ,FOX HOME ,ACE ועוד. ניתן להוסיף כל מוצר מחנות ישראלית מאושרת בעזרת קישור ישיר לדף המוצר.",
  },
  {
    q: "כיצד אני משתף את הרשם עם האורחים?",
    a: "לאחר שהרשם מפורסם, תקבלו קישור ציבורי ייחודי. שתפו אותו בוואטסאפ, באימייל, או הדפיסו אותו על ההזמנות — האורחים לא זקוקים לחשבון כדי לצפות במתנות ולהזמין.",
  },
  {
    q: "האם שני אורחים יכולים לקנות את אותה מתנה בטעות?",
    a: "לא. ברגע שאורח שומר מתנה, היא מסומנת כתפוסה ומוסתרת מאורחים אחרים. מניעת כפילויות מתבצעת אוטומטית.",
  },
  {
    q: "מה מדיניות ההחזרות?",
    a: "כל רכישה מתבצעת ישירות באתר החנות הרלוונטית, ולכן מדיניות ההחזרות והחלפות היא של אותה חנות. SimchaList לא מעורב בתהליך הרכישה.",
  },
  {
    q: "האם אורחים מחוץ לישראל יכולים לצפות ולקנות מהרשם?",
    a: "הרשם שלכם נגיש מכל מקום בעולם. עם זאת, רוב המוצרים נמכרים על ידי חנויות ישראליות ומשלוח הוא בתוך ישראל בדרך כלל. אורחים מחו\"ל עשויים להצטרך לתאם עם איש קשר מקומי.",
  },
  {
    q: "מה קורה אם מוצר אזל מהמלאי או המחיר השתנה?",
    a: "מלאי ומחירים מנוהלים ישירות על ידי כל חנות. מומלץ לבדוק את הרשם מדי פעם ולהחליף פריטים שאינם זמינים. מדור המוצרים המומלצים מקל על מציאת חלופות מצוינות.",
  },
];

function FaqItem({
  q,
  a,
  isRtl,
}: {
  q: string;
  a: string;
  isRtl: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full py-5 flex items-center justify-between gap-4 text-left hover:text-blue-600 transition-colors ${
          isRtl ? "flex-row-reverse text-right" : ""
        }`}
      >
        <span className="font-semibold text-gray-900 text-base">{q}</span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm transition-transform ${
            open ? "rotate-45 bg-blue-100 text-blue-600" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div
          className={`pb-5 text-gray-600 leading-relaxed text-sm ${
            isRtl ? "text-right" : ""
          }`}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });
  }, []);

  const isRtl = locale === "he";
  const faqs = isRtl ? FAQ_HE : FAQ_EN;

  return (
    <div className={`min-h-screen ${isRtl ? "rtl" : "ltr"}`}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              SimchaList
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t("common.tagline")}
            </p>

            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center ${
                isRtl ? "sm:flex-row-reverse" : ""
              }`}
            >
              {user ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    {t("dashboard.welcome")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="primary" size="lg">
                      {t("common.signIn")}
                    </Button>
                  </Link>
                  <Link href="/inspiration">
                    <Button variant="outline" size="lg">
                      {isRtl ? "גלו מוצרים פופולריים" : "Browse gift ideas"}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {locale === "he" ? "כיצד זה עובד" : "How It Works"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === "he" ? "צור את הרשם שלך" : "Create Your Registry"}
              </h3>
              <p className="text-gray-600">
                {locale === "he"
                  ? "הירשם עם אימייל וצור את רשם המתנות שלך"
                  : "Sign up with your email and create your gift registry"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === "he" ? "הוסף מתנות" : "Add Gifts"}
              </h3>
              <p className="text-gray-600">
                {locale === "he"
                  ? "הוסף מוצרים, קרנות כספיות ומתנות קבוצתיות"
                  : "Add products, cash funds, and group gifts"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === "he" ? "שתף עם אורחים" : "Share With Guests"}
              </h3>
              <p className="text-gray-600">
                {locale === "he"
                  ? "שתף את הרשם שלך עם משפחה וחברים"
                  : "Share your registry with family and friends"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-32 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {locale === "he" ? "מוכנים להתחיל?" : "Ready to get started?"}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {locale === "he"
              ? "צור את רשם המתנות שלך היום וקבל עזרה מן הקהילה"
              : "Create your gift registry today and get help from the community"}
          </p>
          {!user && (
            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRtl ? "sm:flex-row-reverse" : ""}`}>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  {t("common.signIn")}
                </Button>
              </Link>
              <Link href="/inspiration">
                <button className="px-6 py-3 rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-blue-600 transition-colors text-base">
                  {isRtl ? "גלו מוצרים פופולריים ←" : "Browse gift ideas →"}
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-32 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isRtl ? "שאלות נפוצות" : "Frequently Asked Questions"}
            </h2>
            <p className="text-gray-500 text-lg">
              {isRtl
                ? "כל מה שרציתם לדעת על SimchaList"
                : "Everything you need to know about SimchaList"}
            </p>
          </div>

          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-gray-50 px-6">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} isRtl={isRtl} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              {isRtl ? "עדיין יש שאלות? " : "Still have questions? "}
              <a
                href="mailto:support@simchalist.com"
                className="text-blue-600 hover:underline font-medium"
              >
                {isRtl ? "צרו קשר" : "Get in touch"}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
