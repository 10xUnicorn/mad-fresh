import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Auth check - only authenticated users
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check - only admin/super_admin/manager/staff may upload
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin", "manager", "staff"])
      .maybeSingle();

    if (!roleRow) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storeId = formData.get("storeId") as string;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!storeId) {
      return Response.json({ error: "No store ID provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return Response.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size — max 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Create a unique storage path
    const timestamp = Date.now();
    const originalName = file.name.toLowerCase().replace(/\s+/g, "-");
    const ext = originalName.split(".").pop() || "jpg";
    const random = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${random}.${ext}`;
    const storagePath = `${storeId}/${filename}`;

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to Supabase Storage using service client (bypasses RLS)
    const serviceClient = createServiceClient();
    const { error: uploadError } = await serviceClient.storage
      .from("media")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return Response.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = serviceClient.storage
      .from("media")
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData.publicUrl;

    // Save metadata to database
    const { data, error } = await serviceClient
      .from("media_assets")
      .insert({
        store_id: storeId,
        folder_id: folderId || null,
        filename,
        original_filename: file.name,
        file_path: storagePath,
        file_url: fileUrl,
        file_type: file.type,
        mime_type: file.type,
        file_size: fileBuffer.length,
        width: null,
        height: null,
        title: originalName.replace(/\.[^.]+$/, "").replace(/-/g, " "),
        alt_text: null,
        description: null,
        tags: [],
        is_featured: false,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return Response.json(
        { error: "Failed to save asset metadata" },
        { status: 500 }
      );
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
