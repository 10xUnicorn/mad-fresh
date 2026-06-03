import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Fetch authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Fetch user's role from user_roles table
  let userRole = "member"; // default role
  try {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role) {
      userRole = roleData.role;
    }
  } catch (error) {
    // If role query fails, default to 'member'
    console.error("Error fetching user role:", error);
  }

  // Block non-admin roles from accessing admin pages
  const ADMIN_ROLES = ["admin", "super_admin", "manager", "staff", "driver"];
  if (!ADMIN_ROLES.includes(userRole)) {
    redirect("/dashboard");
  }

  // Prepare user data
  const userData = {
    id: user.id,
    email: user.email || "",
    first_name: user.user_metadata?.first_name || "User",
  };

  return <AdminShell user={userData} role={userRole}>{children}</AdminShell>;
}
