import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart, TrendingUp } from "lucide-react";

export const metadata = { title: "My Donations | Mad Fresh Kitchen" };

export default async function DonationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/donations");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_meals_donated")
    .eq("id", user.id)
    .single();

  // Fetch donation history
  const { data: donations } = await supabase
    .from("donations")
    .select("id, amount, meals_equivalent, type, status, created_at")
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const totalMeals = profile?.total_meals_donated || 0;
  const totalDonated = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#1e2d18]">My Donations</h1>
        <p className="text-[#7a7060] mt-1">Your impact on the community</p>
      </div>

      {/* Impact Card */}
      <div className="bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-2xl p-8">
        <Heart size={40} className="text-[#3d6b2a] mb-4" />
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-4xl font-black text-[#1e2d18]">{totalMeals}</p>
            <p className="text-[#7a7060] text-sm">Meals Donated</p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#1e2d18]">${totalDonated.toFixed(2)}</p>
            <p className="text-[#7a7060] text-sm">Total Contributed</p>
          </div>
        </div>
      </div>

      {/* Donation History */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-[#1e2d18] font-bold">Donation History</h2>
        </div>
        {donations && donations.length > 0 ? (
          <div className="divide-y divide-[#ede9e2]">
            {donations.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Heart size={16} className="text-[#3d6b2a]" />
                  <div>
                    <p className="text-[#1e2d18] text-sm font-semibold">{d.meals_equivalent} meal{d.meals_equivalent > 1 ? "s" : ""}</p>
                    <p className="text-[#9a9080] text-xs">
                      {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{d.type?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#1e2d18] font-semibold text-sm">${Number(d.amount).toFixed(2)}</p>
                  <span className={`text-xs ${d.status === "delivered" ? "text-green-600" : "text-yellow-600"}`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 pb-8 text-center py-8">
            <Heart size={32} className="text-[#9a9080] mx-auto mb-3" />
            <p className="text-[#7a7060] text-sm">No donations yet</p>
            <p className="text-[#9a9080] text-xs mt-1">Add a meal donation to your next order to start giving back</p>
          </div>
        )}
      </div>
    </div>
  );
}
