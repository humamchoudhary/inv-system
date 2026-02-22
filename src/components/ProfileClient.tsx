"use client";

// src/app/(protected)/profile/ProfileClient.tsx
// Covers P13 (Profile & Businesses) + P14 (Business Switcher overlay)

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  LogOut,
  Building2,
  User,
  Lock,
  Mail,
  Pencil,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Repeat2,
} from "lucide-react";
import { signOut } from "next-auth/react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type BusinessSummary = {
  id: string;
  name: string;
  currency: string;
  isActive: boolean;
  createdAt: string | null;
};

export interface ProfileProps {
  userName: string;
  userEmail: string;
  userId: string;
  businesses: BusinessSummary[];
  activeBusinessId: string | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0">
      <div className="absolute top-[-10%] right-[-15%] w-[440px] h-[440px] rounded-full bg-[#ffb3d9] opacity-[0.11] blur-[130px]" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[340px] h-[340px] rounded-full bg-[#ff79c6] opacity-[0.07] blur-[110px]" />
    </div>
  );
}

// Avatar initials
function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dim = size === "lg" ? "w-16 h-16" : "w-8 h-8";
  const text = size === "lg" ? "text-xl" : "text-xs";
  return (
    <div
      className={`${dim} rounded-2xl bg-gradient-to-br from-[#ff79c6] to-[#ffb3d9] flex items-center justify-center shadow-lg shadow-[#ff79c6]/20 flex-shrink-0`}
    >
      <span className={`${text} font-bold text-white tracking-tight`}>
        {initials || <User className="w-5 h-5 text-white" />}
      </span>
    </div>
  );
}

