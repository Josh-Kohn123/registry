/**
 * migrate-image-proxy.ts
 *
 * Rewrites all existing product imageUrls that point directly to retailer CDNs
 * through our /api/image-proxy endpoint, so hotlink protection never blocks them.
 *
 * Usage (run from repo root, with Docker DB running):
 *   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/registry_dev" npx tsx scripts/migrate-image-proxy.ts
 *
 * Safe to run multiple times — skips products already using the proxy.
 */

import { Client } from "pg";

const PROXY_PREFIX = "/api/image-proxy?url=";

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5433/registry_dev",
  });

  await client.connect();
  console.log("✅ Connected to database\n");
  console.log("🔍 Fetching products with direct imageUrls...\n");

  const { rows } = await client.query<{
    id: string;
    title: string;
    imageUrl: string;
  }>(
    `SELECT id, title, "imageUrl" FROM product_links
     WHERE "imageUrl" IS NOT NULL
       AND "imageUrl" NOT LIKE '/api/image-proxy%'`
  );

  console.log(`Found ${rows.length} products that need migrating.\n`);

  if (rows.length === 0) {
    console.log("✅ Nothing to do — all images already proxied.");
    await client.end();
    return;
  }

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const proxiedUrl = `${PROXY_PREFIX}${encodeURIComponent(row.imageUrl)}`;
      await client.query(
        `UPDATE product_links SET "imageUrl" = $1 WHERE id = $2`,
        [proxiedUrl, row.id]
      );
      const label = (row.title || row.id).slice(0, 60);
      console.log(`  ✓ ${label}`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${row.id}: ${err}`);
      failed++;
    }
  }

  console.log(`\n✅ Done. ${success} updated, ${failed} failed.`);
  await client.end();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
