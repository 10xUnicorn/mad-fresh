"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.first_name) {
        setUserName(user.user_metadata.first_name);
      } else if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
    };
    getUser();
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
        setError(updateError.message || "Failed to set password. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(redirect);
      }, 2500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#3d6b2a]/20 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-[#3d6b2a]" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-[#1e2d18]">You're All Set!</h2>
        <p className="text-[#7a7060] text-sm">
          Welcome to Mad Fresh Kitchen{userName ? `, ${userName}` : ""}! Redirecting you now...
        </p>
        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-[#3d6b2a] rounded-full animate-[mf-progress_2.5s_ease-in-out_forwards]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-[#3d6b2a]/20 rounded-full flex items-center justify-center">
            <Sparkles size={24} className="text-[#3d6b2a]" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-[#1e2d18] mb-2">
          Welcome{userName ? `, ${userName}` : ""}!
        </h2>
        <p className="text-[#7a7060] text-sm">
          Set a password to complete your account setup
        </p>
      </div>

      {error && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-4 text-[#dc2626] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">
            Create Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060] pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 text-base rounded-lg bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9080] hover:text-[#3d6b2a] transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

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

        {/* Confirm */}
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060] pointer-events-none" />
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 text-base rounded-lg bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9080] hover:text-[#3d6b2a] transition"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
          )}
          {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
            <p className="text-xs text-[#3d6b2a] mt-1 flex items-center gap-1">
              <CheckCircle size={12} /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password.length < 8 || password !== confirmPassword}
          className="btn-accent w-full font-bold py-2.5 rounded-lg transition disabled:opacity-50 min-h-[44px]"
        >
          {loading ? "Setting up..." : "Complete Setup"}
        </button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="space-y-6 text-center"><p className="text-[#7a7060]">Loading...</p></div>}>
      <SetPasswordContent />
    </Suspense>
  );
}
