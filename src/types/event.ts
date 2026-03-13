export type EventType = "wedding" | "engagement" | "birthday" | "other";
export type Visibility = "private" | "unlisted" | "public";

export interface Event {
  id: string;
  title: string;
  coupleFirstName?: string;
  coupleSecondName?: string;
  slug: string;
  description?: string;
  eventDate?: Date;
  eventType: EventType;
  coverImageUrl?: string;
  locale: string;
  timezone: string;
  visibility: Visibility;
  isPublished: boolean;
  isDisabled: boolean;
  minProductPrice: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface EventWithOwners extends Event {
  owners: Array<{
    id: string;
    profileId: string;
    role: string;
  }>;
}

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate?: string;
  eventType: EventType;
  coverImageUrl?: string;
  locale: string;
}
