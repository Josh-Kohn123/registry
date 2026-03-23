import { createClient } from "@/lib/supabase/server";
import { generateExtensionToken } from "@/lib/extension-auth";
import { createExtensionToken } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ExtensionAuthClient from "./ExtensionAuthClient";

export default async function ExtensionAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  const { redirect_uri } = await searchParams;

  if (!redirect_uri) {
    return <div>Missing redirect_uri parameter.</div>;
  }

  // Validate redirect_uri to prevent open redirect token theft
  try {
    const parsed = new URL(redirect_uri);
    if (!parsed.hostname.endsWith(".chromiumapp.org")) {
      return <div>Invalid redirect URI.</div>;
    }
  } catch {
    return <div>Invalid redirect URI.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // User is already logged in — generate token and redirect
    const ownership = await prisma.eventOwner.findFirst({
      where: { profileId: user.id, role: "owner" },
      include: {
        event: {
          include: { _count: { select: { productLinks: true } } },
        },
      },
    });

    if (!ownership) {
      return <div>Create an event on the registry first, then connect the extension.</div>;
    }

    const { raw, hash } = generateExtensionToken();
    await createExtensionToken(user.id, hash);

    const url = new URL(redirect_uri);
    url.searchParams.set("token", raw);
    url.searchParams.set("event_id", ownership.event.id);
    url.searchParams.set("event_title", ownership.event.title);
    url.searchParams.set("product_count", String(ownership.event._count.productLinks));

    redirect(url.toString());
  }

  // Not logged in — show login form that redirects back here after auth
  return <ExtensionAuthClient redirectUri={redirect_uri} />;
}
