import { prisma } from "@/lib/prisma";

export const SEARCH_QUERIES = [
  // Hebrew — general
  "חנות אונליין ישראל",
  "קניות לבית משלוח ישראל",
  "חנות אופנה ישראל",
  "חנות רהיטים אונליין ישראל",
  "כלי מטבח קנייה אונליין ישראל",
  "מתנות לבית ישראל",
  "חנות אלקטרוניקה ישראל",
  "מוצרי תינוקות ישראל אונליין",
  "כלי בית ישראל",
  "עיצוב הבית ישראל",
  // English — general
  "buy home decor delivery Israel",
  "Israeli fashion online shop",
  "kitchenware Israel online store",
  "furniture delivery Israel online",
  "baby products Israel online shop",
  "electronics store Israel delivery",
  "bedding linens Israel online",
  "outdoor garden Israel shop",
  "gift registry Israel retailers",
  "home appliances Israel buy online",
  // English — specific categories
  "towels bedsheets Israel buy online",
  "kitchen gadgets Israel delivery",
  "living room furniture Israel",
  "bathroom accessories Israel online",
  "wedding gift ideas Israel shop",
  "tableware dinnerware Israel",
  "lighting lamps Israel online store",
  "storage organization Israel",
  "cleaning supplies Israel delivery",
  "pet supplies Israel online shop",
];

/**
 * Get queries that haven't been used recently, based on the last N batches.
 * Returns all queries sorted so least-recently-used come first.
 */
export async function getRotatedQueries(lookbackBatches = 5): Promise<string[]> {
  const recentBatches = await prisma.discoveryBatch.findMany({
    where: { status: { not: "running" } },
    orderBy: { startedAt: "desc" },
    take: lookbackBatches,
    select: { searchQueries: true },
  });

  const recentlyUsed = new Set(recentBatches.flatMap((b) => b.searchQueries));

  // Unused queries first, then recently used
  const unused = SEARCH_QUERIES.filter((q) => !recentlyUsed.has(q));
  const used = SEARCH_QUERIES.filter((q) => recentlyUsed.has(q));

  return [...unused, ...used];
}
