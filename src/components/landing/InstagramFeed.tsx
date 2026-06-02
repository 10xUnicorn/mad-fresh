"use client";

import { Camera, ExternalLink } from "lucide-react";

export default function InstagramFeed() {
  const instagramUrl = "https://instagram.com/eatmadfresh";

  const images = [
    { src: "/images/menu/chipotle-crema-bowl.png", alt: "Chipotle Crema Bowl" },
    { src: "/images/menu/screenshot-2023-09-12-at-3.02.56-pm.png", alt: "Salsa Verde Chicken" },
    { src: "/images/menu/screen-shot-2022-10-06-at-1.01.57-am.png", alt: "Grilled Citrus Chicken" },
    { src: "/images/menu/flank-steak-43c463c.jpeg", alt: "Grass-Fed Flank Steak" },
    { src: "/images/menu/breakfast-burritos-10-500x500.jpg", alt: "Loaded Breakfast Burritos" },
    { src: "/images/menu/screenshot-2025-11-28-at-3.38.10-pm.png", alt: "Sauteed Veggie Egg Bake" },
    { src: "/images/menu/screen-shot-2022-10-06-at-12.03.23-am.png", alt: "Roasted Sweet Potato Bites" },
    { src: "/images/menu/sauteed-green-beans-s3.jpeg", alt: "Sauteed Green Beans" },
  ];

  return (
    <section className="bg-[#faf8f3] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera size={32} className="text-[#3d6b2a]" />
            <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18]">
              Fresh From Our Kitchen
            </h2>
          </div>
          <p className="text-[#7a7060] mb-2">
            Follow @eatmadfresh for daily meal inspiration
          </p>
          <p className="text-xs text-[#9a9080]">
            Content from @eatmadfresh
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {images.map((image, i) => (
            <a
              key={i}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square overflow-hidden rounded-lg group cursor-pointer"
            >
              <div className="relative w-full h-full">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <Camera size={18} />
                    View on Instagram
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Instagram CTA Button */}
        <div className="flex justify-center">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
          >
            <Camera size={20} />
            Follow @eatmadfresh on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
