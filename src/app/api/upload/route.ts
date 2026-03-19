import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploadType = (formData.get("type") as string) || "cover"; // "cover" | "avatar"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename based on upload type
    const ext = file.name.split(".").pop() || "jpg";
    const prefix = uploadType === "avatar" ? "avatar" : "cover";
    const filename = `${prefix}-${user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Return the public URL
    const url = `/uploads/${filename}`;

    // If avatar upload, also update the profile record
    if (uploadType === "avatar") {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      try {
        await prisma.profile.update({
          where: { id: user.id },
          data: { avatarUrl: url },
        });
      } catch (dbError) {
        // Profile might not exist yet — that's ok, the URL is still returned
        console.warn("Could not update profile avatarUrl:", dbError);
      } finally {
        await prisma.$disconnect();
      }
    }

    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
