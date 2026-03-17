import "server-only";

import { prisma } from "@/lib/prisma";
import { EventWithOwners, Event } from "@/types/event";
import { ProductLink } from "@/types/product";
import { Fund, FundContribution } from "@/types/fund";
import { Bundle, BundleItem } from "@/types/bundle";
import { Reservation } from "@/types/reservation";
import { Address } from "@/types/address";
import { ClickEvent } from "@/types/analytics";
import { AdminAction, Report } from "@/types/admin";

// Re-export utilities
export { generateId, generateSlug } from "./utils";

// Ensure a profile exists for the given Supabase user
export async function ensureProfile(userId: string, email: string) {
  await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email,
    },
  });
}

// Type mappers
function mapEventToEventWithOwners(
  event: any,
  owners: any[] = []
): EventWithOwners {
  return {
    id: event.id,
    title: event.title,
    coupleFirstName: event.coupleFirstName,
    coupleSecondName: event.coupleSecondName,
    slug: event.slug,
    description: event.description,
    eventDate: event.eventDate,
    eventType: event.eventType,
    coverImageUrl: event.coverImageUrl,
    locale: event.locale,
    timezone: event.timezone,
    visibility: event.visibility,
    isPublished: event.isPublished,
    isDisabled: event.isDisabled,
    minProductPrice: event.minProductPrice,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    deletedAt: event.deletedAt,
    owners: owners.map((owner) => ({
      id: owner.id,
      profileId: owner.profileId,
      role: owner.role,
    })),
  };
}

function mapProductLinkFromPrisma(product: any): ProductLink {
  return {
    id: product.id,
    eventId: product.eventId,
    title: product.title,
    description: product.description,
    url: product.url,
    retailerDomain: product.retailerDomain,
    imageUrl: product.imageUrl,
    estimatedPrice: product.estimatedPrice,
    previousPrice: product.previousPrice,
    lastPriceFetch: product.lastPriceFetch,
    isVisible: product.isVisible,
    position: product.position || 0,
    clickCount: product.clickCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
  };
}

function mapFundFromPrisma(fund: any): Fund {
  const providerMap: Record<string, any> = {
    paybox: "PAYBOX",
    bit: "BIT",
  };

  return {
    id: fund.id,
    eventId: fund.eventId,
    title: fund.title,
    description: fund.description,
    targetAmount: fund.targetAmount,
    suggestedAmounts: fund.suggestedAmounts
      ? JSON.parse(fund.suggestedAmounts)
      : [],
    walletLink: fund.walletLink,
    walletProvider: providerMap[fund.providerType] || "OTHER",
    position: fund.position || 0,
    isVisible: fund.isVisible,
    clickCount: fund.clickCount,
    createdAt: fund.createdAt,
    updatedAt: fund.updatedAt,
  };
}

function mapFundContributionFromPrisma(
  contribution: any
): FundContribution {
  return {
    id: contribution.id,
    fundId: contribution.fundId,
    reportedAmount: contribution.reportedAmount,
    guestName: contribution.guestName,
    guestEmail: contribution.guestEmail,
    createdAt: contribution.createdAt,
  };
}

function mapBundleFromPrisma(bundle: any, items: BundleItem[] = []): Bundle {
  return {
    id: bundle.id,
    eventId: bundle.eventId,
    title: bundle.title,
    description: bundle.description,
    targetAmount: bundle.targetAmount,
    suggestedAmounts: bundle.suggestedAmounts
      ? JSON.parse(bundle.suggestedAmounts)
      : [],
    storeDomain: bundle.storeDomain,
    imageUrl: bundle.imageUrl,
    isVisible: bundle.isVisible,
    position: bundle.position || 0,
    clickCount: bundle.clickCount,
    currentAmount: 0,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
    items,
  };
}

