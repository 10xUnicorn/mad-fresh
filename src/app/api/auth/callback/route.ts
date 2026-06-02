import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") || "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
      ? rawNext
      : "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      // Get user details
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const service = createServiceClient();

        // Check if this is an invited user who hasn't accepted yet
        const { data: pendingRole } = await service
          .from("user_roles")
          .select("id, accepted_at, invite_email")
          .eq("user_id", user.id)
          .is("accepted_at", null)
          .maybeSingle();

        if (pendingRole) {
          // Mark invite as accepted
          await service
            .from("user_roles")
            .update({ accepted_at: new Date().toISOString() })
            .eq("id", pendingRole.id);

          // Link the contact record to this auth user
          if (user.email) {
            await service
              .from("contacts")
              .update({ user_id: user.id })
              .eq("email", user.email)
              .is("user_id", null);
          }

          // Invited user needs to set a password — redirect to set-password
          // The invited user was authenticated via the invite link but has no password
          return NextResponse.redirect(
            new URL(`/set-password?redirect=${encodeURIComponent(next)}`, request.url)
          );
        }

        // Send welcome email for new signups (fire-and-forget)
        if (user.email && user.user_metadata) {
          const firstName = user.user_metadata.first_name || user.email.split("@")[0];
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-welcome-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}`,
              },
              body: JSON.stringify({
                email: user.email,
                firstName,
                userId: user.id,
              }),
            });
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
          }
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/login?error=Authentication%20failed", request.url)
      );
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
