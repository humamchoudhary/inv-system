import { FileText, ChevronLeft } from "lucide-react";

// ── Ambient background blobs ──────────────────────────────────────────────────
export function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#1e1e1e] opacity-[0.15] blur-[130px]" />
      <div className="absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-[#171717] opacity-[0.08] blur-[100px]" />
    </div>
  );
}

// ── Keyframe injection ────────────────────────────────────────────────────────
export function Style() {
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

// ── Horizontal rule ───────────────────────────────────────────────────────────
export function Divider() {
  return (
    <div
      className="relative z-10 mx-6 h-px bg-[#f0f0f0]"
      style={{ animation: "fadeIn 0.4s 0.05s ease both" }}
    />
  );
}

// ── Sheet name badge ──────────────────────────────────────────────────────────
export function SheetPill({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0f0f0]/70 border border-[#f0f0f0]">
      <FileText className="w-3 h-3 text-[#171717]/40" />
      <span className="text-xs text-[#171717]/50 font-medium">{name}</span>
    </div>
  );
}

// ── Mic SVG icon ──────────────────────────────────────────────────────────────
export function MicIcon({ size = 28 }: { size?: number }) {
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

// ── Animated waveform bars ────────────────────────────────────────────────────
const BARS = [
  3, 6, 9, 12, 8, 14, 10, 6, 11, 8, 13, 7, 10, 5, 9, 12, 7, 10, 6, 8,
];

export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {BARS.map((h, i) => (
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

// ── Page header ───────────────────────────────────────────────────────────────
// NOTE: Defined here (outside RecordPage) so React never sees it as a new
// component identity between renders, which would cause unmount/remount flicker.
interface PageHeaderProps {
  businessName: string;
  canGoBack: boolean;
}

export function PageHeader({ businessName, canGoBack }: PageHeaderProps) {
  return (
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
}
