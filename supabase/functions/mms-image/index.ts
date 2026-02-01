import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function to securely serve an MMS image.
 * It verifies that the requesting user is the owner of the image.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageId = url.searchParams.get("id");

    if (!imageId) {
      return new Response("Image ID is required", { status: 400 });
    }

    // 1. Create a Supabase client with the user's auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // 2. Fetch the image data. RLS policy will ensure the user owns this image.
    const { data, error } = await supabaseClient
      .from("mms_history")
      .select("image_data")
      .eq("id", imageId)
      .single();

    if (error || !data?.image_data) {
      // This will trigger if the user doesn't own the image (due to RLS) or if it doesn't exist.
      return new Response("Image not found or access denied", { status: 404 });
    }

    // 3. Return the binary image data
    return new Response(data.image_data, {
      headers: { ...corsHeaders, "Content-Type": "image/jpeg" },
    });
  } catch (error) {
    console.error("Error in mms-image function:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});