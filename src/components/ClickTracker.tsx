"use client";

import React, { ReactNode } from "react";
import { trackOutboundClick } from "@/lib/tracking";

interface ClickTrackerProps {
  eventId: string;
  targetType: "product" | "fund" | "bundle";
  targetId: string;
  targetUrl?: string;
  children: ReactNode;
  className?: string;
}

export function ClickTracker({
  eventId,
  targetType,
  targetId,
  targetUrl,
  children,
  className,
}: ClickTrackerProps) {
  const handleClick = async () => {
    // Track the click
    await trackOutboundClick(eventId, targetType, targetId, targetUrl);
  };

  return (
    <div
      onClick={handleClick}
      className={className}
      style={{ cursor: "pointer" }}
    >
      {children}
    </div>
  );
}
