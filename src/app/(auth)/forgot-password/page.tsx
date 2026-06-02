"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!email.trim()) { setError("Please enter your email address"); setLoading(false); return; }
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) { setError(resetError.message || "Unable to send reset email. Please try again."); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#e9f0e4] rounded-full flex items-center justify-center">
            <CheckCircle size={36} className="text-[#3d6b2a]" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1e2d18] mb-2">Check Your Email</h2>
          <p className="text-[#7a7060] text-sm leading-relaxed">
            We&apos;ve sent a password reset link to <strong className="text-[#1e2d18]">{email}</strong>. Follow the link to reset your password.
          </p>
        </div>
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 text-[#2563eb] text-sm">
          If you don&apos;t see the email, check your spam folder. The link expires in 24 hours.
        </div>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 text-[#3d6b2a] hover:underline font-semibold">
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1e2d18] mb-1">Reset Your Password</h2>
        <p className="text-[#7a7060] text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-4 text-[#dc2626] text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">Email Address</label>
          <div className="relative">
            <input id="email" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required disabled={loading}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] text-base placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50" />
            <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9080] pointer-events-none" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold py-3.5 rounded-full transition-colors disabled:opacity-50 min-h-[48px]">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#ddd8cc]" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-[#9a9080] font-semibold tracking-wider">Remember your password?</span>
        </div>
      </div>

      <Link href="/login"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full border border-[#ddd8cc] text-[#1e2d18] hover:bg-[#f2efe8] hover:border-[#3d6b2a] transition font-semibold">
        <ArrowLeft size={16} />
        Back to Sign In
      </Link>
    </div>
  );
}
