import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function generateCodeSuggestions(firstName: string): string[] {
  const name = firstName.trim();
  const upper = name.toUpperCase();
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  // Truncated version (max 5 chars)
  const short = capitalized.length > 5 ? capitalized.slice(0, 5) : capitalized;

  const suggestions = [
    `Mad${capitalized}`,
    `${capitalized}Fresh`,
    `Fresh${short}`,
    `${short}GoFresh`,
    `Mad${short}`,
  ];

  // Deduplicate while preserving order
  return [...new Set(suggestions)];
}

// GET: Generate code suggestions based on auth user's name
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("user_profiles")
      .select("first_name, referral_code")
      .eq("id", user.id)
      .single();

    const firstName = profile?.first_name || "Friend";
    const suggestions = generateCodeSuggestions(firstName);

    return NextResponse.json({
      suggestions,
      currentCode: profile?.referral_code || null,
    });
  } catch (err) {
    console.error("GET /api/referrals/code error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Save selected referral code to user_profiles
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const sanitized = code.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    if (sanitized.length < 3) {
      return NextResponse.json({ error: "Code must be at least 3 characters" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Check uniqueness (case-insensitive)
    const { data: existing } = await serviceClient
      .from("user_profiles")
      .select("id")
      .ilike("referral_code", sanitized)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Code already taken — try another!" }, { status: 409 });
    }

    const { error: updateError } = await serviceClient
      .from("user_profiles")
      .update({ referral_code: sanitized })
      .eq("id", user.id);

    if (updateError) {
      console.error("Referral code update error:", updateError);
      return NextResponse.json({ error: "Failed to save code" }, { status: 500 });
    }

    return NextResponse.json({ code: sanitized });
  } catch (err) {
    console.error("PUT /api/referrals/code error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
