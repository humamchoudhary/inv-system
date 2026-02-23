"use client";
import { signUp } from "@/app/actions/signUp";
import { BrainCog } from "lucide-react";
import { useActionState } from "react";

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, {
    error: false,
    message: "",
  });
  return (
    <main className="min-h-screen  w-full bg-[#ffffff] flex items-center justify-center px-4 font-[family-name:var(--font-geist-sans)]">
      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1e1e1e] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#171717] opacity-10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo + Tagline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#171717] mb-4 shadow-lg shadow-[#171717]/30">
            <BrainCog className="text-white" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#171717]">
            AI Inventory
          </h1>
          <p className="text-sm text-[#171717]/50 mt-1">Your Data Organised.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#f0f0f0] rounded-3xl p-8 shadow-xl shadow-black/[0.04]">
          <h2 className="text-center text-lg font-semibold text-[#171717] mb-1">
            Create an account
          </h2>
          <p className="text-center text-sm text-[#171717]/50 mb-6">
            Get started for free today
          </p>

          <form action={formAction} className="flex flex-col gap-4">
            {state?.error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {state.message}
              </p>
            )}
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-xs font-medium text-[#171717]/60 uppercase tracking-wider"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200 focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/20"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-[#171717]/60 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200 focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/20"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-[#171717]/60 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200 focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/20"
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm-password"
                className="text-xs font-medium text-[#171717]/60 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200 focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/20"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  name="terms"
                  required
                  className="peer sr-only"
                />
                <div className="w-4 h-4 rounded-[5px] border border-[#f0f0f0] bg-[#f0f0f0]/50 peer-checked:bg-[#171717] peer-checked:border-[#171717] transition-all duration-200" />
                <svg
                  className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 8l3.5 3.5 6.5-7"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xs text-[#171717]/50 leading-relaxed">
                I agree to the{" "}
                <a href="/terms" className="text-[#171717] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#171717] hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Primary CTA */}
            <button
              type="submit"
              className="mt-1 w-full py-3 rounded-xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/30 transition-all duration-200"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-[#171717]/50 mt-6">
          Already have an account?{" "}
          <a
            href="/signin"
            className="text-[#171717] font-medium hover:text-[#171717]/80 transition-colors"
          >
            Sign In
          </a>
        </p>
      </div>
    </main>
  );
}
