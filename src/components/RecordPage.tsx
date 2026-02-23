"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Plus,
  FileText,
  Check,
  X,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type business from "@/db/schema/business";
import { type saleSheetType } from "@/db/schema/sale-sheet";
import createSheetAction from "@/app/actions/createSheet";

// ── Types ──────────────────────────────────────────────────────────────────────
type Business = InferSelectModel<typeof business>;

type PageState =
  | "sheet-select" // existing sheets — pick one
  | "sheet-create" // no sheets or user wants new
  | "recording" // mic live
  | "processing" // audio sent, awaiting API
  | "review" // API returned — show transcription + editable table
  | "success" // saved
  | "error"; // API or mic error

interface SaleItem {
  id: string; // local only — for keying rows
  name: string;
  price: number;
}

interface ApiResponse {
  data: { name: string; price: number }[];
  transcription: string;
  error: boolean;
  message?: string;
}

interface RecordPageProps {
  activeBusiness?: Business;
  sheets?: saleSheetType[];
  // You wire this — receives { items, transcription, sheetId } and saves to DB
  onSave?: (payload: {
    items: SaleItem[];
    transcription: string;
    sheetId: string;
  }) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function MicIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
      <path
        d="M5 10a7 7 0 0014 0"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="17"
        x2="12"
        y2="21"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="21"
        x2="15"
        y2="21"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#1e1e1e] opacity-[0.15] blur-[130px]" />
      <div className="absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-[#171717] opacity-[0.08] blur-[100px]" />
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = [
    3, 6, 9, 12, 8, 14, 10, 6, 11, 8, 13, 7, 10, 5, 9, 12, 7, 10, 6, 8,
  ];
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${active ? "bg-[#171717]" : "bg-[#f0f0f0]"}`}
          style={{
            width: "3px",
            height: active ? `${h * 2.2}px` : "4px",
            animation: active
              ? `barPulse ${0.6 + (i % 5) * 0.12}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}

function SheetPill({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0f0f0]/70 border border-[#f0f0f0]">
      <FileText className="w-3 h-3 text-[#171717]/40" />
      <span className="text-xs text-[#171717]/50 font-medium">{name}</span>
    </div>
  );
}

