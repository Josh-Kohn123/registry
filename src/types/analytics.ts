export interface ClickEvent {
  id: string;
  eventId: string;
  targetType: "product" | "fund" | "bundle";
  targetId: string;
  guestEmail?: string;
  clickedAt: Date;
  referrer?: string;
  userAgent?: string;
}

export interface ClickStats {
  eventId: string;
  totalClicks: number;
  clicksByItem: Array<{
    targetId: string;
    targetType: "product" | "fund" | "bundle";
    title: string;
    clickCount: number;
  }>;
}
