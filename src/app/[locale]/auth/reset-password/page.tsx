"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const isRtl = locale === "he";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(isRtl ? "הסיסמה חייבת להכיל לפחות 6 תווים" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError(isRtl ? "הסיסמאות אינן תואמות" : "Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch {
      setError(isRtl ? "אירעה שגיאה. נסה שוב." : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-cream flex items-center justify-center py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-2xl text-ink">SimchaList</p>
          <p className="text-pebble text-sm mt-1">
            {isRtl ? "בחר סיסמה חדשה" : "Set your new password"}
          </p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-3">✅</p>
              <p className="font-semibold text-ink mb-1">
                {isRtl ? "הסיסמה עודכנה!" : "Password updated!"}
              </p>
              <p className="text-pebble text-sm">
                {isRtl ? "מועבר לדשבורד..." : "Redirecting to dashboard..."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={isRtl ? "סיסמה חדשה" : "New password"}
                type="password"
                placeholder={isRtl ? "לפחות 6 תווים" : "At least 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                dir="ltr"
              />
              <Input
                label={isRtl ? "אימות סיסמה" : "Confirm password"}
                type="password"
                placeholder={isRtl ? "חזור על הסיסמה" : "Repeat password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                dir="ltr"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
                {isRtl ? "שמור סיסמה" : "Save password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
