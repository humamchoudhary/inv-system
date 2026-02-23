import { BrainCog, Mic, Package, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const features = [
    {
      icon: Mic,
      title: "Record daily sales",
      sub: "using voice",
    },
    {
      icon: Package,
      title: "Inventory updates",
      sub: "automatically",
    },
    {
      icon: BarChart2,
      title: "Track performance",
      sub: "over time",
    },
  ];

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col items-center justify-center px-6 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none select-none">
        {/* Large soft glow — top right */}
        <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full bg-[#1e1e1e] opacity-[0.18] blur-[140px]" />
        {/* Smaller tight glow — bottom left */}
        <div className="absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full bg-[#171717] opacity-[0.12] blur-[100px]" />
        {/* Faint grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Content wrapper ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* ── Logo ── */}
        <div
          className="flex items-center gap-2.5 mb-16"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#171717] shadow-lg shadow-[#171717]/30">
            <BrainCog className="w-5 h-5 text-white" />
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-[#171717]">
            AI Inventory
          </span>
        </div>

        {/* ── Headline ── */}
        <div
          className="text-center mb-12"
          style={{ animation: "fadeUp 0.5s 0.1s ease both" }}
        >
          <h1 className="text-[28px] font-semibold tracking-tight text-[#171717] leading-snug">
            Let&apos;s set up your
            <br />
            <span className="text-[#171717]">first business.</span>
          </h1>
          <p className="text-sm text-[#171717]/40 mt-2">
            Here&apos;s what you&apos;ll be able to do.
          </p>
        </div>

        {/* ── Value statements ── */}
        <div className="w-full flex flex-col gap-3 mb-12">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#f0f0f0]/60 border border-[#f0f0f0] hover:border-[#1e1e1e] transition-all duration-200"
                style={{ animation: `fadeUp 0.5s ${0.2 + i * 0.1}s ease both` }}
              >
                {/* Icon bubble */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-[#f0f0f0] flex items-center justify-center shadow-sm">
                  <Icon
                    className="w-4.5 h-4.5 text-[#171717]/70"
                    style={{ width: "18px", height: "18px" }}
                  />
                </div>
                {/* Text */}
                <div>
                  <p className="text-sm font-medium text-[#171717] leading-tight">
                    {f.title}
                  </p>
                  <p className="text-xs text-[#171717]/40 mt-0.5">{f.sub}</p>
                </div>
                {/* Tick */}
                <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-[#171717]/10 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5 4-4"
                      stroke="#171717"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <div
          className="w-full"
          style={{ animation: "fadeUp 0.5s 0.55s ease both" }}
        >
          <div className="group relative w-full py-3.5 rounded-2xl bg-[#171717] hover:bg-[#171717]/90 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-xl shadow-[#171717]/30 transition-all duration-200 overflow-hidden">
            <Link href={"/onboarding/"}>
              {/* Shimmer sweep on hover */}
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                Create Your First Business
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
