-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventType" TEXT NOT NULL DEFAULT 'wedding',
    "coverImageUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "minProductPrice" INTEGER NOT NULL DEFAULT 360,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_owners" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_links" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "retailerDomain" TEXT NOT NULL,
    "imageUrl" TEXT,
    "estimatedPrice" INTEGER,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funds" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" INTEGER,
    "suggestedAmounts" TEXT,
    "walletLink" TEXT NOT NULL,
    "providerType" TEXT NOT NULL DEFAULT 'paybox',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_contributions" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "reportedAmount" INTEGER NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fund_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" INTEGER NOT NULL,
    "suggestedAmounts" TEXT,
    "storeDomain" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_contributions" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "guestName" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_items" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productLinkId" TEXT,
    "bundleId" TEXT,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "postalCode" TEXT,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "encryptedData" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_reveals" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "reservationId" TEXT,
    "revealedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "address_reveals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestEmail" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productLinkId" TEXT,
    "fundId" TEXT,
    "bundleId" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailer_whitelist" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowedPaths" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailer_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterEmail" TEXT,
    "reporterProfileId" UUID,
    "reportedEventId" TEXT,
    "reportType" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE INDEX "events_slug_idx" ON "events"("slug");
CREATE INDEX "events_isPublished_idx" ON "events"("isPublished");
CREATE INDEX "events_isDisabled_idx" ON "events"("isDisabled");

-- CreateIndex
CREATE UNIQUE INDEX "event_owners_eventId_profileId_key" ON "event_owners"("eventId", "profileId");
CREATE INDEX "event_owners_profileId_idx" ON "event_owners"("profileId");

-- CreateIndex
CREATE INDEX "product_links_eventId_idx" ON "product_links"("eventId");
CREATE INDEX "product_links_retailerDomain_idx" ON "product_links"("retailerDomain");

-- CreateIndex
CREATE INDEX "funds_eventId_idx" ON "funds"("eventId");

-- CreateIndex
CREATE INDEX "fund_contributions_fundId_idx" ON "fund_contributions"("fundId");

-- CreateIndex
CREATE INDEX "bundles_eventId_idx" ON "bundles"("eventId");
CREATE INDEX "bundles_storeDomain_idx" ON "bundles"("storeDomain");

-- CreateIndex
CREATE INDEX "bundle_contributions_bundleId_idx" ON "bundle_contributions"("bundleId");

-- CreateIndex
CREATE INDEX "bundle_items_bundleId_idx" ON "bundle_items"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_productLinkId_status_key" ON "reservations"("productLinkId", "status");
CREATE INDEX "reservations_eventId_idx" ON "reservations"("eventId");
CREATE INDEX "reservations_guestEmail_idx" ON "reservations"("guestEmail");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "addresses_profileId_idx" ON "addresses"("profileId");

-- CreateIndex
CREATE INDEX "address_reveals_addressId_idx" ON "address_reveals"("addressId");

-- CreateIndex
CREATE INDEX "click_events_eventId_idx" ON "click_events"("eventId");
CREATE INDEX "click_events_productLinkId_idx" ON "click_events"("productLinkId");
CREATE INDEX "click_events_fundId_idx" ON "click_events"("fundId");
CREATE INDEX "click_events_bundleId_idx" ON "click_events"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_whitelist_domain_key" ON "retailer_whitelist"("domain");

-- CreateIndex
CREATE INDEX "admin_actions_eventId_idx" ON "admin_actions"("eventId");
CREATE INDEX "admin_actions_actionType_idx" ON "admin_actions"("actionType");

-- CreateIndex
CREATE INDEX "reports_reportedEventId_idx" ON "reports"("reportedEventId");
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- AddForeignKey
ALTER TABLE "event_owners" ADD CONSTRAINT "event_owners_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_owners" ADD CONSTRAINT "event_owners_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funds" ADD CONSTRAINT "funds_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_contributions" ADD CONSTRAINT "fund_contributions_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_contributions" ADD CONSTRAINT "bundle_contributions_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_productLinkId_fkey" FOREIGN KEY ("productLinkId") REFERENCES "product_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_productLinkId_fkey" FOREIGN KEY ("productLinkId") REFERENCES "product_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "funds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterProfileId_fkey" FOREIGN KEY ("reporterProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
