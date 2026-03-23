"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  uploadType?: "cover" | "avatar";
  shape?: "rectangle" | "circle";
  placeholderText?: string;
  placeholderSubtext?: string;
  changeText?: string;
  uploadingText?: string;
  maxHeight?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  uploadType = "cover",
  shape = "rectangle",
  placeholderText = "Click to upload",
  placeholderSubtext = "JPEG, PNG, WebP, GIF — up to 5MB",
  changeText = "Click to change",
  uploadingText = "Uploading...",
  maxHeight = "max-h-48",
  className = "",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Use JPEG, PNG, WebP, or GIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      setPreview(url);
      onChange(url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setPreview(null);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const isCircle = shape === "circle";

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed cursor-pointer transition-colors ${
          preview
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        } ${isCircle ? "rounded-full w-32 h-32 mx-auto" : "rounded-lg p-4"}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          className="hidden"
        />
        {preview ? (
          <div className={`${isCircle ? "w-full h-full" : "space-y-2 text-center"}`}>
            <img
              src={preview}
              alt="Upload preview"
              className={`${
                isCircle
                  ? "w-full h-full rounded-full object-cover"
                  : `mx-auto ${maxHeight} rounded-lg object-cover`
              }`}
            />
            {!isCircle && (
              <p className="text-sm text-blue-600">
                {isUploading ? uploadingText : changeText}
              </p>
            )}
          </div>
        ) : (
          <div className={`${isCircle ? "flex flex-col items-center justify-center h-full" : "py-6 space-y-2 text-center"}`}>
            <svg
              className={`${isCircle ? "h-8 w-8" : "mx-auto h-10 w-10"} text-gray-400`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isCircle ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              )}
            </svg>
            {!isCircle && (
              <>
                <p className="text-sm text-gray-600">{placeholderText}</p>
                <p className="text-xs text-gray-400">{placeholderSubtext}</p>
              </>
            )}
          </div>
        )}
        {isCircle && isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1 text-center">{error}</p>}
    </div>
  );
}
