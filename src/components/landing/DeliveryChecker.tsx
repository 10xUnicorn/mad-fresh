"use client";
import { useState } from "react";
import { MapPin, CheckCircle, XCircle } from "lucide-react";

/**
 * Real delivery boundary — exported from Ty's Google My Maps ("Untitled layer.kml").
 * 16-point polygon, [lng, lat]. Covers West Valley (Surprise/Sun City) south to
 * Maricopa/Queen Creek and east through Mesa/Gilbert.
 * We check membership via point-in-polygon against a ZIP centroid.
 */
const DELIVERY_POLYGON: [number, number][] = [
  [-112.1272912, 33.7887462],
  [-112.1998119, 33.7886464],
  [-112.2860652, 33.7679492],
  [-112.4189664, 33.6797161],
  [-112.7027001, 33.673394],
  [-112.7047751, 33.5498048],
  [-112.7027002, 33.4387871],
  [-112.6244226, 33.3665605],
  [-112.4478395, 33.2904902],
  [-112.1314112, 33.2850904],
  [-111.8965783, 33.1932019],
  [-111.62604, 33.1966495],
  [-111.6219201, 33.4284727],
  [-111.7125573, 33.647104],
  [-111.8883386, 33.7168121],
  [-112.1272912, 33.7887462],
];

/**
 * Approximate centroids for Phoenix-metro ZIP codes, [lng, lat].
 * Used to translate a typed ZIP into a coordinate for the polygon test.
 * Covers the cities inside (and just outside) the delivery boundary.
 */
const ZIP_CENTROIDS: Record<string, [number, number]> = {
  // Phoenix (central / south / west)
  "85003": [-112.082, 33.451], "85004": [-112.069, 33.452], "85007": [-112.087, 33.451],
  "85008": [-111.984, 33.466], "85009": [-112.119, 33.447], "85015": [-112.105, 33.508],
  "85017": [-112.111, 33.514], "85019": [-112.121, 33.508], "85021": [-112.085, 33.557],
  "85023": [-112.107, 33.629], "85027": [-112.107, 33.679], "85029": [-112.121, 33.598],
  "85031": [-112.166, 33.495], "85033": [-112.211, 33.494], "85035": [-112.181, 33.467],
  "85037": [-112.255, 33.494], "85040": [-112.043, 33.397], "85041": [-112.099, 33.391],
  "85043": [-112.171, 33.41], "85044": [-112.026, 33.336], "85045": [-112.099, 33.302],
  "85048": [-112.04, 33.31], "85050": [-111.99, 33.683], "85051": [-112.135, 33.557],
  "85053": [-112.139, 33.62], "85085": [-112.105, 33.74], "85086": [-112.13, 33.81],
  // Tempe
  "85281": [-111.926, 33.425], "85282": [-111.93, 33.392], "85283": [-111.937, 33.366],
  "85284": [-111.92, 33.337],
  // Scottsdale
  "85250": [-111.9, 33.5], "85251": [-111.918, 33.494], "85254": [-111.95, 33.62],
  "85257": [-111.917, 33.461], "85258": [-111.89, 33.566], "85260": [-111.888, 33.61],
  "85262": [-111.78, 33.78], "85266": [-111.92, 33.78],
  // Mesa
  "85201": [-111.84, 33.44], "85202": [-111.87, 33.39], "85203": [-111.81, 33.45],
  "85204": [-111.79, 33.4], "85205": [-111.72, 33.43], "85206": [-111.71, 33.4],
  "85207": [-111.64, 33.44], "85208": [-111.64, 33.4], "85209": [-111.63, 33.38],
  "85210": [-111.84, 33.39], "85212": [-111.63, 33.32], "85213": [-111.77, 33.46],
  "85215": [-111.7, 33.48],
  // Chandler
  "85224": [-111.87, 33.32], "85225": [-111.83, 33.31], "85226": [-111.91, 33.31],
  "85248": [-111.86, 33.25], "85249": [-111.8, 33.24],
  // Gilbert
  "85233": [-111.81, 33.35], "85234": [-111.77, 33.36], "85295": [-111.74, 33.3],
  "85296": [-111.76, 33.33], "85297": [-111.74, 33.27], "85298": [-111.76, 33.24],
  // Glendale
  "85301": [-112.18, 33.53], "85302": [-112.2, 33.57], "85303": [-112.22, 33.53],
  "85304": [-112.2, 33.6], "85305": [-112.24, 33.52], "85306": [-112.2, 33.63],
  "85307": [-112.28, 33.53], "85308": [-112.2, 33.66], "85310": [-112.21, 33.7],
  // Peoria
  "85345": [-112.25, 33.58], "85381": [-112.24, 33.61], "85382": [-112.27, 33.65],
  "85383": [-112.27, 33.72], "85345b": [-112.25, 33.58],
  // Surprise / Sun City
  "85351": [-112.28, 33.6], "85373": [-112.3, 33.68], "85374": [-112.37, 33.63],
  "85375": [-112.38, 33.67], "85379": [-112.38, 33.6], "85388": [-112.4, 33.58],
  // Avondale / Goodyear / Litchfield Park / Buckeye
  "85323": [-112.32, 33.43], "85338": [-112.36, 33.43], "85340": [-112.4, 33.5],
  "85353": [-112.3, 33.43], "85392": [-112.3, 33.48], "85395": [-112.4, 33.48],
  "85326": [-112.58, 33.43], "85396": [-112.6, 33.45],
  // Queen Creek / San Tan Valley / Maricopa
  "85140": [-111.6, 33.24], "85142": [-111.63, 33.24], "85143": [-111.55, 33.18],
  "85138": [-111.98, 33.05], "85139": [-112.0, 33.0],
};

