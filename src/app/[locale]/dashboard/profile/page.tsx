"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Profile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const locale = useLocale();
  const isRtl = locale === "he";
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setDisplayName(data.displayName || "");
          setAvatarUrl(data.avatarUrl || null);
        })
        .finally(() => setIsLoading(false));
    });
  }, [router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarUrl }),
      });
      if (res.ok) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRtl ? "rtl" : "ltr"}`}>
        <p className="text-gray-600">{isRtl ? "טוען..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← {isRtl ? "חזור לדשבורד" : "Back to dashboard"}
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRtl ? "הגדרות פרופיל" : "Profile Settings"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {isRtl ? "תמונת פרופיל" : "Profile Picture"}
              </label>
              <div className="flex justify-center">
                <div className="w-36">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    uploadType="avatar"
                    shape="circle"
                    placeholderText={isRtl ? "העלה תמונה" : "Upload photo"}
                    changeText={isRtl ? "שנה תמונה" : "Change photo"}
                    uploadingText={isRtl ? "מעלה..." : "Uploading..."}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {isRtl
                  ? "תמונה זו תוצג בעמוד האירוע הציבורי שלך"
                  : "This photo appears on your public event page"}
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRtl ? "שם תצוגה" : "Display Name"}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isRtl ? "השם שלך" : "Your name"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRtl ? "אימייל" : "Email"}
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? (isRtl ? "שומר..." : "Saving...")
                  : (isRtl ? "שמור שינויים" : "Save Changes")}
              </Button>
              {savedMessage && (
                <span className="text-sm text-green-600 font-medium">
                  {isRtl ? "✓ נשמר בהצלחה" : "✓ Saved!"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
