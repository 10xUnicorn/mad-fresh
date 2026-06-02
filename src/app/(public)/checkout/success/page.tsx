"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Clear cart after successful checkout
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cart-updated"));
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white border border-[#ddd8cc] rounded-3xl p-10 text-center shadow-sm space-y-6">

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <Image src="/images/brand/mad-fresh-logo.png" alt="Mad Fresh Kitchen" width={56} height={56}
              className="w-14 h-14 object-contain rounded-xl" />
          </div>

          {/* Check icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#e9f0e4] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#3d6b2a]" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-[#1e2d18]">Order Confirmed!</h1>
            <p className="text-[#7a7060] mt-2 text-lg leading-relaxed">
              Your order has been received. You&apos;ll get a confirmation email shortly with your order details.
            </p>
          </div>

          {/* Delivery info */}
          <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <Package size={18} className="text-[#3d6b2a] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#1e2d18] text-sm font-bold">Delivery Schedule</p>
                <p className="text-[#7a7060] text-xs mt-0.5">Valley-wide every Sunday. Order cutoff: Friday 12 noon.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link
              href="/dashboard"
              className="block w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold py-3.5 rounded-xl transition-colors text-center"
            >
              View My Dashboard
            </Link>
            <Link
              href="/menu"
              className="block w-full bg-[#f2efe8] hover:bg-[#e9f0e4] text-[#1e2d18] font-semibold py-3.5 rounded-xl transition-colors text-center border border-[#ddd8cc]"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingBag size={16} />
                Continue Shopping
              </span>
            </Link>
          </div>
        </div>

        <p className="text-center text-[#9a9080] text-xs mt-6">
          Questions? Email{" "}
          <a href="mailto:Order@EatMadFresh.com" className="text-[#3d6b2a] hover:underline">Order@EatMadFresh.com</a>
          {" "}or call{" "}
          <a href="tel:4803827755" className="text-[#3d6b2a] hover:underline">(480) 382-7755</a>
        </p>
      </div>
    </div>
  );
}
