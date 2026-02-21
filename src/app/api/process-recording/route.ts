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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/* ─────────────────────────────────────────────
   3. API handler
───────────────────────────────────────────── */

export async function POST(req: NextRequest) {
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
Transcribe the audio and extract sold items with prices. if there are any calculations needed do those too,
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

    return NextResponse.json({
      error: false,
      message: "",
      ...parsed,
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
