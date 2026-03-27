"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const isRtl = locale === "he";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    signin: isRtl ? "התחברות" : "Sign in",
    signup: isRtl ? "הרשמה" : "Create account",
    forgot: isRtl ? "שכחתי סיסמה" : "Forgot password",
    email: isRtl ? "אימייל" : "Email address",
    password: isRtl ? "סיסמה" : "Password",
    confirmPassword: isRtl ? "אימות סיסמה" : "Confirm password",
    noAccount: isRtl ? "אין לך חשבון?" : "Don't have an account?",
    hasAccount: isRtl ? "יש לך חשבון?" : "Already have an account?",
    forgotLink: isRtl ? "שכחת סיסמה?" : "Forgot your password?",
    backToSignin: isRtl ? "חזרה להתחברות" : "Back to sign in",
    resetSent: isRtl
      ? "שלחנו לך לינק לאיפוס הסיסמה. בדוק את תיבת הדואר שלך."
      : "We've sent you a password reset link. Check your inbox.",
    signupSuccess: isRtl
      ? "נרשמת בהצלחה! בדוק את האימייל שלך לאישור החשבון."
      : "Account created! Check your email to confirm your account, then sign in.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) { setError(isRtl ? "נא להזין אימייל" : "Please enter your email"); return; }

    if (mode === "signup" || mode === "signin") {
      if (!password) { setError(isRtl ? "נא להזין סיסמה" : "Please enter a password"); return; }
      if (password.length < 6) { setError(isRtl ? "הסיסמה חייבת להכיל לפחות 6 תווים" : "Password must be at least 6 characters"); return; }
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError(isRtl ? "הסיסמאות אינן תואמות" : "Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          if (authError.message.includes("Invalid login credentials")) {
            setError(isRtl ? "אימייל או סיסמה שגויים" : "Incorrect email or password");
          } else if (authError.message.includes("Email not confirmed")) {
            setError(isRtl ? "נא לאשר את האימייל שלך לפני ההתחברות" : "Please confirm your email before signing in");
          } else {
            setError(authError.message);
          }
        } else {
          router.push("/dashboard");
        }

      } else if (mode === "signup") {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
          },
        });
        if (authError) {
          if (authError.message.includes("already registered")) {
            setError(isRtl ? "כתובת האימייל הזו כבר רשומה. נסה להתחבר." : "This email is already registered. Try signing in.");
          } else {
            setError(authError.message);
          }
        } else {
          setSuccess(t.signupSuccess);
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }

      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/${locale}/auth/callback?next=reset-password`,
        });
        if (authError) {
          setError(authError.message);
        } else {
          setSuccess(t.resetSent);
        }
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

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <p className="font-display text-2xl text-ink">SimchaList</p>
          <p className="text-pebble text-sm mt-1">
            {mode === "signin" && (isRtl ? "ברוכים השבים" : "Welcome back")}
            {mode === "signup" && (isRtl ? "צרו חשבון חינמי" : "Create your free account")}
            {mode === "forgot" && (isRtl ? "נשלח לך קישור לאיפוס" : "We'll send you a reset link")}
          </p>
        </div>

        <div className="card p-8">
          {/* Tab toggle — sign in / sign up */}
          {mode !== "forgot" && (
            <div className="flex bg-warm-white rounded-lg p-1 mb-6 border border-warm-border">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === m ? "bg-ink text-cream shadow-sm" : "text-pebble hover:text-ink"
                  }`}>
                  {m === "signin" ? t.signin : t.signup}
                </button>
              ))}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.email}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              dir="ltr"
            />

            {mode !== "forgot" && (
              <Input
                label={t.password}
                type="password"
                placeholder={isRtl ? "לפחות 6 תווים" : "At least 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                dir="ltr"
              />
            )}

            {mode === "signup" && (
              <Input
                label={t.confirmPassword}
                type="password"
                placeholder={isRtl ? "חזור על הסיסמה" : "Repeat password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                dir="ltr"
              />
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
              {mode === "signin" && t.signin}
              {mode === "signup" && t.signup}
              {mode === "forgot" && (isRtl ? "שלח קישור" : "Send reset link")}
            </Button>
          </form>

          {/* Forgot password link */}
          {mode === "signin" && (
            <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
              className="mt-4 w-full text-center text-xs text-pebble hover:text-ink transition-colors">
              {t.forgotLink}
            </button>
          )}

          {/* Back to sign in from forgot */}
          {mode === "forgot" && (
            <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}
              className="mt-4 w-full text-center text-xs text-pebble hover:text-ink transition-colors">
              ← {t.backToSignin}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-mist mt-6">
          {isRtl
            ? "בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו"
            : "By signing up you agree to our Terms of Service and Privacy Policy"}
        </p>
      </div>
    </div>
  );
}
