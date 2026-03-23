// Persistent JSON-backed database
// Data is saved to db.json in the project root and survives server restarts.
// In production, replace with Prisma + PostgreSQL.
// SERVER ONLY — never import this in client components.
import "server-only";

import { EventWithOwners, Event } from "@/types/event";
import { ProductLink } from "@/types/product";
import { Fund, FundContribution } from "@/types/fund";
import { Bundle, BundleItem } from "@/types/bundle";
import { Reservation } from "@/types/reservation";
import { Address } from "@/types/address";
import { ClickEvent } from "@/types/analytics";
import { AdminAction, Report } from "@/types/admin";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

interface MockDB {
  events: Map<string, EventWithOwners>;
  eventsBySlug: Map<string, string>;
  products: Map<string, ProductLink>;
  productsByEvent: Map<string, string[]>;
  funds: Map<string, Fund>;
  fundsByEvent: Map<string, string[]>;
  contributions: Map<string, FundContribution>;
  contributionsByFund: Map<string, string[]>;
  bundles: Map<string, Bundle>;
  bundlesByEvent: Map<string, string[]>;
  bundleItems: Map<string, BundleItem>;
  bundleItemsByBundle: Map<string, string[]>;
  bundleContributions: Map<string, { guestName?: string; amount: number; message?: string; createdAt: Date }>;
  bundleContributionsByBundle: Map<string, string[]>;
  reservations: Map<string, Reservation>;
  reservationsByEvent: Map<string, string[]>;
  reservationsByProduct: Map<string, string[]>;
  reservationsByBundle: Map<string, string[]>;
  addresses: Map<string, Address>;
  addressesByProfile: Map<string, string[]>;
  clickEvents: Map<string, ClickEvent>;
  clickEventsByEvent: Map<string, string[]>;
  adminActions: Map<string, AdminAction>;
  adminActionsByEvent: Map<string, string[]>;
  reports: Map<string, Report>;
}

// ---- Persistence helpers ----

function mapToObj<V>(map: Map<string, V>): Record<string, V> {
  const obj: Record<string, V> = {};
  for (const [k, v] of map) obj[k] = v;
  return obj;
}

function objToMap<V>(obj: Record<string, V> | undefined): Map<string, V> {
  const map = new Map<string, V>();
  if (obj) for (const [k, v] of Object.entries(obj)) map.set(k, v);
  return map;
}

function saveToDisk(): void {
  try {
    const serialised: Record<string, Record<string, any>> = {};
    for (const [key, val] of Object.entries(db)) {
      if (val instanceof Map) serialised[key] = mapToObj(val);
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(serialised, null, 2), "utf-8");
  } catch (e) {
    console.error("[db] Failed to save:", e);
  }
}

function loadFromDisk(): void {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    for (const key of Object.keys(db) as (keyof MockDB)[]) {
      if (raw[key] && db[key] instanceof Map) {
        (db as any)[key] = objToMap(raw[key]);
      }
    }
    console.log("[db] Loaded data from db.json");
  } catch (e) {
    console.error("[db] Failed to load:", e);
  }
}

const db: MockDB = {
  events: new Map(),
  eventsBySlug: new Map(),
  products: new Map(),
  productsByEvent: new Map(),
  funds: new Map(),
  fundsByEvent: new Map(),
  contributions: new Map(),
  contributionsByFund: new Map(),
  bundles: new Map(),
  bundlesByEvent: new Map(),
  bundleItems: new Map(),
  bundleItemsByBundle: new Map(),
  bundleContributions: new Map(),
  bundleContributionsByBundle: new Map(),
  reservations: new Map(),
  reservationsByEvent: new Map(),
  reservationsByProduct: new Map(),
  reservationsByBundle: new Map(),
  addresses: new Map(),
  addressesByProfile: new Map(),
  clickEvents: new Map(),
  clickEventsByEvent: new Map(),
  adminActions: new Map(),
  adminActionsByEvent: new Map(),
  reports: new Map(),
};

// Load persisted data on module init
loadFromDisk();

// Import and re-export pure utils so server-side callers only need one import
import { generateId, generateSlug } from "./utils";
export { generateId, generateSlug };

