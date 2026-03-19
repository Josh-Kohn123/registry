"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Button } from "./ui/Button";
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
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  // Smooth-scroll to #faq if already on homepage, otherwise navigate there
  const handleFaqClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById("faq");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isRtl = locale === "he";

  return (
    <nav className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 font-bold text-xl text-blue-600 hover:text-blue-700"
          >
            SimchaList
          </Link>

          {/* Center nav links */}
          <div className={`hidden md:flex items-center gap-6 ${isRtl ? "flex-row-reverse" : ""}`}>
            {/* Inspiration — visible to everyone */}
            <Link
              href="/inspiration"
              className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              {isRtl ? "✨ השראה" : "✨ Inspiration"}
            </Link>

            {/* FAQ — links to homepage #faq section */}
            <a
              href={`/${locale}/#faq`}
              onClick={handleFaqClick}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              {isRtl ? "שאלות נפוצות" : "FAQ"}
            </a>

            {/* Dashboard — authenticated users only */}
            {user && (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                {t("dashboard")}
              </Link>
            )}
          </div>

          {/* Right side: locale switcher + auth */}
          <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <LocaleSwitcher />
            {!isLoading && (
              <>
                {user ? (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    {t("logOut")}
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button variant="primary" size="sm">
                      {t("signIn")}
                    </Button>
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
