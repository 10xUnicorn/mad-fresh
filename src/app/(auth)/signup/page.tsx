"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!firstName.trim()) {
      setError("Please enter your first name");
      setLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the Terms of Service");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Unable to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle size={48} className="text-[#3d6b2a]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#1e2d18] mb-1">Check Your Email</h2>
          <p className="text-[#7a7060] text-sm">
            We've sent a confirmation link to <strong>{email}</strong>. Please check
            your email to confirm your account.
          </p>
        </div>

        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 text-[#2563eb] text-sm">
          Didn't receive the email? Check your spam folder or contact support.
        </div>

        <Link
          href="/login"
          className="block w-full px-4 py-2.5 rounded-lg border border-white/20 text-[#1e2d18] hover:bg-white/5 transition font-medium"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1e2d18] mb-1">Create Your Account</h2>
        <p className="text-[#7a7060] text-sm">
          Join Mad Fresh Kitchen and start enjoying fresh meals
        </p>
      </div>

      {error && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-4 text-[#dc2626] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
          />
        </div>

        {/* Last name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#1e2d18] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9080] hover:text-[#3d6b2a] transition disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-[#9a9080] mt-1">At least 8 characters</p>
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-[#1e2d18] mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9080] hover:text-[#3d6b2a] transition disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            disabled={loading}
            className="mt-1 w-4 h-4 rounded accent-[#3d6b2a] disabled:opacity-50"
          />
          <label htmlFor="terms" className="text-sm text-[#7a7060]">
            I agree to the{" "}
            <a href="/terms" className="text-[#3d6b2a] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-[#3d6b2a] hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-[#1e2d18] font-bold py-3.5 rounded-full transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#ddd8cc]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-[#9a9080] font-semibold tracking-wider">Already have an account?</span>
        </div>
      </div>

      {/* Sign in link */}
      <Link
        href="/login"
        className="block w-full text-center px-4 py-3 rounded-full border border-[#ddd8cc] text-[#1e2d18] hover:bg-[#f2efe8] hover:border-[#3d6b2a] transition font-semibold"
      >
        Sign In
      </Link>
    </div>
  );
}
