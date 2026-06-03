import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerShell from "@/components/customer/CustomerShell";
import ComingSoonPage from "@/components/customer/ComingSoonPage";
import ImpersonationBanner from "@/components/customer/ImpersonationBanner";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // Check if this user is an admin (needed for impersonation + bypass)
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = roleData?.role && ["super_admin", "admin", "manager"].includes(roleData.role);

  // Fetch the real user's profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Build user data — may be overridden by impersonation below
  let userData = {
    id: user.id,
    email: user.email || "",
    first_name: profile?.first_name || user.user_metadata?.first_name || "Friend",
    last_name: profile?.last_name || user.user_metadata?.last_name || "",
    avatar_url: profile?.avatar_url || null,
    stripe_customer_id: profile?.stripe_customer_id || null,
  };

  let impersonating: { id: string; name: string } | null = null;

  // Check account activation status (skip for admins)
  const accountStatus = profile?.account_status || "pending";

  if (accountStatus !== "active" && !isAdmin) {
    // Check if app has launched (auto-activate if so)
    const { data: launchSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "launch_mode")
      .single();

    const isLaunched = launchSetting?.value?.is_launched === true;

    if (isLaunched && launchSetting?.value?.auto_activate_after_launch) {
      await supabase
        .from("user_profiles")
        .update({ account_status: "active" })
        .eq("id", user.id);
    } else if (!isLaunched && accountStatus === "pending") {
      return <ComingSoonPage user={{ first_name: userData.first_name, email: userData.email }} />;
    } else if (accountStatus === "suspended" || accountStatus === "deactivated") {
      return <ComingSoonPage user={{ first_name: userData.first_name, email: userData.email }} />;
    }
  }

  return (
    <CustomerShell user={userData} isAdmin={isAdmin || false} impersonating={impersonating}>
      {children}
    </CustomerShell>
  );
}
