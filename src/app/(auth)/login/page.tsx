"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorParam || "");

  useState(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace(redirect);
    };
    checkSession();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }
      router.push(redirect);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1e2d18] mb-1">Welcome back</h2>
        <p className="text-[#7a7060] text-sm">Sign in to manage your orders and subscription</p>
      </div>

      {error && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-4 text-[#dc2626] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">Email</label>
          <input id="email" type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required disabled={loading} className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading}
              className={inputClass} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9080] hover:text-[#3d6b2a] transition">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-[#3d6b2a] hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold py-3.5 rounded-full transition-colors disabled:opacity-50 min-h-[48px]">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#ddd8cc]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-[#9a9080] font-semibold tracking-wider">New here?</span>
        </div>
      </div>

      <Link href="/signup"
        className="block w-full text-center px-4 py-3 rounded-full border border-[#ddd8cc] text-[#1e2d18] hover:bg-[#f2efe8] hover:border-[#3d6b2a] transition font-semibold">
        Create an Account
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-[#7a7060] text-sm">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
