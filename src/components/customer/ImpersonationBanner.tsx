"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

interface ImpersonationBannerProps {
  name: string;
}

export default function ImpersonationBanner({ name }: ImpersonationBannerProps) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
        <Eye size={14} />
        <span>Viewing as <strong className="text-amber-900">{name}</strong></span>
      </div>
      <Link
        href="/admin"
        className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-600 font-semibold transition"
      >
        <ArrowLeft size={12} />
        Back to Admin
      </Link>
    </div>
  );
}