function mapBundleItemFromPrisma(item: any): BundleItem {
  return {
    id: item.id,
    bundleId: item.bundleId,
    title: item.title,
    url: item.url,
    imageUrl: item.imageUrl,
    estimatedPrice: item.estimatedPrice,
    previousPrice: item.previousPrice,
    lastPriceFetch: item.lastPriceFetch,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapReservationFromPrisma(reservation: any): Reservation {
  return {
    id: reservation.id,
    eventId: reservation.eventId,
    guestName: reservation.guestName,
    guestEmail: reservation.guestEmail,
    status: reservation.status,
    expiresAt: reservation.expiresAt,
    confirmedAt: reservation.confirmedAt,
    receivedAt: reservation.receivedAt,
    chosenAddressId: reservation.chosenAddressId,
    productLinkId: reservation.productLinkId,
    bundleId: reservation.bundleId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

function mapAddressFromPrisma(address: any): Address {
  return {
    id: address.id,
    profileId: address.profileId,
    recipientName: address.recipientName,
    phone: address.phone,
    city: address.city,
    line1: address.line1,
    line2: address.line2,
    postalCode: address.postalCode,
    notes: address.notes,
    isDefault: address.isDefault,
    encryptedData: address.encryptedData,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

function mapClickEventFromPrisma(clickEvent: any): ClickEvent {
  let targetType: "product" | "fund" | "bundle" = "product";
  let targetId = "";
  if (clickEvent.productLinkId) { targetType = "product"; targetId = clickEvent.productLinkId; }
  else if (clickEvent.fundId) { targetType = "fund"; targetId = clickEvent.fundId; }
  else if (clickEvent.bundleId) { targetType = "bundle"; targetId = clickEvent.bundleId; }

  return {
    id: clickEvent.id,
    eventId: clickEvent.eventId,
    targetType,
    targetId,
    guestEmail: clickEvent.guestEmail,
    clickedAt: clickEvent.clickedAt,
    referrer: clickEvent.referrer,
    userAgent: clickEvent.userAgent,
  };
}

function mapAdminActionFromPrisma(action: any): AdminAction {
  let metadata: Record<string, any> | undefined;
  if (action.metadata) {
    try {
      metadata = JSON.parse(action.metadata);
    } catch {
      metadata = undefined;
    }
  }

  return {
    id: action.id,
    eventId: action.eventId,
    actionType: action.actionType,
    reason: action.reason,
    metadata,
    adminId: action.adminId,
    createdAt: action.createdAt,
  };
}

function mapReportFromPrisma(report: any): Report {
  return {
    id: report.id,
    reporterEmail: report.reporterEmail,
    reporterProfileId: report.reporterProfileId,
    reportedEventId: report.reportedEventId,
    reportType: report.reportType,
    description: report.description,
    status: report.status,
    resolvedAt: report.resolvedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

// Event operations
export async function createEvent(
  data: Omit<EventWithOwners, "id" | "createdAt" | "updatedAt" | "deletedAt">
): Promise<EventWithOwners> {
  const { owners: ownerData, ...eventData } = data;

  const event = await prisma.event.create({
    data: {
      ...eventData,
      owners: {
        create: ownerData.map((owner) => ({
          profileId: owner.profileId,
          role: owner.role,
        })),
      },
    },
    include: {
      owners: true,
    },
  });

  return mapEventToEventWithOwners(event, event.owners);
}

export async function getEventById(id: string): Promise<EventWithOwners | null> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { owners: true },
  });

  if (!event) return null;
  return mapEventToEventWithOwners(event, event.owners);
}

export async function getEventBySlug(slug: string): Promise<EventWithOwners | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { owners: true },
  });

  if (!event) return null;
  return mapEventToEventWithOwners(event, event.owners);
}

export async function getUserEvents(userId: string): Promise<EventWithOwners[]> {
  const events = await prisma.event.findMany({
    where: {
      owners: {
        some: {
          profileId: userId,
        },
      },
    },
    include: {
      owners: true,
    },
  });

  return events.map((event: any) => mapEventToEventWithOwners(event, event.owners));
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<EventWithOwners, "id" | "createdAt" | "deletedAt" | "owners">>
): Promise<EventWithOwners | null> {
  const event = await prisma.event.update({
    where: { id },
    data,
    include: { owners: true },
  });

  return mapEventToEventWithOwners(event, event.owners);
}

export async function deleteEvent(id: string): Promise<void> {
  await prisma.event.delete({
    where: { id },
  });
}

export async function publishEvent(
  id: string,
  isPublished: boolean
): Promise<EventWithOwners | null> {
  return updateEvent(id, { isPublished });
}

export async function findUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Product operations
export async function createProduct(
  eventId: string,
  data: Omit<ProductLink, "id" | "createdAt" | "updatedAt" | "clickCount">
): Promise<ProductLink> {
  const { eventId: _eid, ...rest } = data;
  const product = await prisma.productLink.create({
    data: {
      eventId,
      ...rest,
      clickCount: 0,
    },
  });

  return mapProductLinkFromPrisma(product);
}

export async function getProductById(id: string): Promise<ProductLink | null> {
  const product = await prisma.productLink.findUnique({
    where: { id },
  });

  if (!product) return null;
  return mapProductLinkFromPrisma(product);
}

export async function getProductsByEvent(eventId: string): Promise<ProductLink[]> {
  const products = await prisma.productLink.findMany({
    where: { eventId },
  });

  return products.map(mapProductLinkFromPrisma);
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<ProductLink, "id" | "createdAt" | "deletedAt">>
): Promise<ProductLink | null> {
  const product = await prisma.productLink.update({
    where: { id },
    data,
  });

  return mapProductLinkFromPrisma(product);
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.productLink.delete({
    where: { id },
  });
}

export async function incrementFundClickCount(id: string): Promise<Fund | null> {
  const fund = await prisma.fund.findUnique({ where: { id } });
  if (!fund) return null;

  const updated = await prisma.fund.update({
    where: { id },
    data: { clickCount: fund.clickCount + 1 },
  });

  return mapFundFromPrisma(updated);
}

// Fund operations
export async function createFund(
  eventId: string,
  data: Omit<Fund, "id" | "createdAt" | "updatedAt" | "clickCount">
): Promise<Fund> {
  const providerReverseMap: Record<string, string> = {
    PAYBOX: "paybox",
    BIT: "bit",
    OTHER: "other",
  };

  const fund = await prisma.fund.create({
    data: {
      eventId,
      title: data.title,
      description: data.description,
      targetAmount: data.targetAmount,
      suggestedAmounts: data.suggestedAmounts
        ? JSON.stringify(data.suggestedAmounts)
        : undefined,
      walletLink: data.walletLink,
      providerType: providerReverseMap[data.walletProvider] || "paybox",
      isVisible: data.isVisible,
      clickCount: 0,
    },
  });

  return mapFundFromPrisma(fund);
}

export async function getFundById(id: string): Promise<Fund | null> {
  const fund = await prisma.fund.findUnique({
    where: { id },
  });

  if (!fund) return null;
  return mapFundFromPrisma(fund);
}

export async function getFundsByEvent(eventId: string): Promise<Fund[]> {
  const funds = await prisma.fund.findMany({
    where: { eventId },
  });

  return funds.map(mapFundFromPrisma);
}

export async function updateFund(
  id: string,
  data: Partial<Omit<Fund, "id" | "createdAt">>
): Promise<Fund | null> {
  const updateData: any = { ...data };
  if (data.suggestedAmounts) {
    updateData.suggestedAmounts = JSON.stringify(data.suggestedAmounts);
  }

  const fund = await prisma.fund.update({
    where: { id },
    data: updateData,
  });

  return mapFundFromPrisma(fund);
}

export async function deleteFund(id: string): Promise<void> {
  await prisma.fund.delete({
    where: { id },
  });
}

// Fund Contribution operations
export async function createFundContribution(
  fundId: string,
  data: Omit<FundContribution, "id" | "createdAt">
): Promise<FundContribution> {
  const { fundId: _fid, ...rest } = data;
  const contribution = await prisma.fundContribution.create({
    data: {
      fundId,
      ...rest,
    },
  });

  return mapFundContributionFromPrisma(contribution);
}

export async function getFundContributions(
  fundId: string
): Promise<FundContribution[]> {
  const contributions = await prisma.fundContribution.findMany({
    where: { fundId },
  });

  return contributions.map(mapFundContributionFromPrisma);
}

export async function getTotalFundContributions(fundId: string): Promise<number> {
  const result = await prisma.fundContribution.aggregate({
    where: { fundId },
    _sum: {
      reportedAmount: true,
    },
  });

  return result._sum.reportedAmount || 0;
}

// Bundle operations
export async function createBundle(
  eventId: string,
  data: Omit<
    Bundle,
    "id" | "createdAt" | "updatedAt" | "clickCount" | "currentAmount" | "items"
  >
): Promise<Bundle> {
  const bundle = await prisma.bundle.create({
    data: {
      eventId,
      title: data.title,
      description: data.description,
      targetAmount: data.targetAmount,
      suggestedAmounts: data.suggestedAmounts
        ? JSON.stringify(data.suggestedAmounts)
        : undefined,
      storeDomain: data.storeDomain,
      imageUrl: data.imageUrl,
      isVisible: data.isVisible,
      clickCount: 0,
    },
    include: {
      items: true,
    },
  });

  return mapBundleFromPrisma(
    bundle,
    bundle.items.map(mapBundleItemFromPrisma)
  );
}

export async function getBundleById(id: string): Promise<Bundle | null> {
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!bundle) return null;
  return mapBundleFromPrisma(
    bundle,
    bundle.items.map(mapBundleItemFromPrisma)
  );
}

export async function getBundlesByEvent(eventId: string): Promise<Bundle[]> {
  const bundles = await prisma.bundle.findMany({
    where: { eventId },
    include: {
      items: true,
    },
  });

  return bundles.map((bundle: any) =>
    mapBundleFromPrisma(
      bundle,
      bundle.items.map(mapBundleItemFromPrisma)
    )
  );
}

export async function updateBundle(
  id: string,
  data: Partial<Omit<Bundle, "id" | "createdAt" | "items">>
): Promise<Bundle | null> {
  const updateData: any = { ...data };
  if (data.suggestedAmounts) {
    updateData.suggestedAmounts = JSON.stringify(data.suggestedAmounts);
  }

  const bundle = await prisma.bundle.update({
    where: { id },
    data: updateData,
    include: {
      items: true,
    },
  });

  return mapBundleFromPrisma(
    bundle,
    bundle.items.map(mapBundleItemFromPrisma)
  );
}

export async function deleteBundle(id: string): Promise<void> {
  await prisma.bundle.delete({
    where: { id },
  });
}

// Bundle Item operations
export async function addBundleItem(
  bundleId: string,
  data: Omit<BundleItem, "id" | "bundleId" | "createdAt" | "updatedAt">
): Promise<BundleItem> {
  const item = await prisma.bundleItem.create({
    data: {
      bundleId,
      ...data,
    },
  });

  return mapBundleItemFromPrisma(item);
}

export async function removeBundleItem(itemId: string): Promise<void> {
  await prisma.bundleItem.delete({
    where: { id: itemId },
  });
}

export async function updateBundleItem(
  itemId: string,
  data: Partial<Omit<BundleItem, "id" | "bundleId" | "createdAt">>
): Promise<BundleItem | null> {
  const item = await prisma.bundleItem.update({
    where: { id: itemId },
    data,
  });

  return mapBundleItemFromPrisma(item);
}

// Bundle Contribution operations
export async function addBundleContribution(
  bundleId: string,
  data: { guestName?: string; amount: number; message?: string }
): Promise<{ guestName?: string; amount: number; message?: string; createdAt: Date }> {
  const contribution = await prisma.bundleContribution.create({
    data: {
      bundleId,
      ...data,
    },
  });

  return {
    guestName: contribution.guestName || undefined,
    amount: contribution.amount,
    message: contribution.message || undefined,
    createdAt: contribution.createdAt,
  };
}

export async function getBundleContributions(
  bundleId: string
): Promise<Array<{ guestName?: string; amount: number; message?: string; createdAt: Date }>> {
  const contributions = await prisma.bundleContribution.findMany({
    where: { bundleId },
  });

  return contributions.map((c: any) => ({
    guestName: c.guestName || undefined,
    amount: c.amount,
    message: c.message || undefined,
    createdAt: c.createdAt,
  }));
}

export async function getTotalBundleContributions(bundleId: string): Promise<number> {
  const result = await prisma.bundleContribution.aggregate({
    where: { bundleId },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount || 0;
}

export async function incrementBundleClickCount(id: string): Promise<Bundle | null> {
  const bundle = await prisma.bundle.findUnique({ where: { id } });
  if (!bundle) return null;

  const updated = await prisma.bundle.update({
    where: { id },
    data: { clickCount: bundle.clickCount + 1 },
    include: {
      items: true,
    },
  });

  return mapBundleFromPrisma(
    updated,
    updated.items.map(mapBundleItemFromPrisma)
  );
}

// Reservation operations
export async function createReservation(
  eventId: string,
  data: Omit<Reservation, "id" | "createdAt" | "updatedAt">
): Promise<Reservation> {
  const { eventId: _eid, ...rest } = data;
  const reservation = await prisma.reservation.create({
    data: {
      eventId,
      ...rest,
    },
  });

  return mapReservationFromPrisma(reservation);
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) return null;
  return mapReservationFromPrisma(reservation);
}

export async function getReservationsByEvent(eventId: string): Promise<Reservation[]> {
  const reservations = await prisma.reservation.findMany({
    where: { eventId },
  });

  return reservations.map(mapReservationFromPrisma);
}

export async function getReservationsWithItemsByEvent(eventId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { eventId },
    include: {
      productLink: { select: { id: true, title: true, imageUrl: true, estimatedPrice: true, url: true } },
      bundle: { select: { id: true, title: true, imageUrl: true, targetAmount: true } },
    },
  });

  return reservations.map((r) => ({
    ...mapReservationFromPrisma(r),
    product: r.productLink ? {
      id: r.productLink.id,
      title: r.productLink.title,
      imageUrl: r.productLink.imageUrl ?? undefined,
      estimatedPrice: r.productLink.estimatedPrice ?? undefined,
      url: r.productLink.url,
    } : undefined,
    bundle: r.bundle ? {
      id: r.bundle.id,
      title: r.bundle.title,
      imageUrl: r.bundle.imageUrl ?? undefined,
      targetAmount: r.bundle.targetAmount,
    } : undefined,
  }));
}