function Style() {
  return (
    <style>{`
      @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes barPulse { from{transform:scaleY(0.4)} to{transform:scaleY(1)} }
      @keyframes spin     { to{transform:rotate(360deg)} }
      @keyframes drawCheck { from{stroke-dashoffset:28} to{stroke-dashoffset:0} }
    `}</style>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function RecordPage({
  activeBusiness,
  sheets = [],
  onSave,
}: RecordPageProps) {
  const businessName = activeBusiness?.name ?? "My Shop";
  const hasSheets = sheets.length > 0;

  // ── Page state ──
  const [pageState, setPageState] = useState<PageState>(
    hasSheets ? "sheet-select" : "sheet-create",
  );

  // ── Sheet ──
  const [selectedSheet, setSelectedSheet] = useState<saleSheetType | null>(
    null,
  );
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetError, setNewSheetError] = useState("");
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const sheetNameRef = useRef<HTMLInputElement>(null);

  // ── Recording ──
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ── Review ──
  const [transcription, setTranscription] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Auto-focus sheet input ──
  useEffect(() => {
    if (pageState === "sheet-create")
      setTimeout(() => sheetNameRef.current?.focus(), 50);
  }, [pageState]);

  // ── Timer ──
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // ── Sheet creation ──
  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) {
      setNewSheetError("Sheet name is required.");
      return;
    }
    if (!activeBusiness?.id) return;
    setIsCreatingSheet(true);
    try {
      const sheet = await createSheetAction({
        name: newSheetName.trim(),
        business_id: activeBusiness.id,
      });
      setSelectedSheet(sheet);
      startMic(sheet);
    } catch {
      setNewSheetError("Failed to create sheet. Please try again.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // ── Mic start (shared) ──
  // Replace the MediaRecorder instantiation inside startMic:
  const startMic = async (sheet: saleSheetType) => {
    setDuration(0);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // ✅ Pick the best supported MIME type (iOS needs mp4, others prefer webm)
      const mimeType =
        [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/ogg;codecs=opus",
          "", // fallback: let the browser decide
        ].find((type) => type === "" || MediaRecorder.isTypeSupported(type)) ??
        "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        processAudio(sheet, recorder.mimeType); // ✅ pass actual mimeType
      };

      recorder.start(250);
      setIsRecording(true);
      setPageState("recording");
    } catch {
      setProcessingError(
        "Microphone access denied. Please allow mic permissions and try again.",
      );
      setPageState("error");
    }
  };

  // ── Stop recording → trigger processing ──
  const handleStopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    setPageState("processing");
  };

  // ── Send audio to API ──
  const processAudio = async (sheet: saleSheetType, mimeType: string) => {
    const isMP4 = mimeType.includes("mp4");
    const extension = isMP4 ? "m4a" : "webm";

    const blob = new Blob(audioChunksRef.current, { type: mimeType });
    const formData = new FormData();
    formData.append("audio", blob, `recording.${extension}`); // ✅ correct extension
    formData.append("sheet_id", sheet.id);
    formData.append("business_id", activeBusiness?.id ?? "");

    try {
      const res = await fetch("/api/process-recording", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setProcessingError(`Server error: ${res.status}. Please try again.`);
        setPageState("error");
        return;
      }

      const json: ApiResponse = await res.json();

      if (json.error) {
        setProcessingError(
          json.message ?? "Processing failed. Please try again.",
        );
        setPageState("error");
        return;
      }

      // Map API data → local items with stable ids
      setTranscription(json.transcription);
      setItems(
        json.data.map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          price: d.price,
        })),
      );
      setPageState("review");
    } catch {
      setProcessingError("Network error. Check your connection and try again.");
      setPageState("error");
    }
  };

  // ── Item editing ──
  const updateItem = (
    id: string,
    field: keyof Omit<SaleItem, "id">,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "price" ? parseFloat(value) || 0 : value,
            }
          : item,
      ),
    );
  };

  const deleteItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () => {
    const newItem: SaleItem = { id: crypto.randomUUID(), name: "", price: 0 };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
  };

  // ── Save ──
  const handleSave = async () => {
    if (!selectedSheet || !onSave) return;
    setSaveError("");
    setIsSaving(true);
    try {
      await onSave({ items, transcription, sheetId: selectedSheet.id });
      setPageState("success");
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Cancel / re-record ──
  const handleCancel = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setDuration(0);
    setItems([]);
    setTranscription("");
    setProcessingError("");
    setSaveError("");
    setPageState(hasSheets ? "sheet-select" : "sheet-create");
  };

  const handleReRecord = () => {
    if (!selectedSheet) return;
    setItems([]);
    setTranscription("");
    setDuration(0);
    audioChunksRef.current = [];
    startMic(selectedSheet);
  };

  // ── Shared header ──
  const canGoBack = pageState !== "recording" && pageState !== "processing";
  const Header = () => (
    <header
      className="relative z-10 flex items-center justify-between px-6 pt-12 pb-5"
      style={{ animation: "fadeDown 0.4s ease both" }}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-medium text-[#171717]/30 uppercase tracking-widest">
          Recording for
        </p>
        <h1 className="text-[17px] font-semibold tracking-tight text-[#171717]">
          {businessName}
        </h1>
      </div>
      {canGoBack && (
        <a
          href="/"
          className="flex items-center gap-1 text-xs text-[#171717]/40 hover:text-[#171717] transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back
        </a>
      )}
    </header>
  );

  const Divider = () => (
    <div
      className="relative z-10 mx-6 h-px bg-[#f0f0f0]"
      style={{ animation: "fadeIn 0.4s 0.05s ease both" }}
    />
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET CREATE
  // ════════════════════════════════════════════════════════════════════════════
  if (pageState === "sheet-create") {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <Ambient />
        <Header />
        <Divider />
        <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 py-10 gap-6">
          <div
            className="w-full max-w-sm"
            style={{ animation: "fadeUp 0.45s 0.1s ease both" }}
          >
            <div className="flex flex-col gap-1 mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-[#171717]">
                {hasSheets ? "New Sheet" : "Create a sheet first"}
              </h2>
              <p className="text-sm text-[#171717]/40">
                {hasSheets
                  ? "Give this recording session a name."
                  : "Sheets organise your sales recordings."}
              </p>
            </div>

            <div className="bg-white border border-[#f0f0f0] rounded-3xl p-6 shadow-xl shadow-black/[0.04]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#171717]/50 uppercase tracking-wider">
                  Sheet name
                </label>
                <input
                  ref={sheetNameRef}
                  type="text"
                  placeholder="e.g. Morning Sales, Week 1…"
                  value={newSheetName}
                  onChange={(e) => {
                    setNewSheetName(e.target.value);
                    setNewSheetError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSheet()}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-[#171717] placeholder:text-[#171717]/25 bg-[#f0f0f0]/50 outline-none transition-all duration-200 ${
                    newSheetError
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-[#f0f0f0] focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/20"
                  }`}
                />
                {newSheetError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mt-0.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {newSheetError}
                  </p>
                )}
              </div>
              <button
                onClick={handleCreateSheet}
                disabled={isCreatingSheet}
                className="mt-4 w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isCreatingSheet ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create &amp; Start Recording
                  </>
                )}
              </button>
            </div>

            {hasSheets && (
              <button
                onClick={() => setPageState("sheet-select")}
                className="mt-4 w-full text-center text-xs text-[#171717]/40 hover:text-[#171717] transition-colors"
              >
                ← Back to existing sheets
              </button>
            )}
          </div>
        </div>
        <Style />
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET SELECT
  // ════════════════════════════════════════════════════════════════════════════
  if (pageState === "sheet-select") {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <Ambient />
        <Header />
        <Divider />
        <div className="relative z-10 flex flex-col flex-1 items-center px-6 pt-8 pb-10 gap-6 overflow-y-auto">
          <div className="w-full max-w-sm flex flex-col gap-5">
            <div style={{ animation: "fadeUp 0.45s 0.1s ease both" }}>
              <h2 className="text-xl font-semibold tracking-tight text-[#171717]">
                Select a sheet
              </h2>
              <p className="text-sm text-[#171717]/40 mt-1">
                Choose where to record this sale.
              </p>
            </div>

            <div
              className="flex flex-col gap-2"
              style={{ animation: "fadeUp 0.45s 0.15s ease both" }}
            >
              {sheets.map((sheet) => {
                const isSelected = selectedSheet?.id === sheet.id;
                return (
                  <button
                    key={sheet.id}
                    onClick={() => setSelectedSheet(isSelected ? null : sheet)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-150 ${
                      isSelected
                        ? "border-[#171717] bg-[#] shadow-sm"
                        : "border-[#f0f0f0] bg-white hover:border-[#1e1e1e] hover:bg-[#]/50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${isSelected ? "bg-[#171717]" : "bg-[#f0f0f0]"}`}
                    >
                      <FileText
                        className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#171717]/40"}`}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171717] truncate">
                        {sheet.name}
                      </p>
                      {sheet.createdAt && (
                        <p className="text-xs text-[#171717]/30">
                          {new Date(sheet.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#171717] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setNewSheetName("");
                setPageState("sheet-create");
              }}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-dashed border-[#f0f0f0] hover:border-[#171717]/40 hover:bg-[#]/50 transition-all duration-150 group"
              style={{ animation: "fadeUp 0.45s 0.2s ease both" }}
            >
              <div className="w-9 h-9 rounded-xl bg-[#f0f0f0] group-hover:bg-[#1e1e1e]/30 flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                <Plus className="w-4 h-4 text-[#171717]/40 group-hover:text-[#171717] transition-colors duration-150" />
              </div>
              <span className="text-sm font-medium text-[#171717]/50 group-hover:text-[#171717] transition-colors duration-150">
                New sheet
              </span>
            </button>

            <button
              onClick={() => selectedSheet && startMic(selectedSheet)}
              disabled={!selectedSheet}
              className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
              style={{ animation: "fadeUp 0.45s 0.25s ease both" }}
            >
              {selectedSheet ? (
                <>
                  <MicIcon size={16} />
                  Start Recording
                </>
              ) : (
                "Select a sheet to continue"
              )}
            </button>
          </div>
        </div>
        <Style />
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RECORDING
  // ════════════════════════════════════════════════════════════════════════════
  if (pageState === "recording") {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <Ambient />
        <Header />
        <Divider />
        {selectedSheet && (
          <div
            className="relative z-10 flex justify-center mt-5"
            style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
          >
            <SheetPill name={selectedSheet.name} />
          </div>
        )}
        <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 py-8 gap-8">
          <div style={{ animation: "fadeIn 0.4s 0.1s ease both" }}>
            <Waveform active={isRecording} />
          </div>
          <div
            className="relative flex items-center justify-center"
            style={{ animation: "fadeUp 0.45s 0.15s ease both" }}
          >
            <span
              className="absolute w-36 h-36 rounded-full bg-[#171717]/10 animate-ping"
              style={{ animationDuration: "1.6s" }}
            />
            <span
              className="absolute w-28 h-28 rounded-full bg-[#171717]/10 animate-ping"
              style={{ animationDuration: "1.6s", animationDelay: "0.3s" }}
            />
            <button
              onClick={handleStopRecording}
              className="relative w-24 h-24 rounded-full bg-[#171717] shadow-2xl shadow-[#171717]/40 hover:shadow-[#171717]/60 flex items-center justify-center transition-all duration-300 active:scale-95"
            >
              <div className="w-8 h-8 rounded-md bg-white" />
            </button>
          </div>
          <div
            className="flex flex-col items-center gap-1.5"
            style={{ animation: "fadeUp 0.45s 0.2s ease both" }}
          >
            <p className="text-3xl font-semibold tracking-tight text-[#171717] tabular-nums">
              {formatDuration(duration)}
            </p>
            <p className="text-sm font-medium text-[#171717]">
              Tap to stop recording
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-[#171717]/30 hover:text-[#171717]/60 transition-colors px-4 py-2"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
        <Style />
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PROCESSING
  // ════════════════════════════════════════════════════════════════════════════
  if (pageState === "processing") {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <Ambient />
        {selectedSheet && (
          <div
            className="relative z-10 flex justify-center pt-16"
            style={{ animation: "fadeIn 0.4s ease both" }}
          >
            <SheetPill name={selectedSheet.name} />
          </div>
        )}
        <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 gap-6">
          {/* Animated processing dots */}
          <div
            className="flex items-center gap-2"
            style={{ animation: "fadeIn 0.4s 0.1s ease both" }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-[#171717]"
                style={{
                  animation: `barPulse 0.8s ${i * 0.15}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
          <div
            className="text-center"
            style={{ animation: "fadeUp 0.4s 0.2s ease both" }}
          >
            <h2 className="text-xl font-semibold tracking-tight text-[#171717]">
              Processing your recording
            </h2>
            <p className="text-sm text-[#171717]/40 mt-1">
              Identifying items and amounts…
            </p>
          </div>
        </div>
        <Style />
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ERROR
  // ════════════════════════════════════════════════════════════════════════════
  if (pageState === "error") {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <Ambient />
        <Header />
        <Divider />
        <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 gap-6">
          <div
            className="w-full max-w-sm flex flex-col items-center gap-5"
            style={{ animation: "fadeUp 0.4s ease both" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#171717]">
                Something went wrong
              </h2>
              <p className="text-sm text-[#171717]/50 mt-1.5 leading-relaxed">
                {processingError}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {selectedSheet && (
                <button
                  onClick={handleReRecord}
                  className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MicIcon size={16} />
                  Try Again
                </button>
              )}
              <button
                onClick={handleCancel}
                className="w-full py-3 rounded-xl border border-[#f0f0f0] text-sm text-[#171717]/60 hover:bg-[#f0f0f0]/50 transition-all duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
        <Style />
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUCCESS
  // ════════════════════════════════════════════════════════════════════════════
  if (pageState === "success") {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)] overflow-hidden px-6">
        <Ambient />
        <div className="relative z-10 flex flex-col items-center text-center gap-6 w-full max-w-sm">
          <div style={{ animation: "fadeUp 0.4s ease both" }}>
            <div className="relative w-16 h-16 rounded-full bg-[#171717] shadow-xl shadow-[#171717]/40 flex items-center justify-center mx-auto">
              <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
                <path
                  d="M10 20.5l7 7 13-14"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="28"
                  strokeDashoffset="0"
                  style={{ animation: "drawCheck 0.4s 0.15s ease both" }}
                />
              </svg>
            </div>
          </div>
          <div style={{ animation: "fadeUp 0.4s 0.15s ease both" }}>
            <p className="text-xs font-medium text-[#171717] uppercase tracking-widest mb-1">
              Saved
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[#171717]">
              Sale recorded successfully
            </h2>
          </div>
          <div
            className="flex flex-col gap-2 w-full"
            style={{ animation: "fadeUp 0.4s 0.25s ease both" }}
          >
            <button
              onClick={handleReRecord}
              className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MicIcon size={16} />
              Record another sale
            </button>
            <a
              href="/"
              className="w-full py-3 rounded-xl border border-[#f0f0f0] text-sm text-[#171717]/60 hover:bg-[#f0f0f0]/50 transition-all duration-200 flex items-center justify-center"
            >
              Go to Home
            </a>
          </div>
        </div>
        <Style />
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REVIEW — transcription + editable table
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />
      <Header />
      <Divider />

      <div className="relative z-10 flex flex-col flex-1 items-center px-6 pt-6 pb-10 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col gap-5">
          {/* Sheet pill */}
          {selectedSheet && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>
              <SheetPill name={selectedSheet.name} />
            </div>
          )}

          {/* Transcription */}
          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
          >
            <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest">
              What you said
            </p>
            <div className="px-4 py-3.5 rounded-2xl bg-[#f0f0f0]/60 border border-[#f0f0f0]">
              <p className="text-sm text-[#171717]/70 leading-relaxed italic">
                "{transcription}"
              </p>
            </div>
          </div>

          {/* Items table */}
          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.1s ease both" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest">
                Items
              </p>
              <p className="text-[10px] text-[#171717]/30">Tap to edit</p>
            </div>

            <div className="bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-[#f0f0f0]/40 border-b border-[#f0f0f0]">
                <p className="text-[10px] font-medium text-[#171717]/40 uppercase tracking-wider">
                  Item
                </p>
                <p className="text-[10px] font-medium text-[#171717]/40 uppercase tracking-wider text-right w-20">
                  Price
                </p>
                <div className="w-6" />
              </div>

              {/* Item rows */}
              {items.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-[#171717]/30">
                  No items parsed
                </div>
              )}
              {items.map((item, idx) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 ${idx < items.length - 1 ? "border-b border-[#f0f0f0]" : ""} ${isEditing ? "bg-[#]" : "hover:bg-[#f0f0f0]/30"} transition-colors duration-100`}
                  >
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.id, "name", e.target.value)
                          }
                          className="text-sm text-[#171717] bg-white border border-[#171717] rounded-lg px-2.5 py-1.5 outline-none w-full"
                          placeholder="Item name"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", e.target.value)
                          }
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setEditingId(null)
                          }
                          className="text-sm text-[#171717] bg-white border border-[#171717] rounded-lg px-2.5 py-1.5 outline-none text-right w-20"
                          placeholder="0"
                        />
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="text-sm text-[#171717] text-left truncate"
                        >
                          {item.name || (
                            <span className="text-[#171717]/30 italic">
                              Unnamed
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="text-sm text-[#171717] text-right w-20 tabular-nums"
                        >
                          {item.price.toLocaleString()}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[#171717]/20 hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add item row */}
              <button
                onClick={addItem}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-[#171717]/40 hover:text-[#171717] hover:bg-[#] transition-colors duration-150 border-t border-[#f0f0f0]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add item
              </button>
            </div>

            {/* Total */}
            {items.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f0f0f0]/50">
                <p className="text-xs font-medium text-[#171717]/50 uppercase tracking-wider">
                  Total
                </p>
                <p className="text-sm font-bold text-[#171717] tabular-nums">
                  {items.reduce((sum, i) => sum + i.price, 0).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Save error */}
          {saveError && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed">{saveError}</p>
            </div>
          )}

          {/* Actions */}
          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.2s ease both" }}
          >
            <button
              onClick={handleSave}
              disabled={isSaving || items.length === 0}
              className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Sale
                </>
              )}
            </button>
            <button
              onClick={handleReRecord}
              className="w-full py-3 rounded-xl border border-[#f0f0f0] text-sm text-[#171717]/50 hover:bg-[#f0f0f0]/50 transition-all duration-200"
            >
              Re-record
            </button>
          </div>
        </div>
      </div>
      <Style />
    </main>
  );
}