// Section card wrapper
function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02] ${className}`}
    >
      {children}
    </div>
  );
}

// Section header row
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-5 py-3 bg-[#fafafa] border-b border-[#f0f0f0]">
      <p className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

// Inline toast
function Toast({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-red-50 text-red-600 border border-red-100"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
// Edit Business Modal
// ─────────────────────────────────────────────

const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "PKR",
  "INR",
  "AED",
  "SAR",
  "NGN",
  "KES",
  "GHS",
  "EGP",
  "ZAR",
  "MAD",
  "TZS",
  "UGX",
  "ETB",
  "XOF",
  "CAD",
  "AUD",
  "JPY",
];

function EditBusinessModal({
  business,
  onClose,
  onSaved,
}: {
  business: BusinessSummary;
  onClose: () => void;
  onSaved: (updated: { name: string; currency: string }) => void;
}) {
  const [name, setName] = useState(business.name);
  const [currency, setCurrency] = useState(business.currency);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/businesses/${business.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), currency }),
        });
        if (!res.ok) throw new Error("Failed to update");
        onSaved({ name: name.trim(), currency });
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-10"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#f0f0f0] rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#171717]">
            Edit Business
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#f0f0f0] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[#171717]/50" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest block mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#fafafa] text-sm text-[#171717] outline-none focus:border-[#ff79c6] focus:bg-white focus:ring-2 focus:ring-[#ff79c6]/15 transition-all"
              placeholder="e.g. My Shop"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest block mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#fafafa] text-sm text-[#171717] outline-none focus:border-[#ff79c6] focus:bg-white focus:ring-2 focus:ring-[#ff79c6]/15 transition-all appearance-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && <Toast type="error" message={error} />}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-[#ff79c6] hover:bg-[#ff79c6]/90 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-[#ff79c6]/25 transition-all duration-200 flex items-center justify-center gap-2 mt-1"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Change Password Modal
// ─────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const handleSave = () => {
    if (!current || !next || !confirm) {
      setStatus({ type: "error", msg: "All fields are required." });
      return;
    }
    if (next !== confirm) {
      setStatus({ type: "error", msg: "New passwords don't match." });
      return;
    }
    if (next.length < 8) {
      setStatus({
        type: "error",
        msg: "Password must be at least 8 characters.",
      });
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed");
        }
        setStatus({ type: "success", msg: "Password changed successfully." });
        setTimeout(onClose, 1500);
      } catch (e: any) {
        setStatus({ type: "error", msg: e.message || "Something went wrong." });
      }
    });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#fafafa] text-sm text-[#171717] outline-none focus:border-[#ff79c6] focus:bg-white focus:ring-2 focus:ring-[#ff79c6]/15 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-10"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div className="w-10 h-1 bg-[#f0f0f0] rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#171717]">
            Change Password
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#f0f0f0] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[#171717]/50" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest block mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value);
                setStatus(null);
              }}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest block mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={next}
              onChange={(e) => {
                setNext(e.target.value);
                setStatus(null);
              }}
              className={inputClass}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest block mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setStatus(null);
              }}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {status && <Toast type={status.type} message={status.msg} />}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-[#ff79c6] hover:bg-[#ff79c6]/90 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-[#ff79c6]/25 transition-all duration-200 flex items-center justify-center gap-2 mt-1"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Business Switcher Overlay (P14)
// ─────────────────────────────────────────────

function BusinessSwitcherOverlay({
  businesses,
  activeBusinessId,
  onSwitch,
  onClose,
}: {
  businesses: BusinessSummary[];
  activeBusinessId: string | null;
  onSwitch: (id: string) => void;
  onClose: () => void;
}) {
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitch = (id: string) => {
    if (id === activeBusinessId) {
      onClose();
      return;
    }
    setSwitching(id);
    onSwitch(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-t-3xl shadow-2xl pb-10"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div className="w-10 h-1 bg-[#f0f0f0] rounded-full mx-auto mt-4 mb-2" />
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <h2 className="text-base font-semibold text-[#171717]">
            Switch Business
          </h2>
          <p className="text-xs text-[#171717]/40 mt-0.5">
            {businesses.length}{" "}
            {businesses.length === 1 ? "business" : "businesses"} in your
            account
          </p>
        </div>

        <div className="py-2">
          {businesses.map((b) => {
            const isActive = b.id === activeBusinessId;
            const isLoading = switching === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSwitch(b.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 transition-colors duration-100 ${
                  isActive ? "bg-[#ff79c6]/5" : "hover:bg-[#fafafa]"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-[#ff79c6] shadow-md shadow-[#ff79c6]/30"
                      : "bg-[#f0f0f0]"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Building2
                      className={`w-4 h-4 ${isActive ? "text-white" : "text-[#171717]/40"}`}
                    />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isActive ? "text-[#ff79c6]" : "text-[#171717]"
                    }`}
                  >
                    {b.name}
                  </p>
                  <p className="text-[10px] text-[#171717]/35">{b.currency}</p>
                </div>
                {isActive && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#ff79c6]/10 border border-[#ff79c6]/20 shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#ff79c6]" />
                    <span className="text-[9px] font-bold text-[#ff79c6] uppercase tracking-wider">
                      Active
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#f0f0f0] px-5 pt-3">
          <a
            href="/profile"
            className="flex items-center gap-2 text-sm text-[#171717]/50 hover:text-[#ff79c6] transition-colors font-medium"
          >
            Manage Businesses
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sign Out Confirm
// ─────────────────────────────────────────────

function SignOutModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-10"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div className="w-10 h-1 bg-[#f0f0f0] rounded-full mx-auto mb-5" />
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-[#171717]">Sign out?</h2>
          <p className="text-sm text-[#171717]/40 mt-1">
            You'll need to sign in again to access your data.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#f0f0f0] text-sm font-semibold text-[#171717]/50 hover:bg-[#fafafa] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function ProfileClient({
  userName,
  userEmail,
  userId,
  businesses,
  activeBusinessId,
}: ProfileProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for optimistic business updates
  const [localBusinesses, setLocalBusinesses] =
    useState<BusinessSummary[]>(businesses);
  const [localActiveId, setLocalActiveId] = useState<string | null>(
    activeBusinessId,
  );

  // Modal states
  const [editingBusiness, setEditingBusiness] =
    useState<BusinessSummary | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Inline name editing
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const [nameStatus, setNameStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // ── Switch business ──
  const handleSwitchBusiness = (id: string) => {
    startTransition(async () => {
      try {
        await fetch("/api/user/switch-business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: id }),
        });
        setLocalActiveId(id);
        setLocalBusinesses((prev) =>
          prev.map((b) => ({ ...b, isActive: b.id === id })),
        );
        setShowSwitcher(false);
        router.refresh(); // revalidate server data
      } catch {
        // silent — active state still shows optimistically
      }
    });
  };

  // ── Save business edits ──
  const handleBusinessSaved = (
    businessId: string,
    updated: { name: string; currency: string },
  ) => {
    setLocalBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId
          ? { ...b, name: updated.name, currency: updated.currency }
          : b,
      ),
    );
    setEditingBusiness(null);
    router.refresh();
  };

  // ── Save display name ──
  const handleSaveName = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === userName) {
      setEditingName(false);
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) throw new Error();
        setNameStatus({ type: "success", msg: "Name updated." });
        setEditingName(false);
        setTimeout(() => setNameStatus(null), 2500);
        router.refresh();
      } catch {
        setNameStatus({ type: "error", msg: "Couldn't update name." });
      }
    });
  };

  // ── Sign out ──
  const handleSignOut = () => {
    startTransition(async () => {
      // await fetch("/api/auth/signout", { method: "POST" }).catch((e) => {
      //   console.log(e);
      // });
      signOut();
      router.push("/signin");
    });
  };

  const activeBusiness = localBusinesses.find((b) => b.id === localActiveId);

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-center justify-between px-5 pt-10 pb-4"
        style={{ animation: "fadeDown 0.4s ease both" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0f0f0] hover:bg-[#ffb3d9]/30 transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-[#171717]/60" />
          </a>
          <h1 className="text-[17px] font-semibold tracking-tight text-[#171717]">
            Profile
          </h1>
        </div>
        {isPending && (
          <Loader2 className="w-4 h-4 text-[#ff79c6] animate-spin" />
        )}
      </header>

      <div className="relative z-10 mx-5 h-px bg-[#f0f0f0]" />

      {/* ── Scrollable body ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pt-5 pb-24 flex flex-col gap-5">
        {/* ── User card ── */}
        <div
          className="flex items-center gap-4 p-5 bg-[#171717] rounded-3xl relative overflow-hidden"
          style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          {/* Pink glow */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#ff79c6] opacity-20 blur-[40px] pointer-events-none" />

          <div className="relative z-10">
            <Avatar name={draftName || userEmail} />
          </div>

          <div className="relative z-10 flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setDraftName(userName);
                      setEditingName(false);
                    }
                  }}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-xl bg-white/10 text-white border border-white/20 outline-none focus:border-[#ff79c6] focus:ring-1 focus:ring-[#ff79c6]/40 placeholder:text-white/30 transition-all"
                  placeholder="Your name"
                />
                <button
                  onClick={handleSaveName}
                  className="w-7 h-7 rounded-lg bg-[#ff79c6] flex items-center justify-center shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={() => {
                    setDraftName(userName);
                    setEditingName(false);
                  }}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="group flex items-center gap-1.5 min-w-0 text-left"
              >
                <p className="text-base font-semibold text-white truncate">
                  {draftName || "Add your name"}
                </p>
                <Pencil className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
            <p className="text-xs text-white/40 mt-0.5 truncate">{userEmail}</p>
            {nameStatus && (
              <p
                className={`text-[10px] mt-1 font-medium ${nameStatus.type === "success" ? "text-emerald-400" : "text-red-400"}`}
              >
                {nameStatus.msg}
              </p>
            )}
          </div>
        </div>

        {/* ── Businesses section ── */}
        <div style={{ animation: "fadeUp 0.4s 0.1s ease both" }}>
          <SectionCard>
            <SectionHeader label="Businesses" />

            {localBusinesses.map((b) => {
              const isActive = b.id === localActiveId;
              return (
                <div
                  key={b.id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-0 ${
                    isActive ? "bg-[#ff79c6]/[0.03]" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? "bg-[#ff79c6]/15" : "bg-[#f0f0f0]"
                    }`}
                  >
                    <Building2
                      className={`w-4 h-4 ${isActive ? "text-[#ff79c6]" : "text-[#171717]/35"}`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive ? "text-[#ff79c6]" : "text-[#171717]"
                      }`}
                    >
                      {b.name}
                    </p>
                    <p className="text-[10px] text-[#171717]/35">
                      {b.currency}
                    </p>
                  </div>

                  {/* Active badge */}
                  {isActive && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#ff79c6]/10 border border-[#ff79c6]/20 shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#ff79c6]" />
                      <span className="text-[9px] font-bold text-[#ff79c6] uppercase tracking-wider">
                        Active
                      </span>
                    </span>
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingBusiness(b)}
                    className="w-8 h-8 rounded-xl bg-[#f0f0f0] hover:bg-[#ffb3d9]/30 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#171717]/40" />
                  </button>
                </div>
              );
            })}

            {/* Switch business (if > 1) */}
            {localBusinesses.length > 1 && (
              <button
                onClick={() => setShowSwitcher(true)}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-[#f0f0f0] hover:bg-[#fafafa] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-[#f0f0f0] flex items-center justify-center shrink-0">
                  <Repeat2 className="w-4 h-4 text-[#171717]/40" />
                </div>
                <span className="text-sm font-medium text-[#171717]/60">
                  Switch Active Business
                </span>
                <ChevronRight className="w-4 h-4 text-[#171717]/25 ml-auto" />
              </button>
            )}

            {/* Add business */}
            <a
              href="/create-business"
              className="flex items-center gap-3 px-5 py-3.5 border-t border-[#f0f0f0] hover:bg-[#fafafa] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#ff79c6]/10 border border-[#ff79c6]/20 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-[#ff79c6]" />
              </div>
              <span className="text-sm font-medium text-[#ff79c6]">
                Add Business
              </span>
            </a>
          </SectionCard>
        </div>

        {/* ── Account Settings ── */}
        <div style={{ animation: "fadeUp 0.4s 0.15s ease both" }}>
          <SectionCard>
            <SectionHeader label="Account" />

            {/* Email (read-only) */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0]">
              <div className="w-9 h-9 rounded-xl bg-[#f0f0f0] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-[#171717]/35" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#171717]/35 uppercase tracking-widest font-medium mb-0.5">
                  Email
                </p>
                <p className="text-sm text-[#171717] truncate">{userEmail}</p>
              </div>
              <span className="text-[10px] text-[#171717]/25 shrink-0">
                Read-only
              </span>
            </div>

            {/* Change password */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#f0f0f0] flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-[#171717]/35" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#171717]">
                  Change Password
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#171717]/25" />
            </button>
          </SectionCard>
        </div>

        {/* ── Sign Out ── */}
        <div style={{ animation: "fadeUp 0.4s 0.2s ease both" }}>
          <button
            onClick={() => setShowSignOutModal(true)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-white border border-[#f0f0f0] rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all duration-200 text-left shadow-sm shadow-black/[0.02]"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-medium text-red-500">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {editingBusiness && (
        <EditBusinessModal
          business={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSaved={(updated) =>
            handleBusinessSaved(editingBusiness.id, updated)
          }
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showSignOutModal && (
        <SignOutModal
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
        />
      )}

      {showSwitcher && (
        <BusinessSwitcherOverlay
          businesses={localBusinesses}
          activeBusinessId={localActiveId}
          onSwitch={handleSwitchBusiness}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(40px)}  to{opacity:1;transform:translateY(0)} }
      `}</style>
    </main>
  );
}
