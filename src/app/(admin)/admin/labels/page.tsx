import { Tag, Printer, Package } from "lucide-react";

export default function LabelsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <Tag size={32} className="text-[#3d6b2a]" />
          Label Printing
        </h1>
        <p className="text-[#7a7060]">Print nutrition and order labels for meal containers</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <Printer size={48} className="mx-auto mb-4 text-[#9a9080]" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Label Printing Coming Soon</h2>
        <p className="text-[#9a9080] max-w-lg mx-auto mb-8">
          When orders start flowing in, this page will generate printable labels for each meal container with customer name, meal details, macros, allergens, and order info.
        </p>

        {/* Label Preview */}
        <div className="max-w-sm mx-auto bg-white rounded-xl p-5 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#3d6b2a] tracking-wider">MAD FRESH KITCHEN</span>
            <span className="text-xs text-[#9a9080]">#MF-0001</span>
          </div>
          <div className="border-b border-gray-200 pb-2 mb-2">
            <p className="font-bold text-gray-900 text-sm">Teriyaki Chicken Bowl</p>
            <p className="text-xs text-[#9a9080]">Customer: Jane Smith</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center mb-2">
            {[
              { label: "CAL", value: "520" },
              { label: "PRO", value: "42g" },
              { label: "CARB", value: "58g" },
              { label: "FAT", value: "14g" },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded p-1.5">
                <p className="text-xs font-bold text-gray-900">{m.value}</p>
                <p className="text-[10px] text-[#9a9080]">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#9a9080]">
            <Package size={10} />
            <span>Packed: {new Date().toLocaleDateString()}</span>
            <span>•</span>
            <span>Use by: {new Date(Date.now() + 5 * 86400000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