export async function getReservationsByProduct(
  productLinkId: string
): Promise<Reservation[]> {
  const reservations = await prisma.reservation.findMany({
    where: { productLinkId },
  });

  return reservations.map(mapReservationFromPrisma);
}

export async function getReservationsByBundle(bundleId: string): Promise<Reservation[]> {
  const reservations = await prisma.reservation.findMany({
    where: { bundleId },
  });

  return reservations.map(mapReservationFromPrisma);
}

export async function getActiveReservationByProduct(
  productLinkId: string
): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findFirst({
    where: {
      productLinkId,
      status: {
        in: ["RESERVED", "PURCHASED_GUEST_CONFIRMED"],
      },
    },
  });

  if (!reservation) return null;
  return mapReservationFromPrisma(reservation);
}

export async function getActiveReservationByBundle(
  bundleId: string
): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findFirst({
    where: {
      bundleId,
      status: {
        in: ["RESERVED", "PURCHASED_GUEST_CONFIRMED"],
      },
    },
  });

  if (!reservation) return null;
  return mapReservationFromPrisma(reservation);
}

export async function updateReservation(
  id: string,
  data: Partial<Omit<Reservation, "id" | "createdAt">>
): Promise<Reservation | null> {
  const reservation = await prisma.reservation.update({
    where: { id },
    data,
  });

  return mapReservationFromPrisma(reservation);
}

