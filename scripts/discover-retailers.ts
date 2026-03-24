import { PrismaClient } from "@prisma/client";
import { getRotatedQueries } from "../src/lib/discovery/queries";
import { searchGoogle, getQueriesUsed, getRemainingQuota } from "../src/lib/discovery/google-search";
import { checkIsraelDelivery } from "../src/lib/discovery/israel-check";
import { findProductPages } from "../src/lib/discovery/product-finder";
import { scoreBestProduct } from "../src/lib/discovery/og-scorer";

// Use a fresh Prisma client (not the Next.js one) for the standalone script
const prisma = new PrismaClient();

const COOLDOWN_DAYS = 14;

async function main() {
  console.log("=== Retailer Discovery Bot ===\n");

  // Concurrency guard — also handle stale batches (>1 hour old)
  const runningBatch = await prisma.discoveryBatch.findFirst({
    where: { status: "running" },
  });
  if (runningBatch) {
    const ageMs = Date.now() - new Date(runningBatch.startedAt).getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    if (ageMs > ONE_HOUR) {
      console.log(`Stale batch ${runningBatch.id} found (${Math.round(ageMs / 60000)} min old). Marking as failed.`);
      await prisma.discoveryBatch.update({
        where: { id: runningBatch.id },
        data: { status: "failed", completedAt: new Date() },
      });
    } else {
      console.error(`Another discovery run is already in progress (batch ${runningBatch.id}, started ${runningBatch.startedAt})`);
      process.exit(1);
    }
  }

  // Create batch
  const batch = await prisma.discoveryBatch.create({
    data: { status: "running", searchQueries: [] },
  });
  console.log(`Batch ${batch.id} started\n`);

  // Mark batch as failed on unexpected exit
  let batchFinalized = false;
  const cleanup = async () => {
    if (!batchFinalized) {
      console.error("\nScript interrupted. Marking batch as failed...");
      await prisma.discoveryBatch.update({
        where: { id: batch.id },
        data: { status: "failed", completedAt: new Date() },
      }).catch(() => {});
      batchFinalized = true;
    }
    await prisma.$disconnect();
    process.exit(1);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    // Load known domains
    const whitelistedDomains = (await prisma.retailerWhitelist.findMany({ select: { domain: true } }))
      .map((r) => r.domain);

    const discoveredDomains = (await prisma.discoveredRetailer.findMany({ select: { domain: true, status: true, rejectedAt: true } }));

    const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    const knownDomains = new Set<string>([
      ...whitelistedDomains,
      ...discoveredDomains
        .filter((d) => {
          // Skip if pending or approved
          if (d.status !== "rejected") return true;
          // Skip if rejected within cooldown
          if (d.rejectedAt && d.rejectedAt > cooldownCutoff) return true;
          // Past cooldown — allow re-discovery
          return false;
        })
        .map((d) => d.domain),
    ]);

    console.log(`Known domains: ${knownDomains.size} (${whitelistedDomains.length} whitelisted, ${discoveredDomains.length} discovered)\n`);

    // Get rotated queries
    const queries = await getRotatedQueries();
    const usedQueries: string[] = [];

    let retailersFound = 0;
    let retailersSkipped = 0;

    // Discover new domains
    const newDomains: Map<string, { url: string; title: string; query: string }> = new Map();

    for (const query of queries) {
      if (getRemainingQuota() <= 0) {
        console.log("\n[quota] API quota exhausted. Stopping discovery.\n");
        break;
      }

      console.log(`[search] "${query}" (quota: ${getRemainingQuota()} remaining)`);
      usedQueries.push(query);

      const results = await searchGoogle(query);

      for (const result of results) {
        if (knownDomains.has(result.domain)) {
          retailersSkipped++;
          continue;
        }
        if (newDomains.has(result.domain)) continue;

        newDomains.set(result.domain, {
          url: result.url,
          title: result.title,
          query,
        });
        knownDomains.add(result.domain); // prevent duplicate within this run
      }

      // Polite delay between Google queries
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`\n[discovery] Found ${newDomains.size} new domains to validate\n`);

    // Validate each domain
    for (const [domain, info] of newDomains) {
      if (getRemainingQuota() <= 0) {
        console.log("[quota] Saving remaining quota for next run. Stopping validation.");
        break;
      }

      console.log(`[validate] ${domain}...`);

      try {
        // Israel delivery check
        const delivery = await checkIsraelDelivery(domain);
        console.log(`  delivery: ${delivery.deliversToIsrael} ${delivery.evidence ? `(${delivery.evidence})` : ""}`);

        // Find product pages
        const productUrls = await findProductPages(domain);
        console.log(`  products: found ${productUrls.length} URLs`);

        // Score OG tags
        let bestScore = null;
        let bestUrl = "";
        if (productUrls.length > 0) {
          const result = await scoreBestProduct(productUrls);
          if (result) {
            bestScore = result.bestScore;
            bestUrl = result.bestUrl;
          }
        }

        const score = bestScore?.score ?? 0;
        const name = bestScore?.siteName || bestScore?.title?.split(/\s*[-|–]\s*/)[0] || domain;

        console.log(`  OG score: ${score}/3 | name: "${name}"`);

        // Save to DB (upsert in case of cooldown re-check)
        await prisma.discoveredRetailer.upsert({
          where: { domain },
          update: {
            name,
            batchId: batch.id,
            discoverySource: "google_search",
            searchQuery: info.query,
            hasOgTitle: bestScore?.hasOgTitle ?? false,
            hasOgImage: bestScore?.hasOgImage ?? false,
            hasOgPrice: bestScore?.hasOgPrice ?? false,
            score,
            deliversToIsrael: delivery.deliversToIsrael,
            deliveryEvidence: delivery.evidence,
            sampleProductUrl: bestUrl || null,
            sampleProductTitle: bestScore?.title || null,
            sampleImageUrl: bestScore?.imageUrl || null,
            status: "pending",
            rejectedAt: null, // reset if re-discovered
          },
          create: {
            domain,
            name,
            batchId: batch.id,
            discoverySource: "google_search",
            searchQuery: info.query,
            hasOgTitle: bestScore?.hasOgTitle ?? false,
            hasOgImage: bestScore?.hasOgImage ?? false,
            hasOgPrice: bestScore?.hasOgPrice ?? false,
            score,
            deliversToIsrael: delivery.deliversToIsrael,
            deliveryEvidence: delivery.evidence,
            sampleProductUrl: bestUrl || null,
            sampleProductTitle: bestScore?.title || null,
            sampleImageUrl: bestScore?.imageUrl || null,
            status: "pending",
          },
        });

        retailersFound++;

        // Polite delay between retailers
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`  [error] Failed to validate ${domain}:`, error instanceof Error ? error.message : error);
      }
    }

    // Finalize batch
    await prisma.discoveryBatch.update({
      where: { id: batch.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        retailersFound,
        retailersSkipped,
        searchQueries: usedQueries,
      },
    });
    batchFinalized = true;

    console.log(`\n=== Discovery Complete ===`);
    console.log(`Found: ${retailersFound} new retailers`);
    console.log(`Skipped: ${retailersSkipped} (already known)`);
    console.log(`API queries used: ${getQueriesUsed()}/100`);
    console.log(`Batch: ${batch.id}`);
  } catch (error) {
    // Mark batch as failed
    await prisma.discoveryBatch.update({
      where: { id: batch.id },
      data: { status: "failed", completedAt: new Date() },
    });
    batchFinalized = true;
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
