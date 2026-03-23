import "server-only";

import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateExtensionToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function validateExtensionToken(
  raw: string
): Promise<{ profileId: string } | null> {
  const tokenHash = hashToken(raw);

  const token = await prisma.extensionToken.findUnique({
    where: { tokenHash },
  });

  if (!token || token.revokedAt) {
    return null;
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.extensionToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { profileId: token.profileId };
}

export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
