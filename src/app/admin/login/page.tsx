"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const { adminLogin } = await import("@/actions/auth");
      const res = await adminLogin(formData);
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
    <div className="flex w-screen h-screen font-sans text-[#e8efe8] bg-[#080c08] items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] animate-pulse-glow pointer-events-none"></div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(232,239,232,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(232,239,232,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>

      <div className="w-[440px] relative z-10 animate-fade-in-up">
        <div className="bg-[#121212]/80 backdrop-blur-[40px] border border-[#e8efe8]/[0.08] rounded-3xl p-12 flex flex-col gap-8 shadow-2xl">
          
          {/* Header */}
          <div className="flex flex-col gap-2 items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-2">
              <ShieldCheck className="text-[#080c08]" size={24} />
            </div>
            <div className="text-[11px] font-semibold tracking-[3px] uppercase text-[#e8efe8]/35">System Administrator</div>
            <div className="text-2xl font-bold tracking-[-0.5px] text-[#e8efe8]">Admin Portal</div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#e8efe8]/50 tracking-[0.5px]">EMAIL</label>
              <input 
                type="email" 
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3.5 px-4 bg-[#0a0f0a]/80 border border-[#e8efe8]/10 rounded-xl text-[#e8efe8] font-sans text-[14px] outline-none transition-colors focus:border-green-500/40 focus:ring-4 focus:ring-green-500/10"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#e8efe8]/50 tracking-[0.5px]">PASSWORD</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 px-4 bg-[#0a0f0a]/80 border border-[#e8efe8]/10 rounded-xl text-[#e8efe8] font-sans text-[14px] outline-none transition-colors focus:border-green-500/40 focus:ring-4 focus:ring-green-500/10"
              />
            </div>

            {error && (
              <div className="text-red-400 text-[13px] text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-gradient-to-br from-green-500 to-teal-500 border-none rounded-xl text-[#080c08] font-sans text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all tracking-[0.3px] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(34,197,94,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
