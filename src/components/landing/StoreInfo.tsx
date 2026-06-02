import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function StoreInfo() {
  return (
    <section id="store-info" className="py-16 bg-[#faf8f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 sm:p-10 shadow-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

            <div className="space-y-3">
              <div className="w-10 h-10 bg-[#e9f0e4] rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-[#3d6b2a]" />
              </div>
              <h3 className="font-black text-[#1e2d18] text-sm">Our Kitchen</h3>
              <p className="text-sm text-[#7a7060] leading-relaxed">
                455 S 48th St<br />
                Tempe, Arizona 85281
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-[#e9f0e4] rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-[#3d6b2a]" />
              </div>
              <h3 className="font-black text-[#1e2d18] text-sm">Hours</h3>
              <div className="space-y-1 text-sm text-[#7a7060]">
                <p>Mon – Sat: 8:00 am – 6:00 pm</p>
                <p>Sun: 11:00 am – 3:00 pm</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-[#e9f0e4] rounded-xl flex items-center justify-center">
                <Phone size={20} className="text-[#3d6b2a]" />
              </div>
              <h3 className="font-black text-[#1e2d18] text-sm">Call or Text</h3>
              <a href="tel:4803827755" className="text-sm text-[#3d6b2a] font-semibold hover:underline">
                (480) 382-7755
              </a>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-[#e9f0e4] rounded-xl flex items-center justify-center">
                <Mail size={20} className="text-[#3d6b2a]" />
              </div>
              <h3 className="font-black text-[#1e2d18] text-sm">Email Us</h3>
              <a href="mailto:Order@EatMadFresh.com" className="text-sm text-[#3d6b2a] font-semibold hover:underline break-all">
                Order@EatMadFresh.com
              </a>
              <p className="text-xs text-[#9a9080]">Order deadline: Friday 12pm</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