export function findUniqueSlug(baseSlug: string): string {
  let slug = baseSlug;
  let counter = 1;

  while (db.eventsBySlug.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function createEvent(
  data: Omit<EventWithOwners, "id" | "createdAt" | "updatedAt" | "deletedAt">
): Promise<EventWithOwners> {
  const id = generateId();
  const now = new Date();

  const event: EventWithOwners = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  db.events.set(id, event);
  db.eventsBySlug.set(event.slug, id);
  saveToDisk();

  return event;
}

export async function getEventById(id: string): Promise<EventWithOwners | null> {
  return db.events.get(id) || null;
}

export async function getEventBySlug(slug: string): Promise<EventWithOwners | null> {
  const eventId = db.eventsBySlug.get(slug);
  return eventId ? db.events.get(eventId) || null : null;
}

export async function getUserEvents(userId: string): Promise<EventWithOwners[]> {
  return Array.from(db.events.values()).filter((event) =>
    event.owners.some((owner) => owner.profileId === userId)
  );
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<EventWithOwners, "id" | "createdAt" | "deletedAt">>
): Promise<EventWithOwners | null> {
  const event = db.events.get(id);
  if (!event) return null;

  // If slug is changing, update the slug map
  if (data.slug && data.slug !== event.slug) {
    db.eventsBySlug.delete(event.slug);
    db.eventsBySlug.set(data.slug, id);
  }

  const updated = {
    ...event,
    ...data,
    updatedAt: new Date(),
  };

  db.events.set(id, updated);
  saveToDisk();
  return updated;
}

export async function deleteEvent(id: string): Promise<void> {
  const event = db.events.get(id);
  if (event) {
    db.eventsBySlug.delete(event.slug);
    db.events.delete(id);
    saveToDisk();
  }
}

export async function publishEvent(id: string, isPublished: boolean): Promise<EventWithOwners | null> {
  return updateEvent(id, { isPublished });
}

// Product operations
export async function createProduct(
  eventId: string,
  data: Omit<ProductLink, "id" | "createdAt" | "updatedAt" | "clickCount">
): Promise<ProductLink> {
  const id = generateId();
  const now = new Date();

  const product: ProductLink = {
    ...data,
    id,
    clickCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.products.set(id, product);

  // Add to event's product list
  const eventProducts = db.productsByEvent.get(eventId) || [];
  eventProducts.push(id);
  db.productsByEvent.set(eventId, eventProducts);
  saveToDisk();

  return product;
}

export async function getProductById(id: string): Promise<ProductLink | null> {
  return db.products.get(id) || null;
}

export async function getProductsByEvent(eventId: string): Promise<ProductLink[]> {
  const productIds = db.productsByEvent.get(eventId) || [];
  return productIds
    .map((id) => db.products.get(id))
    .filter((p) => p !== undefined) as ProductLink[];
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<ProductLink, "id" | "createdAt" | "deletedAt">>
): Promise<ProductLink | null> {
  const product = db.products.get(id);
  if (!product) return null;

  const updated: ProductLink = {
    ...product,
    ...data,
    updatedAt: new Date(),
  };

  db.products.set(id, updated);
  saveToDisk();
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const product = db.products.get(id);
  if (!product) return;

  // Remove from event's product list
  const eventProducts = db.productsByEvent.get(product.eventId) || [];
  const filtered = eventProducts.filter((pId) => pId !== id);
  db.productsByEvent.set(product.eventId, filtered);

  // Hard delete in mock
  db.products.delete(id);
  saveToDisk();
}

// Fund operations
export async function createFund(
  eventId: string,
  data: Omit<Fund, "id" | "createdAt" | "updatedAt" | "clickCount">
): Promise<Fund> {
  const id = generateId();
  const now = new Date();

  const fund: Fund = {
    ...data,
    id,
    clickCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.funds.set(id, fund);

  // Add to event's fund list
  const eventFunds = db.fundsByEvent.get(eventId) || [];
  eventFunds.push(id);
  db.fundsByEvent.set(eventId, eventFunds);
  saveToDisk();

  return fund;
}

export async function getFundById(id: string): Promise<Fund | null> {
  return db.funds.get(id) || null;
}

export async function getFundsByEvent(eventId: string): Promise<Fund[]> {
  const fundIds = db.fundsByEvent.get(eventId) || [];
  return fundIds
    .map((id) => db.funds.get(id))
    .filter((f) => f !== undefined) as Fund[];
}

export async function updateFund(
  id: string,
  data: Partial<Omit<Fund, "id" | "createdAt">>
): Promise<Fund | null> {
  const fund = db.funds.get(id);
  if (!fund) return null;

  const updated: Fund = {
    ...fund,
    ...data,
    updatedAt: new Date(),
  };

  db.funds.set(id, updated);
  saveToDisk();
  return updated;
}

export async function deleteFund(id: string): Promise<void> {
  const fund = db.funds.get(id);
  if (!fund) return;

  // Remove from event's fund list
  const eventFunds = db.fundsByEvent.get(fund.eventId) || [];
  const filtered = eventFunds.filter((fId) => fId !== id);
  db.fundsByEvent.set(fund.eventId, filtered);

  // Remove associated contributions
  const fundContributions = db.contributionsByFund.get(id) || [];
  fundContributions.forEach((cId) => db.contributions.delete(cId));
  db.contributionsByFund.delete(id);

  // Hard delete in mock
  db.funds.delete(id);
  saveToDisk();
}

export async function incrementFundClickCount(id: string): Promise<Fund | null> {
  const fund = db.funds.get(id);
  if (!fund) return null;

  return updateFund(id, { clickCount: fund.clickCount + 1 });
}

// Fund Contribution operations
export async function createFundContribution(
  fundId: string,
  data: Omit<FundContribution, "id" | "createdAt">
): Promise<FundContribution> {
  const id = generateId();
  const now = new Date();

  const contribution: FundContribution = {
    ...data,
    id,
    fundId,
    createdAt: now,
  };

  db.contributions.set(id, contribution);

  // Add to fund's contributions list
  const fundContributions = db.contributionsByFund.get(fundId) || [];
  fundContributions.push(id);
  db.contributionsByFund.set(fundId, fundContributions);
  saveToDisk();

  return contribution;
}

export async function getFundContributions(fundId: string): Promise<FundContribution[]> {
  const contributionIds = db.contributionsByFund.get(fundId) || [];
  return contributionIds
    .map((id) => db.contributions.get(id))
    .filter((c) => c !== undefined) as FundContribution[];
}

export async function getTotalFundContributions(fundId: string): Promise<number> {
  const contributions = await getFundContributions(fundId);
  return contributions.reduce((sum, c) => sum + c.reportedAmount, 0);
}

// Reservation operations
export async function createReservation(
  eventId: string,
  data: Omit<Reservation, "id" | "createdAt" | "updatedAt">
): Promise<Reservation> {
  const id = generateId();
  const now = new Date();

  const reservation: Reservation = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  db.reservations.set(id, reservation);
  // Add to event's reservation list
  const eventReservations = db.reservationsByEvent.get(eventId) || [];
  eventReservations.push(id);
  db.reservationsByEvent.set(eventId, eventReservations);

  // Add to product's reservation list if productLinkId exists
  if (data.productLinkId) {
    const productReservations = db.reservationsByProduct.get(data.productLinkId) || [];
    productReservations.push(id);
    db.reservationsByProduct.set(data.productLinkId, productReservations);
  }

  // Add to bundle's reservation list if bundleId exists
  if (data.bundleId) {
    const bundleReservations = db.reservationsByBundle.get(data.bundleId) || [];
    bundleReservations.push(id);
    db.reservationsByBundle.set(data.bundleId, bundleReservations);
  }
  saveToDisk();

  return reservation;
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  return db.reservations.get(id) || null;
}

export async function getReservationsByEvent(eventId: string): Promise<Reservation[]> {
  const reservationIds = db.reservationsByEvent.get(eventId) || [];
  return reservationIds
    .map((id) => db.reservations.get(id))
    .filter((r) => r !== undefined) as Reservation[];
}

export async function getReservationsByProduct(productLinkId: string): Promise<Reservation[]> {
  const reservationIds = db.reservationsByProduct.get(productLinkId) || [];
  return reservationIds
    .map((id) => db.reservations.get(id))
    .filter((r) => r !== undefined) as Reservation[];
}

export async function getReservationsByBundle(bundleId: string): Promise<Reservation[]> {
  const reservationIds = db.reservationsByBundle.get(bundleId) || [];
  return reservationIds
    .map((id) => db.reservations.get(id))
    .filter((r) => r !== undefined) as Reservation[];
}

export async function getActiveReservationByProduct(productLinkId: string): Promise<Reservation | null> {
  const reservations = await getReservationsByProduct(productLinkId);
  return (
    reservations.find(
      (r) =>
        r.status === "RESERVED" || r.status === "PURCHASED_GUEST_CONFIRMED"
    ) || null
  );
}

export async function getActiveReservationByBundle(bundleId: string): Promise<Reservation | null> {
  const reservations = await getReservationsByBundle(bundleId);
  return (
    reservations.find(
      (r) =>
        r.status === "RESERVED" || r.status === "PURCHASED_GUEST_CONFIRMED"
    ) || null
  );
}

export async function updateReservation(
  id: string,
  data: Partial<Omit<Reservation, "id" | "createdAt">>
): Promise<Reservation | null> {
  const reservation = db.reservations.get(id);
  if (!reservation) return null;

  const updated: Reservation = {
    ...reservation,
    ...data,
    updatedAt: new Date(),
  };

  db.reservations.set(id, updated);
  saveToDisk();
  return updated;
}

export async function deleteReservation(id: string): Promise<void> {
  const reservation = db.reservations.get(id);
  if (!reservation) return;

  // Remove from event's reservation list
  const eventReservations = db.reservationsByEvent.get(reservation.eventId) || [];
  db.reservationsByEvent.set(
    reservation.eventId,
    eventReservations.filter((rId) => rId !== id)
  );

  // Remove from product's reservation list
  if (reservation.productLinkId) {
    const productReservations = db.reservationsByProduct.get(reservation.productLinkId) || [];
    db.reservationsByProduct.set(
      reservation.productLinkId,
      productReservations.filter((rId) => rId !== id)
    );
  }

  // Remove from bundle's reservation list
  if (reservation.bundleId) {
    const bundleReservations = db.reservationsByBundle.get(reservation.bundleId) || [];
    db.reservationsByBundle.set(
      reservation.bundleId,
      bundleReservations.filter((rId) => rId !== id)
    );
  }

  db.reservations.delete(id);
  saveToDisk();
}

// Address operations
export async function createAddress(
  profileId: string,
  data: Omit<Address, "id" | "createdAt" | "updatedAt">
): Promise<Address> {
  const id = generateId();
  const now = new Date();

  const address: Address = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  db.addresses.set(id, address);

  // Add to profile's address list
  const profileAddresses = db.addressesByProfile.get(profileId) || [];
  profileAddresses.push(id);
  db.addressesByProfile.set(profileId, profileAddresses);
  saveToDisk();

  return address;
}

export async function getAddressById(id: string): Promise<Address | null> {
  return db.addresses.get(id) || null;
}

export async function getAddressesByProfile(profileId: string): Promise<Address[]> {
  const addressIds = db.addressesByProfile.get(profileId) || [];
  return addressIds
    .map((id) => db.addresses.get(id))
    .filter((a) => a !== undefined) as Address[];
}

export async function getDefaultAddress(profileId: string): Promise<Address | null> {
  const addresses = await getAddressesByProfile(profileId);
  return addresses.find((a) => a.isDefault) || null;
}

export async function updateAddress(
  id: string,
  data: Partial<Omit<Address, "id" | "createdAt">>
): Promise<Address | null> {
  const address = db.addresses.get(id);
  if (!address) return null;

  const updated: Address = {
    ...address,
    ...data,
    updatedAt: new Date(),
  };

  db.addresses.set(id, updated);
  saveToDisk();
  return updated;
}

export async function deleteAddress(id: string): Promise<void> {
  const address = db.addresses.get(id);
  if (!address) return;

  // Remove from profile's address list
  const profileAddresses = db.addressesByProfile.get(address.profileId) || [];
  db.addressesByProfile.set(
    address.profileId,
    profileAddresses.filter((aId) => aId !== id)
  );

  db.addresses.delete(id);
  saveToDisk();
}

// Bundle operations
export async function createBundle(
  eventId: string,
  data: Omit<Bundle, "id" | "createdAt" | "updatedAt" | "clickCount" | "currentAmount">
): Promise<Bundle> {
  const id = generateId();
  const now = new Date();

  const bundle: Bundle = {
    ...data,
    id,
    clickCount: 0,
    currentAmount: 0,
    createdAt: now,
    updatedAt: now,
    items: [], // Items will be added separately
  };

  db.bundles.set(id, bundle);

  // Add to event's bundle list
  const eventBundles = db.bundlesByEvent.get(eventId) || [];
  eventBundles.push(id);
  db.bundlesByEvent.set(eventId, eventBundles);
  saveToDisk();

  return bundle;
}

export async function getBundleById(id: string): Promise<Bundle | null> {
  const bundle = db.bundles.get(id);
  if (!bundle) return null;

  // Fetch items
  const itemIds = db.bundleItemsByBundle.get(id) || [];
  const items = itemIds
    .map((itemId) => db.bundleItems.get(itemId))
    .filter((item) => item !== undefined) as BundleItem[];

  return {
    ...bundle,
    items,
  };
}

export async function getBundlesByEvent(eventId: string): Promise<Bundle[]> {
  const bundleIds = db.bundlesByEvent.get(eventId) || [];
  const bundles = await Promise.all(
    bundleIds.map(async (id) => {
      const bundle = db.bundles.get(id);
      if (!bundle) return null;

      const itemIds = db.bundleItemsByBundle.get(id) || [];
      const items = itemIds
        .map((itemId) => db.bundleItems.get(itemId))
        .filter((item) => item !== undefined) as BundleItem[];

      return {
        ...bundle,
        items,
      };
    })
  );

  return bundles.filter((b) => b !== null) as Bundle[];
}

export async function updateBundle(
  id: string,
  data: Partial<Omit<Bundle, "id" | "createdAt" | "items">>
): Promise<Bundle | null> {
  const bundle = db.bundles.get(id);
  if (!bundle) return null;

  const updated: Bundle = {
    ...bundle,
    ...data,
    updatedAt: new Date(),
    items: bundle.items, // Preserve items
  };

  db.bundles.set(id, updated);
  saveToDisk();

  // Fetch updated items
  const itemIds = db.bundleItemsByBundle.get(id) || [];
  const items = itemIds
    .map((itemId) => db.bundleItems.get(itemId))
    .filter((item) => item !== undefined) as BundleItem[];

  return {
    ...updated,
    items,
  };
}

export async function deleteBundle(id: string): Promise<void> {
  const bundle = db.bundles.get(id);
  if (!bundle) return;

  // Remove from event's bundle list
  const eventBundles = db.bundlesByEvent.get(bundle.eventId) || [];
  const filtered = eventBundles.filter((bId) => bId !== id);
  db.bundlesByEvent.set(bundle.eventId, filtered);

  // Remove associated items
  const bundleItems = db.bundleItemsByBundle.get(id) || [];
  bundleItems.forEach((itemId) => db.bundleItems.delete(itemId));
  db.bundleItemsByBundle.delete(id);

  // Remove associated contributions
  const bundleContributions = db.bundleContributionsByBundle.get(id) || [];
  bundleContributions.forEach((cId) => db.bundleContributions.delete(cId));
  db.bundleContributionsByBundle.delete(id);

  // Hard delete
  db.bundles.delete(id);
  saveToDisk();
}

// Bundle Item operations
export async function addBundleItem(
  bundleId: string,
  data: Omit<BundleItem, "id" | "bundleId" | "createdAt" | "updatedAt">
): Promise<BundleItem> {
  const id = generateId();
  const now = new Date();

  const item: BundleItem = {
    ...data,
    id,
    bundleId,
    createdAt: now,
    updatedAt: now,
  };

  db.bundleItems.set(id, item);

  // Add to bundle's items list
  const bundleItems = db.bundleItemsByBundle.get(bundleId) || [];
  bundleItems.push(id);
  db.bundleItemsByBundle.set(bundleId, bundleItems);
  saveToDisk();

  return item;
}

export async function removeBundleItem(itemId: string): Promise<void> {
  const item = db.bundleItems.get(itemId);
  if (!item) return;

  // Remove from bundle's items list
  const bundleItems = db.bundleItemsByBundle.get(item.bundleId) || [];
  db.bundleItemsByBundle.set(
    item.bundleId,
    bundleItems.filter((iId) => iId !== itemId)
  );

  db.bundleItems.delete(itemId);
  saveToDisk();
}

export async function updateBundleItem(
  itemId: string,
  data: Partial<Omit<BundleItem, "id" | "bundleId" | "createdAt">>
): Promise<BundleItem | null> {
  const item = db.bundleItems.get(itemId);
  if (!item) return null;

  const updated: BundleItem = {
    ...item,
    ...data,
    updatedAt: new Date(),
  };

  db.bundleItems.set(itemId, updated);
  saveToDisk();
  return updated;
}

// Bundle Contribution operations
export async function addBundleContribution(
  bundleId: string,
  data: { guestName?: string; amount: number; message?: string }
): Promise<{ guestName?: string; amount: number; message?: string; createdAt: Date }> {
  const id = generateId();
  const now = new Date();

  const contribution = {
    ...data,
    createdAt: now,
  };

  db.bundleContributions.set(id, contribution);

  // Add to bundle's contributions list
  const bundleContributions = db.bundleContributionsByBundle.get(bundleId) || [];
  bundleContributions.push(id);
  db.bundleContributionsByBundle.set(bundleId, bundleContributions);
  saveToDisk();

  return contribution;
}

export async function getBundleContributions(
  bundleId: string
): Promise<Array<{ guestName?: string; amount: number; message?: string; createdAt: Date }>> {
  const contributionIds = db.bundleContributionsByBundle.get(bundleId) || [];
  return contributionIds
    .map((id) => db.bundleContributions.get(id))
    .filter((c) => c !== undefined) as Array<{ guestName?: string; amount: number; message?: string; createdAt: Date }>;
}

export async function getTotalBundleContributions(bundleId: string): Promise<number> {
  const contributions = await getBundleContributions(bundleId);
  return contributions.reduce((sum, c) => sum + c.amount, 0);
}

export async function incrementBundleClickCount(id: string): Promise<Bundle | null> {
  const bundle = db.bundles.get(id);
  if (!bundle) return null;

  return updateBundle(id, { clickCount: bundle.clickCount + 1 });
}

// Click Events (Analytics)
export async function createClickEvent(
  eventId: string,
  data: Omit<ClickEvent, "id">
): Promise<ClickEvent> {
  const id = generateId();

  const clickEvent: ClickEvent = {
    ...data,
    id,
  };

  db.clickEvents.set(id, clickEvent);

  // Add to event's click events list
  const eventClickEvents = db.clickEventsByEvent.get(eventId) || [];
  eventClickEvents.push(id);
  db.clickEventsByEvent.set(eventId, eventClickEvents);
  saveToDisk();

  return clickEvent;
}

export async function getClickEventsByEvent(eventId: string): Promise<ClickEvent[]> {
  const clickEventIds = db.clickEventsByEvent.get(eventId) || [];
  return clickEventIds
    .map((id) => db.clickEvents.get(id))
    .filter((e) => e !== undefined) as ClickEvent[];
}

// Admin Actions (Audit Log)
export async function createAdminAction(
  eventId: string,
  data: Omit<AdminAction, "id" | "createdAt">
): Promise<AdminAction> {
  const id = generateId();

  const adminAction: AdminAction = {
    ...data,
    id,
    createdAt: new Date(),
  };

  db.adminActions.set(id, adminAction);

  // Add to event's admin actions list
  const eventAdminActions = db.adminActionsByEvent.get(eventId) || [];
  eventAdminActions.push(id);
  db.adminActionsByEvent.set(eventId, eventAdminActions);
  saveToDisk();

  return adminAction;
}

export async function getAdminActionsByEvent(eventId: string): Promise<AdminAction[]> {
  const actionIds = db.adminActionsByEvent.get(eventId) || [];
  return actionIds
    .map((id) => db.adminActions.get(id))
    .filter((a) => a !== undefined) as AdminAction[];
}

export async function getAllAdminActions(): Promise<AdminAction[]> {
  return Array.from(db.adminActions.values());
}

// Reports
export async function createReport(
  data: Omit<Report, "id" | "createdAt" | "updatedAt">
): Promise<Report> {
  const id = generateId();
  const now = new Date();

  const report: Report = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  db.reports.set(id, report);
  saveToDisk();
  return report;
}

export async function getReportById(id: string): Promise<Report | null> {
  return db.reports.get(id) || null;
}

export async function getAllReports(): Promise<Report[]> {
  return Array.from(db.reports.values());
}

export async function updateReport(
  id: string,
  data: Partial<Omit<Report, "id" | "createdAt">>
): Promise<Report | null> {
  const report = db.reports.get(id);
  if (!report) return null;

  const updated: Report = {
    ...report,
    ...data,
    updatedAt: new Date(),
  };

  db.reports.set(id, updated);
  saveToDisk();
  return updated;
}

// For testing
export function clearDatabase(): void {
  db.events.clear();
  db.eventsBySlug.clear();
  db.products.clear();
  db.productsByEvent.clear();
  db.funds.clear();
  db.fundsByEvent.clear();
  db.contributions.clear();
  db.contributionsByFund.clear();
  db.bundles.clear();
  db.bundlesByEvent.clear();
  db.bundleItems.clear();
  db.bundleItemsByBundle.clear();
  db.bundleContributions.clear();
  db.bundleContributionsByBundle.clear();
  db.reservations.clear();
  db.reservationsByEvent.clear();
  db.reservationsByProduct.clear();
  db.reservationsByBundle.clear();
  db.addresses.clear();
  db.addressesByProfile.clear();
  db.clickEvents.clear();
  db.clickEventsByEvent.clear();
  db.adminActions.clear();
  db.adminActionsByEvent.clear();
  db.reports.clear();
}
