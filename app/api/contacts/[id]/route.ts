// src/app/api/contacts/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// PATCH /api/contacts/:id — update kakuyaku (and optionally name/area)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, area, kakuyaku } = body;

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;
    if (area !== undefined) data.area = area;
    if (kakuyaku !== undefined) {
      if (kakuyaku !== "未確約" && kakuyaku !== "確約") {
        return NextResponse.json(
          { error: 'kakuyaku must be "未確約" or "確約"' },
          { status: 400 }
        );
      }
      data.kakuyaku = kakuyaku;
    }

    const updated = await prisma.contact.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/contacts/:id error:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/:id — delete a contact
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/contacts/:id error:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