export async function deleteReservation(id: string): Promise<void> {
  await prisma.reservation.delete({
    where: { id },
  });
}

// Address operations
export async function createAddress(
  profileId: string,
  data: Omit<Address, "id" | "createdAt" | "updatedAt">
): Promise<Address> {
  const { profileId: _pid, ...rest } = data;
  const address = await prisma.address.create({
    data: {
      profileId,
      ...rest,
    },
  });

  return mapAddressFromPrisma(address);
}

export async function getAddressById(id: string): Promise<Address | null> {
  const address = await prisma.address.findUnique({
    where: { id },
  });

  if (!address) return null;
  return mapAddressFromPrisma(address);
}

export async function getAddressesByProfile(profileId: string): Promise<Address[]> {
  const addresses = await prisma.address.findMany({
    where: { profileId },
  });

  return addresses.map(mapAddressFromPrisma);
}

export async function getDefaultAddress(profileId: string): Promise<Address | null> {
  const address = await prisma.address.findFirst({
    where: {
      profileId,
      isDefault: true,
    },
  });

  if (!address) return null;
  return mapAddressFromPrisma(address);
}

export async function updateAddress(
  id: string,
  data: Partial<Omit<Address, "id" | "createdAt">>
): Promise<Address | null> {
  const address = await prisma.address.update({
    where: { id },
    data,
  });

  return mapAddressFromPrisma(address);
}

