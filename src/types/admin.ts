export interface Report {
  id: string;
  reportedEventId?: string;
  reporterEmail?: string;
  reporterProfileId?: string;
  reportType: "malicious_link" | "spam" | "abuse" | "other";
  description?: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface AdminAction {
  id: string;
  eventId: string;
  actionType: string; // disable_event, remove_gift, suspend_user, etc.
  reason?: string;
  metadata?: Record<string, any>;
  adminId?: string;
  createdAt: Date;
}

export interface AdminEventSearchResult {
  id: string;
  slug: string;
  title: string;
  ownerEmail: string;
  isPublished: boolean;
  isDisabled: boolean;
  createdAt: Date;
}
