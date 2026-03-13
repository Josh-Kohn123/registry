"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AuthErrorPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const isRtl = locale === "he";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("invalidMagicLink")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              {locale === "he"
                ? "קישור זה אינו תקף או הוא הסתיים. בבקשה בקש קישור חדש."
                : "This link is invalid or has expired. Please request a new one."}
            </p>

            <Link href="/login" className="block">
              <Button variant="primary" size="md" className="w-full">
                {t("loginTitle")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
