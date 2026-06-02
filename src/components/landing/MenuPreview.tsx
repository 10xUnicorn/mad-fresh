import Link from "next/link";

const FEATURED = [
  { name: "Chipotle Crema Bowl", cal: "420", protein: "42g", price: "$14.99", img: "/images/menu/chipotle-crema-bowl.png" },
  { name: "Grass-Fed Flank Steak", cal: "460", protein: "44g", price: "$19.99", img: "/images/menu/flank-steak-43c463c.jpeg" },
  { name: "Loaded Breakfast Burritos", cal: "380", protein: "34g", price: "$13.99", img: "/images/menu/breakfast-burritos-10-500x500.jpg" },
  { name: "Sautéed Green Beans", cal: "220", protein: "18g", price: "$12.99", img: "/images/menu/sauteed-green-beans-s3.jpeg" },
];

export default function MenuPreview() {
  return (
    <section id="menu-preview" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-2">This Week&apos;s Menu</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1e2d18] tracking-tight">
              Chef-Crafted. Fresh Every Week.
            </h2>
          </div>
          <Link href="/menu" className="text-sm font-bold text-[#3d6b2a] hover:underline whitespace-nowrap self-start sm:self-auto">
            View Full Menu →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURED.map((item) => (
            <Link key={item.name} href="/menu" className="group bg-[#faf8f3] border border-[#ddd8cc] rounded-2xl overflow-hidden hover:border-[#3d6b2a] hover:shadow-md transition-all">
              <div className="aspect-square overflow-hidden bg-[#e9f0e4]">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#1e2d18] mb-1 leading-snug">{item.name}</h3>
                <p className="text-xs text-[#9a9080] mb-3">{item.cal} cal · {item.protein} protein</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#3d6b2a]">{item.price}</span>
                  <span className="text-xs font-bold text-[#3d6b2a] bg-[#e9f0e4] px-2.5 py-1 rounded-full">
                    Add to Order
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10 pt-8 border-t border-[#ddd8cc]">
          {[
            { src: "/images/brand/badge-organic.png", alt: "Organic" },
            { src: "/images/brand/badge-fresh.png", alt: "Fresh" },
            { src: "/images/brand/badge-gluten-free.jpg", alt: "Gluten Free Options" },
          ].map((badge) => (
            <img
              key={badge.alt}
              src={badge.src}
              alt={badge.alt}
              className="h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          ))}
          <div className="flex items-center gap-2 bg-[#fff8ee] border border-[#f0ddb8] rounded-full px-4 py-2">
            <span className="text-xs font-bold text-[#b45309]">No Seed Oils · Non-GMO · Low Sodium</span>
          </div>
        </div>
      </div>
    </section>
  );
}
