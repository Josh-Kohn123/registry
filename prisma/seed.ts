import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create sample couple profiles
  const profile1Id = randomUUID();
  const profile2Id = randomUUID();

  const profile1 = await prisma.profile.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      id: profile1Id,
      email: "john@example.com",
      displayName: "John Doe",
      locale: "en",
      timezone: "Asia/Jerusalem",
    },
  });

  const profile2 = await prisma.profile.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      id: profile2Id,
      email: "jane@example.com",
      displayName: "Jane Doe",
      locale: "he",
      timezone: "Asia/Jerusalem",
    },
  });

  console.log("Created profiles:", { profile1, profile2 });

  // Create sample event
  const event = await prisma.event.upsert({
    where: { slug: "demo-wedding" },
    update: {},
    create: {
      title: "John & Jane's Wedding",
      slug: "demo-wedding",
      description: "Our wedding celebration on June 15, 2025",
      eventDate: new Date("2025-06-15"),
      eventType: "wedding",
      coverImageUrl: "https://example.com/cover.jpg",
      locale: "en",
      timezone: "Asia/Jerusalem",
      visibility: "unlisted",
      isPublished: true,
      minProductPrice: 360,
    },
  });

  console.log("Created event:", event);

  // Add event owners
  await prisma.eventOwner.deleteMany({
    where: { eventId: event.id },
  });

  const owner1 = await prisma.eventOwner.create({
    data: {
      eventId: event.id,
      profileId: profile1.id,
      role: "owner",
    },
  });

  const owner2 = await prisma.eventOwner.create({
    data: {
      eventId: event.id,
      profileId: profile2.id,
      role: "owner",
    },
  });

  console.log("Created event owners:", { owner1, owner2 });

  // Add retailer whitelist entries
  await prisma.retailerWhitelist.upsert({
    where: { domain: "foxhome.co.il" },
    update: {},
    create: {
      domain: "foxhome.co.il",
      name: "FOX HOME",
      isActive: true,
    },
  });

  await prisma.retailerWhitelist.upsert({
    where: { domain: "golfco.co.il" },
    update: {},
    create: {
      domain: "golfco.co.il",
      name: "Golf & Co",
      isActive: true,
    },
  });

  await prisma.retailerWhitelist.upsert({
    where: { domain: "naamanp.co.il" },
    update: {},
    create: {
      domain: "naamanp.co.il",
      name: "Naaman",
      isActive: true,
    },
  });

  await prisma.retailerWhitelist.upsert({
    where: { domain: "ace.co.il" },
    update: {},
    create: {
      domain: "ace.co.il",
      name: "ACE",
      isActive: true,
    },
  });

  await prisma.retailerWhitelist.upsert({
    where: { domain: "keter.com" },
    update: {},
    create: {
      domain: "keter.com",
      name: "Keter Israel",
      allowedPaths: "/he-il/",
      isActive: true,
    },
  });

  console.log("Created retailer whitelist entries");

  // Create sample fund
  const fund = await prisma.fund.create({
    data: {
      eventId: event.id,
      title: "Honeymoon Fund",
      description: "Help us celebrate with an unforgettable honeymoon",
      targetAmount: 5000,
      suggestedAmounts: JSON.stringify([500, 1000, 1500, 2000]),
      walletLink: "https://paybox.co.il/pay/sample123",
      providerType: "paybox",
      isVisible: true,
    },
  });

  console.log("Created fund:", fund);

  // Create sample product links
  const product1 = await prisma.productLink.create({
    data: {
      eventId: event.id,
      title: "Modern Coffee Table",
      description: "Beautiful modern design coffee table",
      url: "https://foxhome.co.il/product/coffee-table-123",
      retailerDomain: "foxhome.co.il",
      imageUrl: "https://example.com/coffee-table.jpg",
      estimatedPrice: 450,
      isVisible: true,
    },
  });

  const product2 = await prisma.productLink.create({
    data: {
      eventId: event.id,
      title: "Garden Tools Set",
      description: "Complete garden tools for outdoor maintenance",
      url: "https://golfco.co.il/product/tools-set-456",
      retailerDomain: "golfco.co.il",
      imageUrl: "https://example.com/tools-set.jpg",
      estimatedPrice: 380,
      isVisible: true,
    },
  });

  console.log("Created product links:", { product1, product2 });

  // Create sample bundle
  const bundle = await prisma.bundle.create({
    data: {
      eventId: event.id,
      title: "Living Room Essentials",
      description: "Complete living room setup with furniture and décor",
      targetAmount: 2500,
      suggestedAmounts: JSON.stringify([500, 800, 1200, 1500]),
      storeDomain: "foxhome.co.il",
      imageUrl: "https://example.com/living-room.jpg",
      isVisible: true,
    },
  });

  console.log("Created bundle:", bundle);

  // Add items to bundle
  const bundleItem1 = await prisma.bundleItem.create({
    data: {
      bundleId: bundle.id,
      title: "Modern Sofa",
      url: "https://foxhome.co.il/product/sofa-789",
      imageUrl: "https://example.com/sofa.jpg",
    },
  });

  const bundleItem2 = await prisma.bundleItem.create({
    data: {
      bundleId: bundle.id,
      title: "Wooden Coffee Table",
      url: "https://foxhome.co.il/product/table-012",
      imageUrl: "https://example.com/table.jpg",
    },
  });

  console.log("Created bundle items:", { bundleItem1, bundleItem2 });

  // Create sample reservation
  const reservation = await prisma.reservation.create({
    data: {
      eventId: event.id,
      guestName: "Sarah Cohen",
      guestEmail: "sarah@example.com",
      status: "RESERVED",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      productLinkId: product1.id,
    },
  });

  console.log("Created reservation:", reservation);

  // Create sample address
  const address = await prisma.address.create({
    data: {
      profileId: profile1.id,
      recipientName: "John & Jane Doe",
      phone: "+972-50-1234567",
      city: "Tel Aviv",
      line1: "123 Main Street",
      line2: "Apt 4B",
      postalCode: "69000",
      notes: "Please ring bell twice",
      isDefault: true,
      encryptedData: true,
    },
  });

  console.log("Created address:", address);

  // Create sample click events
  const clickEvent1 = await prisma.clickEvent.create({
    data: {
      eventId: event.id,
      productLinkId: product1.id,
      guestEmail: "visitor@example.com",
      referrer: "https://demo-wedding.example.com",
    },
  });

  const clickEvent2 = await prisma.clickEvent.create({
    data: {
      eventId: event.id,
      fundId: fund.id,
      referrer: "https://demo-wedding.example.com",
    },
  });

  console.log("Created click events:", { clickEvent1, clickEvent2 });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
