import { redirect } from "next/navigation";

export const metadata = { title: "Achievements | Mad Fresh Kitchen" };

export default function AchievementsPage() {
  redirect("/rewards");
}
