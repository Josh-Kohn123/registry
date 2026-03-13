import { NextRequest, NextResponse } from "next/server";
import { addressUpdateSchema } from "@/lib/validators";
import {
  getAddressById,
  updateAddress,
  deleteAddress,
} from "@/lib/db";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ eventId: string; addressId: string }>;
  }
) {
  try {
    const { addressId } = await params;
    const body = await request.json();

    // Validate input
    const result = addressUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid update data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify address exists
    const address = await getAddressById(addressId);
    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Update address
    const updated = await updateAddress(addressId, result.data);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Failed to update address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ eventId: string; addressId: string }>;
  }
) {
  try {
    const { addressId } = await params;

    // Verify address exists
    const address = await getAddressById(addressId);
    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Delete address
    await deleteAddress(addressId);

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
