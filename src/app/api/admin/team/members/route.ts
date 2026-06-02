import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";
const ORG_ID = "a0000000-0000-0000-0000-000000000001";

/**
 * Verify the calling user is admin or super_admin.
 * Uses the user's JWT (cookie-based auth) for verification.
 */
async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check role — use service client to bypass RLS for the role check itself
  const service = createServiceClient();
  const { data: roleData } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .single();

  if (!roleData || !["super_admin", "admin"].includes(roleData.role)) {
    return null;
  }

  return user;
}

function getBaseUrl() {
  // Production URL first, then Vercel auto-URL, then localhost fallback
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://mad-fresh.vercel.app";
}

// ── POST: Add a new team member ──
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, firstName, lastName, phone, role, permissions } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const service = createServiceClient();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists — profile table first (fast), then auth
    const { data: existingProfile } = await service
      .from("user_profiles")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    let existingAuthUser: { id: string; email?: string } | null = existingProfile
      ? { id: existingProfile.id, email: existingProfile.email }
      : null;

    let userId: string;
    let isNewUser = false;

    if (existingAuthUser) {
      userId = existingAuthUser.id;

      // Check if they already have a role
      const { data: existingRole } = await service
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("store_id", STORE_ID)
        .single();

      if (existingRole) {
        return NextResponse.json(
          { error: "This user already has a role assigned" },
          { status: 409 }
        );
      }

      // Update their profile if name/phone provided
      if (firstName || lastName || phone) {
        await service
          .from("user_profiles")
          .update({
            ...(firstName && { first_name: firstName }),
            ...(lastName && { last_name: lastName }),
            ...(phone && { phone }),
          })
          .eq("id", userId);
      }
    } else {
      // 2. New user — invite via Supabase Auth (sends magic link email)
      isNewUser = true;

      const baseUrl = getBaseUrl();

      const { data: inviteData, error: inviteError } =
        await service.auth.admin.inviteUserByEmail(normalizedEmail, {
          data: {
            first_name: firstName || "",
            last_name: lastName || "",
            phone: phone || "",
            invited_role: role,
          },
          redirectTo: `${baseUrl}/api/auth/callback?next=/set-password`,
        });

      if (inviteError) {
        console.error("Invite error:", inviteError);
        return NextResponse.json(
          { error: `Failed to invite user: ${inviteError.message}` },
          { status: 500 }
        );
      }

      userId = inviteData.user.id;

      // Create their profile
      await service.from("user_profiles").upsert({
        id: userId,
        email: normalizedEmail,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        account_status: "active",
      });
    }

    // 3. Create role assignment
    const { data: newRole, error: roleError } = await service
      .from("user_roles")
      .insert({
        user_id: userId,
        organization_id: ORG_ID,
        store_id: STORE_ID,
        role,
        permissions: permissions || {},
        is_active: true,
        invited_by: admin.id,
        invited_at: new Date().toISOString(),
        accepted_at: isNewUser ? null : new Date().toISOString(),
        invite_email: normalizedEmail,
      })
      .select()
      .single();

    if (roleError) {
      console.error("Role insert error:", roleError);
      return NextResponse.json(
        { error: `Failed to assign role: ${roleError.message}` },
        { status: 500 }
      );
    }

    // 4. If existing user, send a notification email about their new role
    if (!isNewUser) {
      await sendRoleAssignedEmail(service, normalizedEmail, firstName || "there", role);
    }

    // 5. Add to contacts table if not already there
    await service
      .from("contacts")
      .upsert(
        {
          store_id: STORE_ID,
          email: normalizedEmail,
          first_name: firstName || "Team Member",
          last_name: lastName || null,
          phone: phone || null,
          source: "import" as const,
          contact_type: "vendor",
          tags: JSON.stringify(["team_member"]),
        },
        { onConflict: "store_id,email", ignoreDuplicates: true }
      );

    // Fetch the profile for the response
    const { data: profile } = await service
      .from("user_profiles")
      .select("id, email, first_name, last_name, phone")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      success: true,
      member: {
        id: newRole.id,
        user_id: userId,
        role,
        is_active: true,
        permissions: permissions || {},
        invited_at: newRole.invited_at,
        accepted_at: newRole.accepted_at,
        user_profiles: profile,
      },
      isNewUser,
      message: isNewUser
        ? `Invite sent to ${normalizedEmail}`
        : `${firstName || normalizedEmail} added to the team`,
    });
  } catch (error: any) {
    console.error("Team member POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PUT: Update team member ──
export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, userId, role, permissions, firstName, lastName, phone, isActive } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const service = createServiceClient();

    // Update role assignment
    const updateData: Record<string, any> = {};
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.is_active = isActive;

    if (Object.keys(updateData).length > 0) {
      const { error } = await service
        .from("user_roles")
        .update(updateData)
        .eq("id", memberId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Update profile if fields provided
    if (userId && (firstName !== undefined || lastName !== undefined || phone !== undefined)) {
      const profileUpdate: Record<string, any> = {};
      if (firstName !== undefined) profileUpdate.first_name = firstName || null;
      if (lastName !== undefined) profileUpdate.last_name = lastName || null;
      if (phone !== undefined) profileUpdate.phone = phone || null;

      await service.from("user_profiles").update(profileUpdate).eq("id", userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Team member PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE: Deactivate team member ──
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const service = createServiceClient();

    // Prevent deactivating yourself
    const { data: targetRole } = await service
      .from("user_roles")
      .select("user_id")
      .eq("id", memberId)
      .single();

    if (targetRole?.user_id === admin.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    const { error } = await service
      .from("user_roles")
      .update({ is_active: false })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Team member DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Branded email for existing users getting a new role ──
async function sendRoleAssignedEmail(
  service: ReturnType<typeof createServiceClient>,
  email: string,
  firstName: string,
  role: string
) {
  // We use Supabase's built-in email for invites.
  // For existing users, we log it — in production, wire up SendGrid/Resend here.
  console.log(`[Team] Role "${role}" assigned to existing user ${email}`);
}
