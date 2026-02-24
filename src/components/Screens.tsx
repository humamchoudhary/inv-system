"use client";

import { useRef, useEffect } from "react";
import {
  Plus,
  FileText,
  Check,
  X,
  Loader2,
  AlertCircle,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { type saleSheetType } from "@/db/schema/sale-sheet";
import {
  Ambient,
  Style,
  Divider,
  SheetPill,
  MicIcon,
  Waveform,
  PageHeader,
} from "./ui";
import { formatDuration } from "./useRecorder";
import type { SaleItem } from "./types";

// ════════════════════════════════════════════════════════════════════════════
// Sheet Create
// ════════════════════════════════════════════════════════════════════════════
interface SheetCreateScreenProps {
  businessName: string;
  hasSheets: boolean;
  newSheetName: string;
  newSheetError: string;
  isCreatingSheet: boolean;
  onNameChange: (v: string) => void;
  onCreate: () => void;
  onBack: () => void;
}

export function SheetCreateScreen({
  businessName,
  hasSheets,
  newSheetName,
  newSheetError,
  isCreatingSheet,
  onNameChange,
  onCreate,
  onBack,
}: SheetCreateScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />
      <PageHeader businessName={businessName} canGoBack />
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
                ref={inputRef}
                type="text"
                placeholder="e.g. Morning Sales, Week 1…"
                value={newSheetName}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCreate()}
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
              onClick={onCreate}
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
              onClick={onBack}
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
// Sheet Select
// ════════════════════════════════════════════════════════════════════════════
interface SheetSelectScreenProps {
  businessName: string;
  sheets: saleSheetType[];
  selectedSheet: saleSheetType | null;
  onSelect: (sheet: saleSheetType) => void;
  onNewSheet: () => void;
  onStart: () => void;
}

export function SheetSelectScreen({
  businessName,
  sheets,
  selectedSheet,
  onSelect,
  onNewSheet,
  onStart,
}: SheetSelectScreenProps) {
  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />
      <PageHeader businessName={businessName} canGoBack />
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
                  onClick={() => onSelect(sheet)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-150 ${
                    isSelected
                      ? "border-[#171717] bg-[#] shadow-sm"
                      : "border-[#f0f0f0] bg-white hover:border-[#1e1e1e]"
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
                        {new Date(sheet.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
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
            onClick={onNewSheet}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-dashed border-[#f0f0f0] hover:border-[#171717]/40 transition-all duration-150 group"
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
            onClick={onStart}
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
// Recording
// ════════════════════════════════════════════════════════════════════════════
interface RecordingScreenProps {
  businessName: string;
  selectedSheet: saleSheetType | null;
  isRecording: boolean;
  duration: number;
  onStop: () => void;
  onCancel: () => void;
}

export function RecordingScreen({
  businessName,
  selectedSheet,
  isRecording,
  duration,
  onStop,
  onCancel,
}: RecordingScreenProps) {
  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />
      <PageHeader businessName={businessName} canGoBack={false} />
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
            onClick={onStop}
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
          onClick={onCancel}
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
// Processing
// ════════════════════════════════════════════════════════════════════════════
export function ProcessingScreen({
  selectedSheet,
}: {
  selectedSheet: saleSheetType | null;
}) {
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
// Error
// ════════════════════════════════════════════════════════════════════════════
interface ErrorScreenProps {
  businessName: string;
  processingError: string;
  selectedSheet: saleSheetType | null;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorScreen({
  businessName,
  processingError,
  selectedSheet,
  onRetry,
  onBack,
}: ErrorScreenProps) {
  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />
      <PageHeader businessName={businessName} canGoBack />
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
                onClick={onRetry}
                className="w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MicIcon size={16} />
                Try Again
              </button>
            )}
            <button
              onClick={onBack}
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
// Success
// ════════════════════════════════════════════════════════════════════════════
export function SuccessScreen({ onReRecord }: { onReRecord: () => void }) {
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
            onClick={onReRecord}
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
// Review
// ════════════════════════════════════════════════════════════════════════════
interface ReviewScreenProps {
  businessName: string;
  selectedSheet: saleSheetType | null;
  transcription: string;
  recordingDate: string;
  items: SaleItem[];
  editingId: string | null;
  isSaving: boolean;
  saveError: string;
  onDateChange: (iso: string) => void;
  onUpdateItem: (
    id: string,
    field: keyof Omit<SaleItem, "id">,
    value: string,
  ) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onSetEditing: (id: string | null) => void;
  onSave: () => void;
  onReRecord: () => void;
}

export function ReviewScreen({
  businessName,
  selectedSheet,
  transcription,
  recordingDate,
  items,
  editingId,
  isSaving,
  saveError,
  onDateChange,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onSetEditing,
  onSave,
  onReRecord,
}: ReviewScreenProps) {
  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />
      <PageHeader businessName={businessName} canGoBack />
      <Divider />

      <div className="relative z-10 flex flex-col flex-1 items-center px-6 pt-6 pb-10 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col gap-5">
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

          {/* Date */}
          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.03s ease both" }}
          >
            <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest">
              Sale Date
            </p>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#f0f0f0]/60 border border-[#f0f0f0]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-[#171717]/40"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path
                  d="M3 9h18M8 2v4M16 2v4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="date"
                value={recordingDate ? recordingDate.slice(0, 10) : ""}
                onChange={(e) =>
                  onDateChange(new Date(e.target.value).toISOString())
                }
                className="flex-1 bg-transparent text-sm text-[#171717] outline-none"
              />
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
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-[#f0f0f0]/40 border-b border-[#f0f0f0]">
                <p className="text-[10px] font-medium text-[#171717]/40 uppercase tracking-wider">
                  Item
                </p>
                <p className="text-[10px] font-medium text-[#171717]/40 uppercase tracking-wider text-right w-20">
                  Price
                </p>
                <div className="w-6" />
              </div>

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
                            onUpdateItem(item.id, "name", e.target.value)
                          }
                          className="text-sm text-[#171717] bg-white border border-[#171717] rounded-lg px-2.5 py-1.5 outline-none w-full"
                          placeholder="Item name"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            onUpdateItem(item.id, "price", e.target.value)
                          }
                          onBlur={() => onSetEditing(null)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && onSetEditing(null)
                          }
                          className="text-sm text-[#171717] bg-white border border-[#171717] rounded-lg px-2.5 py-1.5 outline-none text-right w-20"
                          placeholder="0"
                        />
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onSetEditing(item.id)}
                          className="text-sm text-[#171717] text-left truncate"
                        >
                          {item.name || (
                            <span className="text-[#171717]/30 italic">
                              Unnamed
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => onSetEditing(item.id)}
                          className="text-sm text-[#171717] text-right w-20 tabular-nums"
                        >
                          {item.price.toLocaleString()}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[#171717]/20 hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={onAddItem}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-[#171717]/40 hover:text-[#171717] transition-colors duration-150 border-t border-[#f0f0f0]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add item
              </button>
            </div>

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

          {saveError && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed">{saveError}</p>
            </div>
          )}

          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.2s ease both" }}
          >
            <button
              onClick={onSave}
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
              onClick={onReRecord}
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
