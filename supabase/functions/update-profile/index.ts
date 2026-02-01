import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import type { UpdateProfileCommand } from "../../../src/types.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function to update the current user's profile.
 * This function acts as a secure proxy to the auto-generated PostgREST API.
 * It validates the input and handles database responses, transforming them
 * into user-friendly HTML fragments for HTMX.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Client with user's auth context
    // This ensures all subsequent operations respect RLS policies.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // 2. Authenticate the user
    // This step is crucial to identify the user and prevent unauthorized access.
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError?.message);
      return new Response(
        `<div id="profile-update-error" class="alert alert-error">Błąd autoryzacji.</div>`,
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        },
      );
    }

    // 3. Validate the request payload
    // We ensure the request body is valid before attempting a database operation.
    let command: UpdateProfileCommand;
    try {
      command = await req.json();
    } catch {
      return new Response(
        `<div id="profile-update-error" class="alert alert-error">Nieprawidłowe dane żądania.</div>`,
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        },
      );
    }

    if (!command.username || typeof command.username !== "string") {
      return new Response(
        `<div id="profile-update-error" class="alert alert-error">Nazwa użytkownika jest wymagana.</div>`,
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        },
      );
    }

    // 4. Perform the database update
    // The .eq('id', user.id) clause works with RLS to ensure
    // users can only update their own profile. We also update the 'updated_at' timestamp.
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ username: command.username, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    // 5. Handle database errors, specifically unique constraint violations
    if (updateError) {
      console.error("Database update error:", updateError.message);
      // PostgreSQL error code for unique violation is "23505"
      if (updateError.code === "23505") {
        return new Response(
          `<div id="profile-update-error" class="alert alert-error">Ta nazwa użytkownika jest już zajęta.</div>`,
          {
            status: 409, // Conflict
            headers: { ...corsHeaders, "Content-Type": "text/html" },
          },
        );
      }

      return new Response(
        `<div id="profile-update-error" class="alert alert-error">Nie udało się zaktualizować profilu.</div>`,
        { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 6. Return a success response with an HX-Trigger header
    // This tells HTMX to trigger a custom event that can be used to refresh other parts of the UI,
    // like the profile view, ensuring the user sees the updated data.
    return new Response(
      `<div id="profile-update-error" class="alert alert-success">Profil został pomyślnie zaktualizowany.</div>`, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html", "HX-Trigger": "profileUpdated" },
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      `<div id="profile-update-error" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});