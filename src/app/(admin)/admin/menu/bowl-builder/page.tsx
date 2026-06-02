import BowlBuilderManager from "@/components/admin/BowlBuilderManager";

export default function BowlBuilderPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2">Build Your Own Bowl</h1>
        <p className="text-[#7a7060]">
          Configure the step-by-step customization flow for customer bowl building
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <BowlBuilderManager />
      </div>
    </div>
  );
}