export async function deleteAddress(id: string): Promise<void> {
  await prisma.address.delete({
    where: { id },
  });
}

// Click Events
export async function createClickEvent(
  eventId: string,
  data: Omit<ClickEvent, "id">
): Promise<ClickEvent> {
  const prismaData: Record<string, unknown> = {
    eventId,
    guestEmail: data.guestEmail,
    clickedAt: data.clickedAt,
    referrer: data.referrer,
    userAgent: data.userAgent,
  };

  // Map app targetType/targetId to Prisma FK fields
  if (data.targetType === "product") prismaData.productLinkId = data.targetId;
  else if (data.targetType === "fund") prismaData.fundId = data.targetId;
  else if (data.targetType === "bundle") prismaData.bundleId = data.targetId;

  const clickEvent = await prisma.clickEvent.create({
    data: prismaData as any,
  });

  return mapClickEventFromPrisma(clickEvent);
}

export async function getClickEventsByEvent(eventId: string): Promise<ClickEvent[]> {
  const clickEvents = await prisma.clickEvent.findMany({
    where: { eventId },
  });

  return clickEvents.map(mapClickEventFromPrisma);
}

// Admin Actions
export async function createAdminAction(
  eventId: string,
  data: Omit<AdminAction, "id" | "createdAt">
): Promise<AdminAction> {
  const { eventId: _eid, metadata, ...rest } = data;
  const adminAction = await prisma.adminAction.create({
    data: {
      eventId,
      ...rest,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });

  return mapAdminActionFromPrisma(adminAction);
}

export async function getAdminActionsByEvent(eventId: string): Promise<AdminAction[]> {
  const actions = await prisma.adminAction.findMany({
    where: { eventId },
  });

  return actions.map(mapAdminActionFromPrisma);
}

export async function getAllAdminActions(): Promise<AdminAction[]> {
  const actions = await prisma.adminAction.findMany();
  return actions.map(mapAdminActionFromPrisma);
}

// Reports
export async function createReport(
  data: Omit<Report, "id" | "createdAt" | "updatedAt">
): Promise<Report> {
  const report = await prisma.report.create({
    data,
  });

  return mapReportFromPrisma(report);
}

export async function getReportById(id: string): Promise<Report | null> {
  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) return null;
  return mapReportFromPrisma(report);
}

export async function getAllReports(): Promise<Report[]> {
  const reports = await prisma.report.findMany();
  return reports.map(mapReportFromPrisma);
}

export async function updateReport(
  id: string,
  data: Partial<Omit<Report, "id" | "createdAt">>
): Promise<Report | null> {
  const report = await prisma.report.update({
    where: { id },
    data,
  });

  return mapReportFromPrisma(report);
}
