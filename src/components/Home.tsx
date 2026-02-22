"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCog,
  User,
  ChevronDown,
  X,
  Check,
  BarChart2,
  ShoppingBag,
} from "lucide-react";
import { type Business } from "@/db/schema/business";
import swtichBusinessAction from "@/app/actions/switchBusiness";

// ── Types ──────────────────────────────────────────────────────────────────────
// Business type comes directly from the schema — no redefinition needed.

interface SnapshotData {
  totalSales: number;
  itemsSold: number;
}

interface HomePageProps {
  // Matches what dashboard/page.tsx already passes
  businessName: string;
  businesses: Business[];
  // Derived from the active business object for currency formatting
  currencyCode?: string;
  // Active business id — used to highlight current in switcher
  activeBusinessId?: string;
  // If omitted, defaults to empty state (no sales yet)
  hasSales?: boolean;
  snapshot?: SnapshotData;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
}

// ── Business Switcher Overlay (P14) ───────────────────────────────────────────
function BusinessSwitcher({
  businesses,
  activeBusinessId,
  onClose,
  onSwitch,
}: {
  businesses: Business[];
  activeBusinessId: string;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#171717]/40 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease both" }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl border-t border-[#f0f0f0] shadow-2xl max-w-sm mx-auto"
        style={{ animation: "slideUp 0.25s ease both" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#f0f0f0]" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <p className="text-sm font-semibold text-[#171717] tracking-tight">
            Switch Business
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#f0f0f0] flex items-center justify-center hover:bg-[#ffb3d9]/40 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-[#171717]/60" />
          </button>
        </div>
        <div className="px-4 py-3 flex flex-col gap-1">
          {businesses.map((b) => {
            const isActive = b.id === activeBusinessId;
            return (
              <button
                key={b.id}
                onClick={() => onSwitch(b.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-150 ${
                  isActive
                    ? "bg-[#ff79c6]/10 border border-[#ff79c6]/20"
                    : "hover:bg-[#f0f0f0]/70 border border-transparent"
                }`}
              >
                <span
                  className={`text-sm font-medium ${isActive ? "text-[#171717]" : "text-[#171717]/60"}`}
                >
                  {b.name}
                </span>
                {isActive && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#ff79c6] font-medium uppercase tracking-wider">
                      Active
                    </span>
                    <Check className="w-3.5 h-3.5 text-[#ff79c6]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-[#f0f0f0]">
          <a
            href="/profile"
            className="text-xs text-[#ff79c6] font-medium hover:underline"
          >
            Manage Businesses →
          </a>
        </div>
        <div className="pb-6" />
      </div>
    </>
  );
}

// ── Ambient background ────────────────────────────────────────────────────────
function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      <div className="absolute top-[-10%] right-[-15%] w-[420px] h-[420px] rounded-full bg-[#ffb3d9] opacity-[0.15] blur-[120px]" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#ff79c6] opacity-[0.08] blur-[100px]" />
    </div>
  );
}

// ── Record button — compact (active) or full (empty) ─────────────────────────
function RecordButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/record"
      className="group w-full max-w-sm block"
      style={{ animation: "fadeUp 0.5s 0.2s ease both" }}
    >
      <div
        className={`relative w-full rounded-3xl bg-[#171717] overflow-hidden cursor-pointer transition-transform duration-300 active:scale-[0.97] hover:scale-[1.01] ${
          compact ? "py-5" : "py-10"
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#ff79c6] opacity-20 blur-[60px]" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#ffb3d9] opacity-10 blur-[50px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div
          className={`relative z-10 flex items-center gap-5 px-7 ${compact ? "" : "flex-col text-center px-8"}`}
        >
          <div className="relative flex items-center justify-center flex-shrink-0">
            {!compact && (
              <>
                <span
                  className="absolute w-20 h-20 rounded-full border border-[#ff79c6]/20 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <span
                  className="absolute w-14 h-14 rounded-full border border-[#ff79c6]/30 animate-ping"
                  style={{ animationDuration: "2s", animationDelay: "0.3s" }}
                />
              </>
            )}
            <div
              className={`relative rounded-full bg-[#ff79c6] shadow-xl shadow-[#ff79c6]/50 flex items-center justify-center transition-shadow duration-300 group-hover:shadow-[#ff79c6]/70 ${compact ? "w-11 h-11" : "w-16 h-16"}`}
            >
              <svg
                width={compact ? "20" : "28"}
                height={compact ? "20" : "28"}
                viewBox="0 0 24 24"
                fill="none"
              >
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
            </div>
          </div>
          <div
            className={`flex flex-col ${compact ? "gap-0.5" : "gap-1.5 items-center"}`}
          >
            <p
              className={`font-semibold text-white tracking-tight leading-snug ${compact ? "text-[15px]" : "text-[22px]"}`}
            >
              {compact ? "Record today's sales" : "Record your first sale"}
            </p>
            {!compact && (
              <p className="text-sm text-white/40 leading-relaxed">
                Just speak naturally.
                <br />
                Review everything before saving.
              </p>
            )}
          </div>
          {compact ? (
            <div className="ml-auto">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-[#ff79c6] group-hover:translate-x-0.5 transition-transform duration-200"
              >
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#ff79c6] text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
              <span>Tap to start</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage({
  businessName,
  businesses,
  currencyCode = "USD",
  activeBusinessId,
  hasSales = false,
  snapshot = { totalSales: 0, itemsSold: 0 },
}: HomePageProps) {
  const router = useRouter();
  const today = getTodayLabel();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Switcher only makes sense with 2+ businesses
  const canSwitch = businesses.length > 1;

  // Resolve active id — fallback to first business if not provided
  const resolvedActiveId = activeBusinessId ?? businesses[0]?.id ?? "";

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-start justify-between px-6 pt-12 pb-5"
        style={{ animation: "fadeDown 0.45s ease both" }}
      >
        <div className="flex flex-col gap-1">
          {hasSales && canSwitch ? (
            <button
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1.5 group"
            >
              <div className="w-2 h-2 rounded-full bg-[#ff79c6]" />
              <span className="text-[17px] font-semibold tracking-tight text-[#171717] group-hover:text-[#ff79c6] transition-colors duration-150">
                {businessName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#171717]/40 group-hover:text-[#ff79c6] transition-colors duration-150 mt-0.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff79c6]" />
              <h1 className="text-[17px] font-semibold tracking-tight text-[#171717]">
                {businessName}
              </h1>
            </div>
          )}
          <p className="text-xs text-[#171717]/40 pl-4">{today}</p>
        </div>

        <a
          href="/profile"
          aria-label="Profile"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f0f0f0] hover:bg-[#ffb3d9]/40 transition-colors duration-200"
        >
          <User className="w-4 h-4 text-[#171717]/60" />
        </a>
      </header>

      {/* Divider */}
      <div
        className="relative z-10 mx-6 h-px bg-[#f0f0f0]"
        style={{ animation: "fadeIn 0.4s 0.1s ease both" }}
      />

      {/* ══ EMPTY STATE (P05) ════════════════════════════════════════════════ */}
      {!hasSales && (
        <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 py-10 gap-8">
          <RecordButton compact={false} />

          <div
            className="w-full max-w-sm"
            style={{ animation: "fadeUp 0.5s 0.35s ease both" }}
          >
            <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest mb-2.5 text-center">
              Example
            </p>
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-[#f0f0f0]/60 border border-[#f0f0f0]">
              <span className="text-[#ff79c6] text-lg leading-none font-serif mt-0.5 select-none">
                "
              </span>
              <p className="text-sm text-[#171717]/50 leading-relaxed italic">
                Sold 5 shirts at 1200 each and 2 caps at 500
              </p>
            </div>
          </div>

          <div style={{ animation: "fadeIn 0.5s 0.5s ease both" }}>
            <div className="flex items-center gap-1.5 opacity-20">
              <BrainCog className="w-3.5 h-3.5 text-[#171717]" />
              <span className="text-[11px] text-[#171717] font-medium tracking-wide">
                AI Inventory
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══ ACTIVE STATE (P10) ═══════════════════════════════════════════════ */}
      {hasSales && (
        <div className="relative z-10 flex flex-col flex-1 items-center px-6 pt-6 pb-10 gap-5">
          <RecordButton compact={true} />

          {/* Snapshot */}
          <div
            className="w-full max-w-sm"
            style={{ animation: "fadeUp 0.5s 0.3s ease both" }}
          >
            <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest mb-2.5">
              Today's Snapshot
            </p>
            <div className="w-full rounded-2xl border border-[#f0f0f0] bg-white overflow-hidden shadow-sm shadow-black/[0.03]">
              <div className="px-5 py-4 border-b border-[#f0f0f0]">
                <p className="text-2xl font-bold text-[#171717] tracking-tight">
                  {formatCurrency(snapshot.totalSales, currencyCode)}
                </p>
                <p className="text-xs text-[#171717]/40 mt-0.5">Total Sales</p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#f0f0f0]">
                <div className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-lg font-semibold text-[#171717]">
                    {snapshot.itemsSold}
                  </p>
                  <p className="text-xs text-[#171717]/40">Items Sold</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary nav */}
          <div
            className="w-full max-w-sm flex flex-col gap-2"
            style={{ animation: "fadeUp 0.5s 0.4s ease both" }}
          >
            <a
              href="/dashboard"
              className="group flex items-center justify-between px-5 py-4 rounded-2xl border border-[#f0f0f0] bg-white hover:border-[#ffb3d9] hover:bg-[#fff5fb] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f0f0f0] group-hover:bg-[#ffb3d9]/30 flex items-center justify-center transition-colors duration-200">
                  <BarChart2 className="w-4 h-4 text-[#171717]/50 group-hover:text-[#ff79c6] transition-colors duration-200" />
                </div>
                <span className="text-sm font-medium text-[#171717]">
                  View Dashboard
                </span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-[#171717]/20 group-hover:text-[#ff79c6] group-hover:translate-x-0.5 transition-all duration-200"
              >
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            <a
              href="/sales"
              className="group flex items-center justify-between px-5 py-4 rounded-2xl border border-[#f0f0f0] bg-white hover:border-[#ffb3d9] hover:bg-[#fff5fb] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f0f0f0] group-hover:bg-[#ffb3d9]/30 flex items-center justify-center transition-colors duration-200">
                  <ShoppingBag className="w-4 h-4 text-[#171717]/50 group-hover:text-[#ff79c6] transition-colors duration-200" />
                </div>
                <span className="text-sm font-medium text-[#171717]">
                  Sales &amp; Inventory
                </span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-[#171717]/20 group-hover:text-[#ff79c6] group-hover:translate-x-0.5 transition-all duration-200"
              >
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* ── Business Switcher Overlay ── */}
      {switcherOpen && (
        <BusinessSwitcher
          businesses={businesses}
          activeBusinessId={resolvedActiveId}
          onClose={() => setSwitcherOpen(false)}
          onSwitch={async (id) => {
            // TODO: persist new active business via server action, then reload
            if (await swtichBusinessAction(id)) {
              router.push(`/`);
            }
            setSwitcherOpen(false);
          }}
        />
      )}

      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </main>
  );
}
