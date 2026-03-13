"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Button } from "./ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // Also check initial session
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

  const isRtl = locale === "he";

  return (
    <nav
      className={`bg-white border-b border-gray-200 ${
        isRtl ? "rtl" : "ltr"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <Link
            href="/"
            className="flex-shrink-0 font-bold text-xl text-blue-600 hover:text-blue-700"
          >
            SimchaList
          </Link>

          {/* Center nav items */}
          <div
            className={`hidden md:flex gap-6 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            {user && (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                {t("common")}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div
            className={`flex items-center gap-4 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <LocaleSwitcher />
            {!isLoading && (
              <>
                {user ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
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
