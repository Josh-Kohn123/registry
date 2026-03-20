"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const handleFaqClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isRtl = locale === "he";

  const navLink =
    "text-sm font-medium text-pebble hover:text-ink transition-colors duration-150";

  return (
    <nav
      className={`bg-cream/90 backdrop-blur-sm border-b border-warm-border sticky top-0 z-50 ${
        isRtl ? "rtl" : "ltr"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div
          className={`flex items-center h-16 gap-8 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          {/* ── Logo ── */}
          <Link
            href="/"
            className="font-display text-xl font-medium text-ink hover:text-brand transition-colors duration-150 shrink-0"
          >
            SimchaList
          </Link>

          {/* ── Left-side nav links (no flex-1 so they stay close to logo) ── */}
          <div
            className={`hidden md:flex items-center gap-7 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <a
              href={`/${locale}/#how-it-works`}
              className={navLink}
            >
              {isRtl ? "איך זה עובד" : "How it works"}
            </a>
            <Link href="/inspiration" className={navLink}>
              {isRtl ? "השראה" : "Inspiration"}
            </Link>
            <a
              href={`/${locale}/#faq`}
              onClick={handleFaqClick}
              className={navLink}
            >
              {isRtl ? "שאלות נפוצות" : "FAQ"}
            </a>
            {user && (
              <Link href="/dashboard" className={navLink}>
                {t("dashboard")}
              </Link>
            )}
          </div>

          {/* ── Right actions ── */}
          <div
            className={`flex items-center gap-3 ${
              isRtl ? "flex-row-reverse mr-auto" : "ml-auto"
            }`}
          >
            <LocaleSwitcher />
            {!isLoading && (
              <>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-pebble hover:text-ink border border-warm-border px-4 py-2 hover:border-ink transition-colors duration-150"
                  >
                    {t("logOut")}
                  </button>
                ) : (
                  <Link href="/login">
                    <button className="text-sm font-medium text-ink border border-ink px-5 py-2 hover:bg-ink hover:text-cream transition-colors duration-150">
                      {t("signIn")}
                    </button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
