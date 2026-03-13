"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { eventCreationSchema, EventCreationInput } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { generateSlug } from "@/lib/db/utils";

interface EventFormProps {
  onSubmit: (data: EventCreationInput) => Promise<void>;
  initialData?: Partial<EventCreationInput>;
  isLoading?: boolean;
}

export function EventForm({
  onSubmit,
  initialData,
  isLoading = false,
}: EventFormProps) {
  const t = useTranslations("events");
  const gt = useTranslations("gifts");
  const locale = useLocale();
  const isRtl = locale === "he";
  const [step, setStep] = useState(1);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.coverImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(locale === "he" ? "סוג קובץ לא נתמך. השתמש ב-JPEG, PNG, WebP או GIF" : "Invalid file type. Use JPEG, PNG, WebP, or GIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(locale === "he" ? "הקובץ גדול מדי. מקסימום 5MB" : "File too large. Maximum 5MB");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setCoverPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      setValue("coverImageUrl", url);
      setCoverPreview(url);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
      setCoverPreview(null);
      setValue("coverImageUrl", undefined as any);
    } finally {
      setIsUploading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventCreationInput>({
    // @ts-expect-error - zod schema inference issue with defaults
    resolver: zodResolver(eventCreationSchema),
    defaultValues: {
      locale: locale as "en" | "he",
      timezone: "UTC",
      visibility: "private" as const,
      eventType: "wedding" as const,
      ...initialData,
    },
  });

  const coupleFirstName = watch("coupleFirstName");
  const coupleSecondName = watch("coupleSecondName");
  const slug = watch("slug");

  // Auto-generate slug when names change
  const handleAutoGenerateSlug = () => {
    if (coupleFirstName && coupleSecondName) {
      const baseSlug = generateSlug(coupleFirstName, coupleSecondName);
      setValue("slug", baseSlug);
    }
  };

  const handleNext = () => {
    // Auto-generate slug when entering step 3 if empty
    if (step === 2 && !slug && coupleFirstName && coupleSecondName) {
      handleAutoGenerateSlug();
    }
    setStep(step + 1);
  };

  // @ts-expect-error - type inference issue with zod defaults
  const onSubmitForm = handleSubmit(onSubmit, (validationErrors) => {
    console.error("Form validation errors:", validationErrors);
  });

  const StepOne = (
    <div className="space-y-4">
      <Input
        label={t("eventTitle")}
        placeholder={locale === "he" ? "שם האירוע" : "Enter event title"}
        {...register("title")}
        error={errors.title?.message}
      />
      <Input
        label={locale === "he" ? "שם זוג - שם ראשון" : "Couple - First Name"}
        placeholder={locale === "he" ? "שם ראשון" : "First name"}
        {...register("coupleFirstName")}
        error={errors.coupleFirstName?.message}
      />
      <Input
        label={locale === "he" ? "שם זוג - שם שני" : "Couple - Second Name"}
        placeholder={locale === "he" ? "שם שני" : "Second name"}
        {...register("coupleSecondName")}
        error={errors.coupleSecondName?.message}
      />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          {t("eventType")}
        </label>
        <select
          {...register("eventType")}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <option value="wedding">{t("eventTypeWedding")}</option>
          <option value="engagement">{t("eventTypeEngagement")}</option>
          <option value="birthday">{t("eventTypeBirthday")}</option>
          <option value="other">{t("eventTypeOther")}</option>
        </select>
      </div>
    </div>
  );

  const StepTwo = (
    <div className="space-y-4">
      <Input
        label={t("eventDate")}
        type="date"
        {...register("eventDate")}
        error={errors.eventDate?.message}
      />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          {t("eventDescription")}
        </label>
        <textarea
          {...register("description")}
          placeholder={
            locale === "he"
              ? "תיאור האירוע (אופציונלי)"
              : "Event description (optional)"
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          rows={4}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          {locale === "he" ? "תמונת כיסוי (אופציונלי)" : "Cover Photo (optional)"}
        </label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            coverPreview ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleCoverUpload}
            className="hidden"
          />
          {coverPreview ? (
            <div className="space-y-2">
              <img
                src={coverPreview}
                alt="Cover preview"
                className="mx-auto max-h-48 rounded-lg object-cover"
              />
              <p className="text-sm text-blue-600">
                {isUploading
                  ? (locale === "he" ? "מעלה..." : "Uploading...")
                  : (locale === "he" ? "לחץ להחלפת תמונה" : "Click to change photo")}
              </p>
            </div>
          ) : (
            <div className="py-6 space-y-2">
              <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-600">
                {locale === "he" ? "לחץ להעלאת תמונת כיסוי" : "Click to upload a cover photo"}
              </p>
              <p className="text-xs text-gray-400">
                JPEG, PNG, WebP, GIF — {locale === "he" ? "עד 5MB" : "up to 5MB"}
              </p>
            </div>
          )}
        </div>
        {uploadError && (
          <p className="text-sm text-red-600 mt-1">{uploadError}</p>
        )}
      </div>
    </div>
  );

  const StepThree = (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          label={locale === "he" ? "קישור קצר (slug)" : "Short Link (Slug)"}
          placeholder="couple-names"
          {...register("slug")}
          error={errors.slug?.message}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleAutoGenerateSlug}
          className="mt-6"
        >
          {locale === "he" ? "ייצור אוטומטי" : "Auto Generate"}
        </Button>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          {locale === "he" ? "שפה" : "Language"}
        </label>
        <select
          {...register("locale")}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <option value="en">English</option>
          <option value="he">עברית</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          {t("visibility")}
        </label>
        <select
          {...register("visibility")}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <option value="private">{t("visibilityPrivate")}</option>
          <option value="unlisted">{t("visibilityUnlisted")}</option>
          <option value="public">{t("visibilityPublic")}</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {watch("visibility") === "private"
            ? locale === "he"
              ? "רק בעלי האירוע יכולים לראות את הדף"
              : "Only event owners can see this page"
            : watch("visibility") === "unlisted"
            ? locale === "he"
              ? "רק מי שיש לו את הקישור יכול לגשת"
              : "Only people with the direct link can access"
            : locale === "he"
            ? "כל אחד יכול לראות את הדף"
            : "Anyone can see this page"}
        </p>
      </div>
    </div>
  );

  const StepFour = (
    <div className="space-y-4">
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium mb-2">
            {locale === "he" ? "יש לתקן את השגיאות הבאות:" : "Please fix the following errors:"}
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{(error as any)?.message || field}</li>
            ))}
          </ul>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "he" ? "סקירה" : "Review"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">{t("eventTitle")}:</span>
            <span className="font-medium">{watch("title")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {locale === "he" ? "שמות הזוג:" : "Couple:"}
            </span>
            <span className="font-medium">
              {watch("coupleFirstName")} {watch("coupleSecondName")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("eventType")}:</span>
            <span className="font-medium">{watch("eventType")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {locale === "he" ? "קישור קצר:" : "Slug:"}
            </span>
            <span className="font-medium">{watch("slug") || <span className="text-red-500 italic">{locale === "he" ? "חסר" : "missing"}</span>}</span>
          </div>
          {watch("eventDate") && (
            <div className="flex justify-between">
              <span className="text-gray-600">{t("eventDate")}:</span>
              <span className="font-medium">{watch("eventDate")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { title: locale === "he" ? "פרטים בסיסיים" : "Basic Info", content: StepOne },
    { title: locale === "he" ? "תאריך ותמונה" : "Date & Image", content: StepTwo },
    { title: locale === "he" ? "הגדרות" : "Settings", content: StepThree },
    { title: locale === "he" ? "סקירה" : "Review", content: StepFour },
  ];

  return (
    <form onSubmit={onSubmitForm} className={`max-w-2xl mx-auto py-8 px-4 ${isRtl ? "rtl" : "ltr"}`}>
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                idx < step ? "bg-blue-600" : idx === step - 1 ? "bg-blue-400" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          {locale === "he" ? `שלב ${step} מתוך ${steps.length}` : `Step ${step} of ${steps.length}`}
        </p>
      </div>

      {/* Content */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {steps[step - 1].title}
        </h2>
        {steps[step - 1].content}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          {locale === "he" ? "חזור" : "Back"}
        </Button>
        <div className="flex gap-4">
          {step < steps.length && (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
            >
              {locale === "he" ? "הבא" : "Next"}
            </Button>
          )}
          {step === steps.length && (
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {locale === "he" ? "צור אירוע" : "Create Event"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
