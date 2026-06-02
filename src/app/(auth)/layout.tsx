import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f3] px-4 py-10 relative overflow-hidden">
      {/* Soft bg blobs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#e9f0e4] rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#f2efe8] rounded-full blur-3xl opacity-80 -translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/brand/mad-fresh-logo.png"
              alt="Mad Fresh Kitchen"
              width={72}
              height={72}
              className="w-18 h-18 object-contain rounded-2xl shadow-sm mx-auto mb-4"
            />
          </Link>
          <p className="text-[#9a9080] text-sm mt-1">Real Food. Made with Love.</p>
        </div>

        {/* Auth card */}
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 shadow-sm space-y-6">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-[#9a9080] text-xs mt-6">
          © {new Date().getFullYear()} Mad Fresh Kitchen. All rights reserved.
        </p>
      </div>
    </div>
  );
}
