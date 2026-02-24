// app/api/process-recording/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/* ─────────────────────────────────────────────
   1. Zod schema (single source of truth)
───────────────────────────────────────────── */

const outputSchema = z.object({
  transcription: z
    .string()
    .describe("Transcription of the audio without sound effects"),
  date: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Date mentioned in the audio (ISO 8601 format), or null if not mentioned",
    ),
  data: z
    .array(
      z.object({
        name: z.string().describe("Name of sale/item"),
        price: z.number().describe("Price/Cost of sale/item (numeric)"),
      }),
    )
    .describe("Data extracted from the transcription"),
});

// ⬇️ TypeScript type inferred from Zod
type OutputSchema = z.infer<typeof outputSchema>;

/* ─────────────────────────────────────────────
   2. Gemini client (typed + safe)
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   3. API handler
───────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const ai = new GoogleGenAI({});
  try {
    const formData = await req.formData();

    const audio = formData.get("audio");
    const sheetId = formData.get("sheet_id");
    const businessId = formData.get("business_id");

    // ── Type guards ───────────────────────────
    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          error: true,
          message: "No audio file received.",
          transcription: "",
          data: [],
        },
        { status: 400 },
      );
    }

    if (typeof sheetId !== "string" || typeof businessId !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid sheet_id or business_id.",
          transcription: "",
          data: [],
        },
        { status: 400 },
      );
    }

    // ── Audio processing ──────────────────────
    const buffer = Buffer.from(await audio.arrayBuffer());
    const base64Audio = buffer.toString("base64");
    const mimeType = audio.type || "audio/webm";

    const savePath = path.join("/tmp", "recording.webm");
    await writeFile(savePath, buffer);

    console.log("[process-recording]", {
      sheetId,
      businessId,
      size: buffer.byteLength,
      mimeType,
    });

    // ── Gemini call (JSON-schema enforced) ────
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Transcribe the audio and extract sold items with prices. If there are any calculations needed do those too.
If the speaker mentions a specific date (e.g. "yesterday", "last Monday", "3rd of this month"), resolve it to an ISO 8601 date string (YYYY-MM-DD). Otherwise set date to null. 
also if the user lists multiple items then give list of prices make it so the prices are mapped respectively, 
also if user doesnt give any price return price as 0, and in case user doesnt give a item but tells a price then name it as unnamed
Return strictly valid JSON matching the provided schema.
`,
            },
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(outputSchema),
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned no text");
    }

    // ── Runtime validation + typed result ─────
    const parsed: OutputSchema = outputSchema.parse(JSON.parse(response.text));

    const resolvedDate = parsed.date
      ? new Date(parsed.date).toISOString()
      : new Date().toISOString();

    return NextResponse.json({
      error: false,
      message: "",
      transcription: parsed.transcription,
      date: resolvedDate,
      data: parsed.data,
    });
  } catch (err) {
    console.error("[process-recording]", err);

    return NextResponse.json(
      {
        error: true,
        message: "Server error while processing recording.",
        transcription: "",
        data: [],
      },
      { status: 500 },
    );
  }
}
