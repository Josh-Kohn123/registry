import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const eventCreationSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200),
  coupleFirstName: z.string().min(1, "First name is required").max(100),
  coupleSecondName: z.string().min(1, "Second name is required").max(100),
  description: z.string().max(1000).optional(),
  eventDate: z.string().optional(),
  eventType: z.enum(["wedding", "engagement", "birthday", "other"]).default("wedding"),
  coverImageUrl: z.string().optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  locale: z.enum(["en", "he"]).default("en"),
  timezone: z.string().default("UTC"),
  visibility: z.enum(["private", "unlisted", "public"]).default("private"),
});

export const eventUpdateSchema = eventCreationSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

export type EventCreationInput = z.infer<typeof eventCreationSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

// Product Link Validators
export const productCreateSchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
  estimatedPrice: z.number().positive().optional(),
});

export const productUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
  estimatedPrice: z.number().positive().optional(),
  isVisible: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const metadataFetchSchema = z.object({
  url: z.string().url("Invalid URL"),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type MetadataFetchInput = z.infer<typeof metadataFetchSchema>;

// Fund Validators
export const fundCreateSchema = z.object({
  title: z.string().min(1, "Fund title is required").max(200),
  description: z.string().max(1000).optional(),
  walletProvider: z.enum(["PAYBOX", "BIT", "OTHER"]),
  walletLink: z.string().url("Invalid wallet link URL"),
  targetAmount: z.number().positive("Target amount must be positive").optional(),
  suggestedAmounts: z.array(z.number().positive()).min(1, "At least one suggested amount is required"),
});

export const fundUpdateSchema = fundCreateSchema.partial().extend({
  isVisible: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const fundContributeSchema = z.object({
  reportedAmount: z.number().positive("Amount must be greater than 0"),
  guestName: z.string().max(200).optional(),
  guestEmail: z.string().email().optional(),
});

export type FundCreateInput = z.infer<typeof fundCreateSchema>;
export type FundUpdateInput = z.infer<typeof fundUpdateSchema>;
export type FundContributeInput = z.infer<typeof fundContributeSchema>;

// Reservation Validators
export const reservationCreateSchema = z.object({
  guestName: z.string().min(1, "Guest name is required").max(200),
  guestEmail: z.string().email().optional().or(z.literal("")),
  productLinkId: z.string().optional(),
  bundleId: z.string().optional(),
}).refine((data) => data.productLinkId || data.bundleId, {
  message: "Either productLinkId or bundleId is required",
});

export const reservationUpdateSchema = z.object({
  status: z.enum(["RESERVED", "PURCHASED_GUEST_CONFIRMED", "RECEIVED_HOST_CONFIRMED", "EXPIRED", "CANCELLED"]).optional(),
});

export const confirmPurchaseSchema = z.object({
  guestEmail: z.string().email().optional().or(z.literal("")),
});

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;
export type ConfirmPurchaseInput = z.infer<typeof confirmPurchaseSchema>;

// Address Validators
export const addressCreateSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  phone: z.string().max(20).optional(),
  city: z.string().min(1, "City is required").max(100),
  line1: z.string().min(1, "Street address is required").max(200),
  line2: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressCreateSchema.partial();

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;

// Bundle Validators
export const bundleItemSchema = z.object({
  title: z.string().min(1, "Item title is required").max(200),
  description: z.string().max(500).optional(),
  estimatedPrice: z.number().positive().optional(),
  url: z.string().url("Invalid URL"),
  imageUrl: z.string().url().optional().or(z.literal("")).or(z.undefined()),
});

export const bundleCreateSchema = z.object({
  title: z.string().min(1, "Bundle title is required").max(200),
  description: z.string().max(1000).optional(),
  targetAmount: z.number().optional().default(0),
  suggestedAmounts: z.array(z.number().positive()).optional(),
  storeDomain: z.string().min(1, "Store domain is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  items: z.array(bundleItemSchema).min(1, "At least one item is required"),
});

export const bundleUpdateSchema = bundleCreateSchema.partial().extend({
  isVisible: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const bundleContributeSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  guestName: z.string().max(200).optional(),
  message: z.string().max(500).optional(),
});

export type BundleItemInput = z.infer<typeof bundleItemSchema>;
export type BundleCreateInput = z.infer<typeof bundleCreateSchema>;
export type BundleUpdateInput = z.infer<typeof bundleUpdateSchema>;
export type BundleContributeInput = z.infer<typeof bundleContributeSchema>;

// Analytics Validators
export const trackClickSchema = z.object({
  eventId: z.string(),
  targetType: z.enum(["product", "fund", "bundle"]),
  targetId: z.string(),
  targetUrl: z.string().url().optional(),
  hashedDevice: z.string().optional(),
  referrer: z.string().optional(),
});

export type TrackClickInput = z.infer<typeof trackClickSchema>;

// Admin Validators
export const reportSchema = z.object({
  reportedEventId: z.string().optional(),
  reportType: z.enum(["malicious_link", "spam", "abuse", "other"]),
  description: z.string().max(1000).optional(),
  reporterEmail: z.string().email().optional(),
});

export const searchEventsSchema = z.object({
  query: z.string().min(1, "Search query required").max(200),
});

export const disableEventSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;
export type DisableEventInput = z.infer<typeof disableEventSchema>;
