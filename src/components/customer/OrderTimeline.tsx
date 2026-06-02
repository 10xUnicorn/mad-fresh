"use client";

import { Check, ClipboardCheck, ChefHat, Package, Truck, MapPin } from "lucide-react";

interface OrderTimelineProps {
  status: string;
  fulfillmentType: string;
  createdAt: string;
  updatedAt?: string;
}

const DELIVERY_STEPS = [
  { key: "pending", label: "Placed", icon: ClipboardCheck },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "out_for_delivery", label: "On the Way", icon: Truck },
  { key: "completed", label: "Delivered", icon: MapPin },
];

const PICKUP_STEPS = [
  { key: "pending", label: "Placed", icon: ClipboardCheck },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "completed", label: "Picked Up", icon: MapPin },
];

const STATUS_ORDER = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "completed"];

export default function OrderTimeline({ status, fulfillmentType, createdAt, updatedAt }: OrderTimelineProps) {
  const steps = fulfillmentType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIdx = STATUS_ORDER.indexOf(status);

  // Map status to a "completed" status for the completed/delivered state
  const effectiveIdx = status === "delivered" ? STATUS_ORDER.indexOf("completed") : currentIdx;

  return (
    <div className="bg-white border border-[#ddd8cc] rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[#1e2d18] font-bold text-base">Order Status</h2>
        {updatedAt && (
          <span className="text-[#9a9080] text-xs">
            Updated {new Date(updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:block">
        {/* Progress bar background */}
        <div className="relative mx-6 mb-2">
          <div className="absolute top-4 left-0 right-0 h-1 bg-[#f2efe8] rounded-full" />
          <div
            className="absolute top-4 left-0 h-1 bg-[#3d6b2a] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, (effectiveIdx / (steps.length - 1)) * 100)}%` }}
          />
        </div>

        {/* Step icons + labels */}
        <div className="flex justify-between">
          {steps.map((step, i) => {
            const stepIdx = STATUS_ORDER.indexOf(step.key);
            const isDone = effectiveIdx > stepIdx;
            const isCurrent = effectiveIdx === stepIdx;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? "bg-[#3d6b2a] text-white"
                      : isCurrent
                        ? "bg-[#3d6b2a] text-white ring-4 ring-[#3d6b2a]/20"
                        : "bg-[#f2efe8] text-[#9a9080]"
                  }`}
                >
                  {isDone ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                </div>
                <span
                  className={`text-[11px] mt-2 text-center leading-tight font-medium ${
                    isDone || isCurrent ? "text-[#1e2d18]" : "text-[#9a9080]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical stepper */}
      <div className="sm:hidden space-y-0">
        {steps.map((step, i) => {
          const stepIdx = STATUS_ORDER.indexOf(step.key);
          const isDone = effectiveIdx > stepIdx;
          const isCurrent = effectiveIdx === stepIdx;
          const Icon = step.icon;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Left rail: icon + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isDone
                      ? "bg-[#3d6b2a] text-white"
                      : isCurrent
                        ? "bg-[#3d6b2a] text-white ring-4 ring-[#3d6b2a]/20"
                        : "bg-[#f2efe8] text-[#9a9080]"
                  }`}
                >
                  {isDone ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] my-1 transition-colors duration-300 ${
                      isDone ? "bg-[#3d6b2a]" : "bg-[#f2efe8]"
                    }`}
                  />
                )}
              </div>

              {/* Right: label + timestamp */}
              <div className={`pt-1.5 pb-3 ${isLast ? "pb-0" : ""}`}>
                <p className={`text-sm font-semibold leading-tight ${isDone || isCurrent ? "text-[#1e2d18]" : "text-[#9a9080]"}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-[#3d6b2a] text-xs mt-0.5 font-medium">Current</p>
                )}
                {isDone && i === 0 && (
                  <p className="text-[#9a9080] text-xs mt-0.5">
                    {new Date(createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
