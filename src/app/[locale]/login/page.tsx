"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validators";
import { useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isRtl = locale === "he";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate email
      const validation = loginSchema.safeParse({ email });
      if (!validation.success) {
        const flattened = validation.error.flatten();
        setError(flattened.fieldErrors.email?.[0] || "Invalid email");
        setIsLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: validation.data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      setError(t("errorSigningIn"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="w-full max-w-md">
        {isSubmitted ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("magicLinkSent")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {t("magicLinkSentDescription", { email })}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                {locale === "he"
                  ? "בדוק את תיקיית הספאם אם לא מצאת את המייל"
                  : "Check your spam folder if you don't see the email"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("loginTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6 text-sm">
                {t("loginDescription")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t("emailLabel")}
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  error={error ? error : undefined}
                  dir={isRtl ? "rtl" : "ltr"}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {t("sendLink")}
                </Button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
