"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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

  return (
    <div className={`min-h-screen ${isRtl ? "rtl" : "ltr"}`}>
      {/* Hero Section */}
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
                  <Link href="/login">
                    <Button variant="outline" size="lg">
                      {t("common.signUp")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {locale === "he" ? "כיצד זה עובד" : "How It Works"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
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

            {/* Card 2 */}
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

            {/* Card 3 */}
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

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {locale === "he"
              ? "מוכנים להתחיל?"
              : "Ready to get started?"}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {locale === "he"
              ? "צור את רשם המתנות שלך היום וקבל עזרה מן הקהילה"
              : "Create your gift registry today and get help from the community"}
          </p>
          {!user && (
            <Link href="/login">
              <Button variant="secondary" size="lg">
                {t("common.signIn")}
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
