"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // Listen for the PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
          setChecking(false);
        }
      }
    );

    // Also check if we already have a session (user might have refreshed)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    };

    // Give the auth state change a moment, then check session as fallback
    const timer = setTimeout(checkSession, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase.auth]);

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength] || "";
  const strengthColor =
    strength <= 1 ? "bg-red-500" : strength <= 2 ? "bg-yellow-500" : strength <= 3 ? "bg-blue-500" : "bg-[#3d6b2a]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#161616] via-[#161616] to-[#449531]/20 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#3d6b2a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#3d6b2a]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-1 mb-6">
              <span className="text-4xl font-black text-[#1e2d18]">M</span>
              <span className="text-4xl font-black text-[#75F663]">F</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1e2d18]">MAD FRESH</h1>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#3d6b2a]/20 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-[#75F663]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#1e2d18]">Password Updated</h2>
            <p className="text-[#7a7060] text-sm">
              Your password has been successfully reset. Redirecting you to your dashboard...
            </p>
            <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-[#3d6b2a] rounded-full animate-[mf-progress_3s_ease-in-out_forwards]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#161616] via-[#161616] to-[#449531]/20 pointer-events-none" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center gap-1 mb-6">
            <span className="text-4xl font-black text-[#1e2d18]">M</span>
            <span className="text-4xl font-black text-[#75F663]">F</span>
          </div>
          <p className="text-[#7a7060]">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#161616] via-[#161616] to-[#449531]/20 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#3d6b2a]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-1 mb-6">
              <span className="text-4xl font-black text-[#1e2d18]">M</span>
              <span className="text-4xl font-black text-[#75F663]">F</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1e2d18]">MAD FRESH</h1>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6 text-center">
            <AlertCircle size={48} className="text-yellow-400 mx-auto" />
            <h2 className="text-xl font-bold text-[#1e2d18]">Invalid or Expired Link</h2>
            <p className="text-[#7a7060] text-sm">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold"
            >
              Request New Reset Link
            </Link>
            <div>
              <Link href="/login" className="text-sm text-[#75F663] hover:text-[#3d6b2a] transition">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-[#161616] via-[#161616] to-[#449531]/20 pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#3d6b2a]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#3d6b2a]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-1 mb-6">
            <span className="text-4xl font-black text-[#1e2d18]">M</span>
            <span className="text-4xl font-black text-[#75F663]">F</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e2d18]">MAD FRESH</h1>
          <p className="text-[#7a7060] text-sm mt-2">Fresh Meals. Zero Excuses.</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1e2d18] mb-2">Create New Password</h2>
            <p className="text-[#7a7060] text-sm">
              Choose a strong password for your account
            </p>
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1e2d18] mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 text-base rounded-lg bg-white/5 border border-white/10 text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#75F663]/50 focus:ring-2 focus:ring-[#75F663]/20 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7060] hover:text-[#4a5e3a] transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength ? strengthColor : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#7a7060]">{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[#1e2d18] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060] pointer-events-none" />
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 text-base rounded-lg bg-white/5 border border-white/10 text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#75F663]/50 focus:ring-2 focus:ring-[#75F663]/20 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7060] hover:text-[#4a5e3a] transition"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                <p className="text-xs text-[#75F663] mt-1 flex items-center gap-1">
                  <CheckCircle size={12} /> Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="btn-accent w-full font-bold py-2.5 rounded-lg transition disabled:opacity-50 min-h-[44px]"
            >
              {loading ? "Updating..." : "Set New Password"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#75F663] hover:text-[#3d6b2a] transition">
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-[#9a9080] text-xs mt-8">
          © 2026 Mad Fresh Kitchen. All rights reserved.
        </p>
      </div>
    </div>
  );
}
