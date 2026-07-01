"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("licenseKey", uuid);

    try {
      const { userLogin } = await import("@/actions/auth");
      const res = await userLogin(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen font-sans text-[#e8efe8] bg-[#080c08] overflow-hidden">
      {/* Left Panel — AI Visual */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0d0f0e] to-[#0a0a0a]">
        
        {/* Ambient glow orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] top-[10%] left-[10%] animate-pulse-glow"></div>
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.05)_0%,transparent_70%)] bottom-[15%] right-[5%] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(163,230,53,0.03)_0%,transparent_70%)] top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(232,239,232,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(232,239,232,0.02) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        ></div>

        {/* Central illustration area */}
        <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in-up">
          {/* Logo mark */}
          <div className="relative">
            <div className="w-[120px] h-[120px] rounded-3xl bg-[#e8efe8]/[0.04] backdrop-blur-xl border border-[#e8efe8]/[0.08] flex items-center justify-center animate-float">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M32 8L44 20L56 32L44 44L32 56L20 44L8 32L20 20L32 8Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none"/>
                <path d="M32 16L40 24L48 32L40 40L32 48L24 40L16 32L24 24L32 16Z" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                <circle cx="32" cy="32" r="6" fill="url(#logoGrad)"/>
                <defs>
                  <linearGradient id="logoGrad" x1="8" y1="8" x2="56" y2="56">
                    <stop offset="0%" stopColor="#a3e635"/>
                    <stop offset="50%" stopColor="#22c55e"/>
                    <stop offset="100%" stopColor="#14b8a6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Orbiting ring */}
            <div className="absolute -inset-5 border border-[#e8efe8]/[0.06] rounded-full animate-spin-slow"></div>
            <div className="absolute -inset-5 w-2 h-2 bg-green-500 rounded-full animate-spin-slow shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
          </div>

          {/* Floating workflow nodes */}
          <div className="flex gap-4 items-center">
            <div className="px-4 py-2.5 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/[0.08] rounded-xl text-xs font-medium text-[#e8efe8]/50 backdrop-blur-md animate-float" style={{ animationDelay: '0.5s' }}>PRD</div>
            <div className="w-8 h-px bg-[#e8efe8]/[0.08]"></div>
            <div className="px-4 py-2.5 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/[0.08] rounded-xl text-xs font-medium text-[#e8efe8]/50 backdrop-blur-md animate-float" style={{ animationDelay: '1s' }}>Architecture</div>
            <div className="w-8 h-px bg-[#e8efe8]/[0.08]"></div>
            <div className="px-4 py-2.5 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/[0.08] rounded-xl text-xs font-medium text-[#e8efe8]/50 backdrop-blur-md animate-float" style={{ animationDelay: '1.5s' }}>Frontend</div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="px-4 py-2.5 bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.06] rounded-xl text-xs font-medium text-[#e8efe8]/35 backdrop-blur-md animate-float" style={{ animationDelay: '2s' }}>Backend</div>
            <div className="w-8 h-px bg-[#e8efe8]/[0.05]"></div>
            <div className="px-4 py-2.5 bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.06] rounded-xl text-xs font-medium text-[#e8efe8]/35 backdrop-blur-md animate-float" style={{ animationDelay: '2.5s' }}>Database</div>
            <div className="w-8 h-px bg-[#e8efe8]/[0.05]"></div>
            <div className="px-4 py-2.5 bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.06] rounded-xl text-xs font-medium text-[#e8efe8]/35 backdrop-blur-md animate-float" style={{ animationDelay: '3s' }}>Deploy</div>
          </div>

          {/* Tagline */}
          <div className="text-center mt-2">
            <div className="text-sm font-medium text-[#e8efe8]/40 tracking-[3px] uppercase">AI Prompt Engineering</div>
            <div className="text-[13px] text-[#e8efe8]/25 mt-2">Complete workflow generation for your next project</div>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L11 7L16 9L11 11L9 16L7 11L2 9L7 7L9 2Z" fill="#080c08"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-[-0.5px]">Rotifex</span>
        </div>

        <div className="absolute bottom-8 left-8 flex gap-6">
          <span className="text-xs text-[#e8efe8]/25 cursor-pointer hover:text-[#e8efe8]/60 transition-colors">About</span>
          <span className="text-xs text-[#e8efe8]/25 cursor-pointer hover:text-[#e8efe8]/60 transition-colors">Documentation</span>
          <span className="text-xs text-[#e8efe8]/25 cursor-pointer hover:text-[#e8efe8]/60 transition-colors">Support</span>
        </div>
      </div>

      {/* Right Panel — Access Card */}
      <div className="w-[520px] flex items-center justify-center relative bg-gradient-to-b from-[#0b0b0b] to-[#0d0d0d] border-l border-[#e8efe8]/[0.06]">
        {/* Subtle glow behind card */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(232,239,232,0.03)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

        {/* Access Card */}
        <div className="w-[400px] relative z-10 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          <div className="bg-[#121212]/60 backdrop-blur-[40px] border border-[#e8efe8]/[0.08] rounded-3xl p-12 flex flex-col gap-8">
            
            {/* Header */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold tracking-[3px] uppercase text-[#e8efe8]/35">Secure Access</div>
              <div className="text-2xl font-bold tracking-[-0.5px] text-[#e8efe8]">Enter your UUID</div>
              <div className="text-sm text-[#e8efe8]/40 leading-relaxed">Paste the unique access key provided by your administrator to continue.</div>
            </div>

            {/* Form */}
            <form onSubmit={handleAccess} className="flex flex-col gap-8">
              {/* UUID Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#e8efe8]/50 tracking-[0.5px]">ACCESS KEY</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                    className="w-full py-4 pr-12 pl-4 bg-[#0a0f0a]/80 border border-[#e8efe8]/10 rounded-xl text-[#e8efe8] font-mono text-[13px] outline-none transition-colors focus:border-green-500/40 focus:ring-4 focus:ring-green-500/10"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-30">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="7" width="12" height="7" rx="2" stroke="#e8efe8" strokeWidth="1.5"/>
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="#e8efe8" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                {error && (
                  <div className="text-red-400 text-[13px] mt-1">
                    {error}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-br from-green-500 to-teal-500 border-none rounded-xl text-[#080c08] font-sans text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all tracking-[0.3px] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(34,197,94,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Access Platform'}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#e8efe8]/[0.06]"></div>
              <span className="text-[11px] text-[#e8efe8]/20 uppercase tracking-[2px]">or</span>
              <div className="flex-1 h-px bg-[#e8efe8]/[0.06]"></div>
            </div>

            {/* Request Access */}
            <button 
              type="button"
              onClick={() => alert('Please contact your administrator to request a valid UUID License Key.')}
              className="w-full py-3.5 bg-green-500/[0.06] border border-[#e8efe8]/10 rounded-xl text-green-500/70 font-sans text-sm font-semibold cursor-pointer transition-all hover:bg-[#e8efe8]/[0.08] hover:border-[#e8efe8]/15"
            >
              Request Access
            </button>

            {/* Status info */}
            <div className="flex items-center gap-2 justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-xs text-[#e8efe8]/30">System online · 256-bit encryption</span>
            </div>
          </div>

          {/* Powered by footer */}
          <div className="text-center mt-6">
            <span className="text-[11px] text-[#e8efe8]/15">Powered by Rotifex AI Engine v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
