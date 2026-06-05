// src/app/api/contacts/route.ts

import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

// GET /api/contacts — fetch all contacts
export async function GET() {
  try {
    const contacts = await prisma.contact.findMany();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("GET /api/contacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST /api/contacts — create a new contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, area, kakuyaku } = body;

    if (!name || !area) {
      return NextResponse.json(
        { error: "name and area are required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        area,
        kakuyaku: kakuyaku ?? "未確約",
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacts error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
