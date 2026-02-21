"use client";
import { BrainCog } from "lucide-react";
import { useActionState } from "react";
import { signInAction } from "../actions/signIn";

export default function page() {
  const [state, formAction] = useActionState(signInAction, {
    error: false,
    message: "",
  });

  return (
    <main className="min-h-screen  w-full bg-[#ffffff] flex items-center justify-center px-4 font-[family-name:var(--font-geist-sans)]">
      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#ffb3d9] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#ff79c6] opacity-10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo + Tagline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ff79c6] mb-4 shadow-lg shadow-[#ff79c6]/30">
            <BrainCog className="text-white" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#171717]">
            AI Inventory
          </h1>
          <p className="text-sm text-[#171717]/50 mt-1">Your Data Organised.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#f0f0f0] rounded-3xl p-8 shadow-xl shadow-black/[0.04]">
          <h2 className="text-lg font-semibold text-[#171717] mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-[#171717]/50 mb-6">Sign in to continue</p>

          <form
            action={async (formData: FormData) => {
              const result = formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            {state?.error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {state.message}
              </p>
            )}
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
                className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200 focus:border-[#ff79c6] focus:bg-white focus:ring-2 focus:ring-[#ff79c6]/20"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-[#171717]/60 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/30 text-sm outline-none transition-all duration-200 focus:border-[#ff79c6] focus:bg-white focus:ring-2 focus:ring-[#ff79c6]/20"
              />
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              className="mt-2 w-full py-3 rounded-xl bg-[#ff79c6] hover:bg-[#ff79c6]/90 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#ff79c6]/30 transition-all duration-200"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-[#171717]/50 mt-6">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-[#ff79c6] font-medium hover:text-[#ff79c6]/80 transition-colors"
          >
            Sign Up
          </a>
        </p>
      </div>
    </main>
  );
}
