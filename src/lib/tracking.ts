import crypto from "crypto";

// Privacy-aware device fingerprinting (minimal, hashed)
function getHashedDeviceInfo(): string {
  if (typeof window === "undefined") return "";

  const deviceInfo = {
    // Only non-identifying, high-entropy data
    timezone: new Date().getTimezoneOffset(),
    screen: `${screen.width}x${screen.height}`,
  };

  const str = JSON.stringify(deviceInfo);
  return crypto.createHash("sha256").update(str).digest("hex").substring(0, 16);
}

export async function trackOutboundClick(
  eventId: string,
  targetType: "product" | "fund" | "bundle",
  targetId: string,
  targetUrl?: string
): Promise<void> {
  try {
    // Fire and forget - don't block navigation
    const payload = {
      eventId,
      targetType,
      targetId,
      targetUrl,
      hashedDevice: getHashedDeviceInfo(),
      referrer: document.referrer || undefined,
    };

    // Use sendBeacon for better reliability on navigation
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } else {
      // Fallback to fetch with keepalive
      await fetch("/api/track", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't break user experience
    console.debug("Click tracking failed:", error);
  }
}

// Utility to append UTM parameters (for future affiliate readiness)
export function appendUtmParams(
  url: string,
  eventId: string,
  targetType: string,
  targetId: string
): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("utm_source", "simchalist");
    urlObj.searchParams.set("utm_medium", "registry");
    urlObj.searchParams.set("utm_campaign", eventId);
    urlObj.searchParams.set("utm_content", `${targetType}_${targetId}`);
    return urlObj.toString();
  } catch {
    // If URL is invalid, return as-is
    return url;
  }
}