function pointInPolygon([x, y]: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

type Result = "yes" | "no" | "unknown" | null;

export default function DeliveryChecker() {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<Result>(null);

  const check = () => {
    const clean = zip.trim().replace(/\D/g, "").slice(0, 5);
    if (clean.length < 5) return;
    const centroid = ZIP_CENTROIDS[clean];
    if (!centroid) {
      setResult("unknown");
      return;
    }
    setResult(pointInPolygon(centroid, DELIVERY_POLYGON) ? "yes" : "no");
  };

  return (
    <section id="delivery" className="py-14 bg-white border-y border-[#ddd8cc]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin size={18} className="text-[#3d6b2a]" />
          <p className="text-sm font-bold text-[#3d6b2a] uppercase tracking-[.1em]">
            Valleywide Delivery — Every Sunday
          </p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1e2d18] mb-2">
          Do We Deliver to Your Area?
        </h2>
        <p className="text-[#7a7060] text-sm mb-6">
          Enter your ZIP code to instantly check — before you add anything to your cart.
        </p>

        <div className="flex gap-3 max-w-sm mx-auto">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter ZIP code"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
              setResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            maxLength={5}
            className="flex-1 px-4 py-3 text-base rounded-xl bg-[#faf8f3] border border-[#ddd8cc] text-[#1e2d18] placeholder:text-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition"
          />
          <button
            onClick={check}
            className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Check
          </button>
        </div>

        {result === "yes" && (
          <div className="mt-5 inline-flex items-center gap-2 bg-[#e9f0e4] border border-[#3d6b2a]/20 text-[#3d6b2a] px-5 py-3 rounded-full font-semibold text-sm">
            <CheckCircle size={18} />
            Great news — we deliver to {zip}! Order by Friday noon for Sunday delivery.
          </div>
        )}
        {result === "no" && (
          <div className="mt-5 space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#fef2f2] border border-[#fca5a5] text-[#dc2626] px-5 py-3 rounded-full font-semibold text-sm">
              <XCircle size={18} />
              We don&apos;t deliver to {zip} yet — but pickup is always available!
            </div>
            <p className="text-xs text-[#9a9080]">
              455 S 48th St, Tempe AZ 85281 · Pickup Mon–Sat 8am–6pm, Sun 11am–3pm
            </p>
          </div>
        )}
        {result === "unknown" && (
          <div className="mt-5 space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#fff8ee] border border-[#f0ddb8] text-[#b45309] px-5 py-3 rounded-full font-semibold text-sm">
              <MapPin size={18} />
              We&apos;re not sure about {zip} — give us a call and we&apos;ll confirm!
            </div>
          </div>
        )}

        <p className="text-xs text-[#9a9080] mt-4">
          Free delivery for active subscribers on orders over $100. Questions?{" "}
          <a href="tel:4803827755" className="text-[#3d6b2a] hover:underline">
            (480) 382-7755
          </a>
        </p>
      </div>
    </section>
  );
}
