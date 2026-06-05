import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type Contact = {
  name: string;
  area: string;
  kakuyaku: string;
};

const normalizeName = (value: string) =>
  value
    .trim()
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .normalize("NFC");

export async function POST(request: Request) {
  try {
    const contacts: Contact[] = await request.json();
    const contactMap = new Map<string, string>();
    contacts.forEach((contact) => {
      contactMap.set(normalizeName(contact.name), contact.kakuyaku);
    });

    const filePath = path.join(process.cwd(), "20260319行事参加者確認一覧.xlsx");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Excel template file not found." },
        { status: 404 },
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellStyles: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: "Excel template contains no sheets." },
        { status: 500 },
      );
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return NextResponse.json(
        { error: `Sheet ${sheetName} not found.` },
        { status: 500 },
      );
    }

    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellRef];
        if (!cell || cell.t !== "s") continue;

        const normalized = normalizeName(String(cell.v));
        if (!contactMap.has(normalized)) continue;

        const targetRef = XLSX.utils.encode_cell({ r: row, c: col + 1 });
        const targetValue = contactMap.get(normalized);
        if (targetValue === "確約") {
          sheet[targetRef] = { t: "s", v: "〇" };
        } else {
          delete sheet[targetRef];
        }
      }
    }

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    try {
      fs.writeFileSync(filePath, buffer);
    } catch (writeError) {
      console.error(
        "Export XLSX warning: could not overwrite original file, returning generated workbook.",
        writeError,
      );
    }

    const asciiFileName = "kakuyaku_export.xlsx";
    const utf8FileName = encodeURIComponent(
      "20260319行事参加者確認一覧.xlsx",
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${asciiFileName}"; filename*=UTF-8''${utf8FileName}`,
      },
    });
  } catch (error) {
    console.error("Export XLSX error:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    return NextResponse.json(
      { error: "Failed to export Excel file." },
      { status: 500 },
    );
  }
}
