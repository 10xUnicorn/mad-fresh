"use client";

import { MapPin, Truck, Clock, DollarSign } from "lucide-react";

const DELIVERY_ZONES = [
  { zone: "Tempe / Mesa / Chandler", time: "9:00 AM – 12:00 PM", fee: "Free over $75" },
  { zone: "Scottsdale / Phoenix", time: "10:00 AM – 1:00 PM", fee: "Free over $100" },
  { zone: "Gilbert / Glendale / Peoria", time: "11:00 AM – 2:00 PM", fee: "$5.99" },
  { zone: "Greater Valley", time: "By arrangement", fee: "Contact us" },
];

export default function DeliveryZoneMap() {
  return (
    <section className="py-16 bg-[#faf8f3] relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#3d6b2a] uppercase tracking-widest mb-2">Delivery</p>
          <h2 className="text-3xl font-black text-[#1e2d18] mb-3">Valley-Wide Delivery</h2>
          <p className="text-[#7a7060] max-w-xl mx-auto text-sm">
            Fresh meals delivered to your door every Sunday. Order by Friday at noon.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.06!2d-111.9!3d33.41!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDI0JzM2LjAiTiAxMTHCsDU0JzAwLjAiVw!5e0!3m2!1sen!2sus!4v1"
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mad Fresh Kitchen Location"
            />
          </div>

          {/* Delivery Zones */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-xl p-4 flex items-start gap-3">
              <Truck size={18} className="text-[#3d6b2a] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#1e2d18] text-sm font-semibold">Every Sunday</p>
                <p className="text-[#7a7060] text-xs">Cutoff: Friday 12 PM · Min order: $40</p>
              </div>
            </div>

            {DELIVERY_ZONES.map((zone) => (
              <div key={zone.zone} className="bg-white border border-[#ddd8cc] rounded-xl p-4 hover:border-[#3d6b2a]/40 transition">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#3d6b2a] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[#1e2d18] text-sm font-semibold">{zone.zone}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[#9a9080] text-xs flex items-center gap-1">
                        <Clock size={12} /> {zone.time}
                      </span>
                      <span className="text-[#3d6b2a] text-xs font-medium flex items-center gap-1">
                        <DollarSign size={12} /> {zone.fee}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
