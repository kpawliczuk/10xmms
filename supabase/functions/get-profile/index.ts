import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import type { ProfileDto } from "../../../src/types.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function to get the current user's profile.
 * This function acts as a proxy to the auto-generated PostgREST API.
 * It fetches the user's profile data as JSON and is responsible for
 * transforming it into an HTML fragment suitable for HTMX.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Client
    // A user-context client is created to ensure all database
    // operations respect the Row-Level Security policies.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // 2. Authenticate the user and get their ID
    // This step verifies the JWT and retrieves the user object.
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError?.message);
      return new Response(
        `<div id="profile-view" class="alert alert-error">Błąd autoryzacji. Nie można załadować profilu.</div>`,
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        },
      );
    }

    // 3. Fetch profile data from the database
    // The request is made to the auto-generated PostgREST endpoint.
    // RLS automatically ensures the user can only fetch their own profile.
    const { data, error: dbError } = await supabaseClient
      .from("profiles")
      .select("id, username, phone_number")
      .eq("id", user.id)
      .single<ProfileDto>();

    if (dbError) {
      console.error("Database error fetching profile:", dbError.message);
      // RLS will return an empty result if not found, but we handle other potential DB errors.
      return new Response(
        `<div id="profile-view" class="alert alert-error">Nie udało się załadować profilu.</div>`,
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        },
      );
    }

    // Placeholder for the next step: Rendering the HTML fragment
    const profileHtml = `<div>Hello, ${data?.username || "User"}!</div>`; // Temporary

    return new Response(profileHtml, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      `<div id="profile-view" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});