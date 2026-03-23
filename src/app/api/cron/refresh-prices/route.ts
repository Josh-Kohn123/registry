import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMetadata } from "@/lib/metadata";

// This cron job should run daily at 6:00 AM
// Configure in vercel.json or your hosting provider's cron settings:
// { "path": "/api/cron/refresh-prices", "schedule": "0 6 * * *" }

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret (for Vercel cron jobs or similar)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let updatedProducts = 0;
    let updatedBundleItems = 0;
    let errors = 0;

    // 1. Fetch prices for all visible product links
    const products = await prisma.productLink.findMany({
      where: { isVisible: true, deletedAt: null },
    });

    for (const product of products) {
      try {
        const result = await fetchMetadata(product.url);
        if (result.success && result.data?.price) {
          await prisma.productLink.update({
            where: { id: product.id },
            data: {
              previousPrice: product.estimatedPrice,
              estimatedPrice: result.data.price,
              lastPriceFetch: new Date(),
            },
          });
          updatedProducts++;
        }
      } catch {
        errors++;
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 2. Fetch prices for all bundle items
    const bundleItems = await prisma.bundleItem.findMany({
      include: { bundle: { select: { isVisible: true } } },
    });

    for (const item of bundleItems) {
      try {
        const result = await fetchMetadata(item.url);
        if (result.success && result.data?.price) {
          await prisma.bundleItem.update({
            where: { id: item.id },
            data: {
              previousPrice: item.estimatedPrice,
              estimatedPrice: result.data.price,
              lastPriceFetch: new Date(),
            },
          });
          updatedBundleItems++;
        }
      } catch {
        errors++;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `[CRON] Price refresh complete: ${updatedProducts} products, ${updatedBundleItems} bundle items updated, ${errors} errors`
    );

    return NextResponse.json({
      success: true,
      updatedProducts,
      updatedBundleItems,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Price refresh failed:", error);
    return NextResponse.json(
      { error: "Price refresh failed" },
      { status: 500 }
    );
  }
}
