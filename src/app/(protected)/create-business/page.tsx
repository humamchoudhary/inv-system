"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCog,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createBusinessAction } from "@/app/actions/createBusiness";

// ── Types ──────────────────────────────────────────────────────────────────────
type ActionState = { error: boolean; message: string } | null;

const BUSINESS_TYPES = [
  "Retail",
  "Food & Beverage",
  "Services",
  "Wholesale",
  "Manufacturing",
  "E-commerce",
  "Healthcare",
  "Education",
  "Agriculture",
  "Other",
];

// ── Redirect progress bar ──────────────────────────────────────────────────────
function RedirectBar({
  duration = 2800,
  onComplete,
}: {
  duration?: number;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(((now - start) / duration) * 100, 100);
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else onComplete();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onComplete]);

  return (
    <div className="w-full h-1 rounded-full bg-[#f0f0f0] overflow-hidden">
      <div
        className="h-full rounded-full bg-[#171717] transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Animated checkmark ─────────────────────────────────────────────────────────
function Checkmark() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <span
        className="absolute inset-0 rounded-full bg-[#171717]/10 animate-ping"
        style={{ animationDuration: "1.4s" }}
      />
      <span className="absolute inset-2 rounded-full bg-[#171717]/10" />
      <div className="relative w-16 h-16 rounded-full bg-[#171717] shadow-xl shadow-[#171717]/40 flex items-center justify-center">
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
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#171717]/60 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-[#171717]">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Ambient background ────────────────────────────────────────────────────────
function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#1e1e1e] opacity-20 blur-[130px]" />
      <div className="absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-[#171717] opacity-10 blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CreateBusinessPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [businessType, setBusinessType] = useState("Retail");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clientErrors, setClientErrors] = useState<{
    businessName?: string;
    currency?: string;
  }>({});

  const [currencies, setCurrencies] = useState<
    { code: string; label: string }[]
  >([]);

  const nameRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createBusinessAction,
    null,
  );

  const isReady = state !== null && !state.error;

  useEffect(() => {
    fetch("/currencies.json")
      .then((r) => r.json())
      .then((data: { code: string; label: string }[]) =>
        setCurrencies(data.sort((a, b) => a.code.localeCompare(b.code))),
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const validate = (
    field: "businessName" | "currency",
    value: string,
  ): string | undefined => {
    if (field === "businessName") {
      if (!value.trim()) return "Business name is required.";
      if (value.trim().length < 2) return "Must be at least 2 characters.";
    }
    if (field === "currency" && !value) return "Please select a currency.";
  };

  const handleBlur = (field: "businessName" | "currency", value: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setClientErrors((e) => ({ ...e, [field]: validate(field, value) }));
  };

  const handleFormAction = (formData: FormData) => {
    const nameErr = validate("businessName", businessName);
    const currErr = validate("currency", currency);
    setClientErrors({ businessName: nameErr, currency: currErr });
    setTouched({ businessName: true, currency: true });
    if (nameErr || currErr) return;
    formAction(formData);
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl border bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200";
  const inputNormal = `${inputBase} border-[#f0f0f0] focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/20`;
  const inputErr = `${inputBase} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/30`;

  // ── READY STATE ──────────────────────────────────────────────────────────────
  if (isReady) {
    return (
      <main className="min-h-screen w-full bg-[#ffffff] flex flex-col items-center justify-center px-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <Ambient />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm gap-6">
          <div style={{ animation: "fadeUp 0.4s ease both" }}>
            <Checkmark />
          </div>

          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.2s ease both" }}
          >
            <p className="text-xs font-medium text-[#171717] uppercase tracking-widest">
              All set
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717]">
              Business created
            </h1>
          </div>

          <div
            className="px-5 py-2.5 rounded-2xl bg-[#f0f0f0]/70 border border-[#f0f0f0]"
            style={{ animation: "fadeUp 0.4s 0.3s ease both" }}
          >
            <p className="text-base font-semibold text-[#171717] tracking-tight">
              {businessName}
            </p>
          </div>

          <p
            className="text-sm text-[#171717]/50"
            style={{ animation: "fadeUp 0.4s 0.4s ease both" }}
          >
            Taking you back to your profile →
          </p>

          <div
            className="w-full flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.5s ease both" }}
          >
            <p className="text-xs text-[#171717]/30 text-center">
              Redirecting…
            </p>
            <RedirectBar onComplete={() => router.push("/profile")} />
          </div>
        </div>

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes drawCheck {
            from { stroke-dashoffset: 28; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </main>
    );
  }

  // ── FORM STATE ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col items-center justify-center px-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />

      <div className="relative z-10 w-full max-w-sm">
        {/* Back */}
        <a
          href="/profile"
          className="inline-flex items-center gap-1 text-xs text-[#171717]/40 hover:text-[#171717] transition-colors mb-8 group"
          style={{ animation: "fadeUp 0.4s ease both" }}
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back to Profile
        </a>

        {/* Header */}
        <div
          className="mb-8"
          style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#171717] shadow-md shadow-[#171717]/30">
              <BrainCog className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] mt-3">
            Add a Business
          </h1>
          <p className="text-sm text-[#171717]/40 mt-1">
            Just the essentials — you can add more later.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white border border-[#f0f0f0] rounded-3xl p-7 shadow-xl shadow-black/[0.04]"
          style={{ animation: "fadeUp 0.4s 0.1s ease both" }}
        >
          {/* Server-side error banner */}
          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                {state.message || "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <form
            action={handleFormAction}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Hidden fields */}
            <input type="hidden" name="name" value={businessName} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="business_type" value={businessType} />

            {/* Business Name */}
            <Field
              label="Business name"
              required
              error={
                touched.businessName ? clientErrors.businessName : undefined
              }
            >
              <input
                ref={nameRef}
                type="text"
                placeholder="My Shop"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={(e) => handleBlur("businessName", e.target.value)}
                className={
                  touched.businessName && clientErrors.businessName
                    ? inputErr
                    : inputNormal
                }
              />
            </Field>

            {/* Currency */}
            <Field
              label="Currency"
              required
              error={touched.currency ? clientErrors.currency : undefined}
            >
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  onBlur={(e) => handleBlur("currency", e.target.value)}
                  className={`${
                    touched.currency && clientErrors.currency
                      ? inputErr
                      : inputNormal
                  } appearance-none pr-10 cursor-pointer`}
                >
                  {currencies.length === 0 ? (
                    <option value="NGN">NGN — Nigerian Naira</option>
                  ) : (
                    currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/30 pointer-events-none" />
              </div>
            </Field>

            {/* Business Type */}
            <Field label="Business type">
              <div className="relative">
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className={`${inputNormal} appearance-none pr-10 cursor-pointer`}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/30 pointer-events-none" />
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="group relative mt-1 w-full py-3.5 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/30 transition-all duration-200 overflow-hidden flex items-center justify-center gap-2"
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create Business
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="group-hover:translate-x-0.5 transition-transform duration-150"
                    >
                      <path
                        d="M2 7h10M8 3l4 4-4 4"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
