"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[#f0ece3] transition"
      >
        <h2 className="text-[#1e2d18] font-bold">{title}</h2>
        <ChevronDown
          size={18}
          className={`text-[#9a9080] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-[#ede9e2]">{children}</div>}
    </div>
  );
}
