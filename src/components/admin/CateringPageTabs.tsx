"use client";

import { useState } from "react";
import { Package, GraduationCap, FileText } from "lucide-react";
import CateringManager from "./CateringManager";
import ContractsManager from "./ContractsManager";
import SchoolLunchCalendar from "./SchoolLunchCalendar";

interface CateringPageTabsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPackages: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialOrders: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialContracts: any[];
}

type TopTab = "catering" | "school" | "contracts";

export default function CateringPageTabs({
  initialPackages,
  initialOrders,
  initialContracts,
}: CateringPageTabsProps) {
  const [activeSection, setActiveSection] = useState<TopTab>("catering");

  // Split packages: school packages vs general catering
  const schoolPackages = initialPackages.filter(
    (p) => p.name?.toLowerCase().includes("school") || p.description?.toLowerCase().includes("school")
  );
  const generalPackages = initialPackages.filter(
    (p) => !p.name?.toLowerCase().includes("school") && !p.description?.toLowerCase().includes("school")
  );

  // Split orders by type
  const generalOrders = initialOrders.filter((o) => (o.order_type || "event") !== "school");
  const schoolOrders = initialOrders.filter((o) => o.order_type === "school");

  const tabs: { key: TopTab; label: string; icon: typeof Package; count?: number }[] = [
    { key: "catering", label: "General Catering", icon: Package, count: generalPackages.length },
    { key: "school", label: "School Lunches", icon: GraduationCap, count: schoolPackages.length },
    { key: "contracts", label: "Contracts", icon: FileText, count: initialContracts.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top-level section tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? "bg-[#449531] text-white shadow-lg shadow-[#449531]/20"
                  : "bg-white border border-[#ddd8cc] text-[#7a7060] hover:bg-[#f0ece3] hover:text-[#4a5e3a]"
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive ? "bg-white text-[#3d6b2a]" : "bg-[#f2efe8] text-[#9a9080]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      {activeSection === "catering" && (
        <CateringManager
          initialPackages={generalPackages}
          initialOrders={generalOrders}
        />
      )}

      {activeSection === "school" && (
        <div className="space-y-8">
          <SchoolLunchCalendar
            initialContracts={initialContracts.filter(
              (c) => c.client_type === "school"
            )}
          />
          <div className="border-t border-[#ddd8cc] pt-6">
            <h3 className="text-lg font-semibold text-[#1e2d18] mb-4">School Packages & Orders</h3>
            <CateringManager
              initialPackages={schoolPackages}
              initialOrders={schoolOrders}
            />
          </div>
        </div>
      )}

      {activeSection === "contracts" && (
        <ContractsManager initialContracts={initialContracts} />
      )}
    </div>
  );
}
