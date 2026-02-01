import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import type { GenerateMmsCommand } from "../../../src/types.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function for generating and sending an MMS.
 * This function orchestrates the entire business logic flow.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    // The admin client is required to bypass RLS for certain operations
    // like checking global stats or when acting on behalf of a user.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 2. Authenticate the user
    // Verifies the JWT from the Authorization header to get the user's data.
    const { data: { user }, error: userError } = await supabaseAdmin.auth
      .getUser(
        req.headers.get("Authorization")!.replace("Bearer ", ""),
      );

    if (userError || !user) {
      console.error("Authentication error:", userError?.message);
      return new Response(
        `<div id="notification-area" class="alert alert-error">Błąd autoryzacji.</div>`,
        { status: 401, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 3. Validate the request payload
    // Ensures the incoming data is valid before proceeding.
    const command: GenerateMmsCommand = await req.json();
    const { prompt } = command;

    if (!prompt) {
      return new Response(
        `<div id="notification-area" class="alert alert-warning">Opis nie może być pusty.</div>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    if (prompt.length > 300) {
      return new Response(
        `<div id="notification-area" class="alert alert-warning">Opis jest za długi (maks. 300 znaków).</div>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 4. Check user and global limits
    // 4.1 Check user's daily limit by calling the RPC function
    const { data: userMmsCount, error: userCountError } = await supabaseAdmin.rpc(
      "count_user_mms_today",
      { p_user_id: user.id },
    );

    if (userCountError) {
      console.error("Error checking user limit:", userCountError.message);
      throw new Error("Failed to verify user limit.");
    }

    if (userMmsCount >= 5) {
      return new Response(
        `<div id="notification-area" class="alert alert-warning">Osiągnięto dzienny limit 5 MMS. Spróbuj ponownie jutro.</div>`,
        { status: 429, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 4.2 Check global daily limit
    const today = new Date().toISOString().split("T")[0];
    const { data: globalStats, error: globalStatsError } = await supabaseAdmin
      .from("daily_global_stats")
      .select("mms_sent_count")
      .eq("day", today)
      .single();

    // Ignore "PGRST116" which means no row was found for today, which is a valid case.
    if (globalStatsError && globalStatsError.code !== "PGRST116") {
      console.error("Error checking global limit:", globalStatsError.message);
      throw new Error("Failed to verify global limit.");
    }

    if (globalStats && globalStats.mms_sent_count >= 20) {
      return new Response(
        `<div id="notification-area" class="alert alert-warning">Osiągnięto globalny limit wiadomości na dziś. Spróbuj ponownie jutro.</div>`,
        { status: 429, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 5. AI Image Generation (Placeholder)
    // In a real implementation, this would call the Google AI API.
    // We will simulate a failure for now to demonstrate error handling.
    const simulateAiFailure = true;
    let imageData: Uint8Array;

    if (simulateAiFailure) {
      console.error("AI image generation failed for prompt:", prompt);
      // 5.1 Log the generation failure to the database
      const { error: logError } = await supabaseAdmin
        .from("mms_history")
        .insert({
          user_id: user.id,
          prompt: prompt,
          status: "generation_failed",
          image_data: new Uint8Array(), // Use an empty byte array for failures
        });

      if (logError) {
        console.error("Failed to log generation failure:", logError.message);
      }

      return new Response(
        `<div id="notification-area" class="alert alert-error">Nie udało się wygenerować grafiki. Spróbuj opisać ją inaczej.</div>`,
        { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    } else {
      // This block would contain the actual AI API call
      // const response = await fetch("https://api.google.ai/...", { ... });
      // imageData = new Uint8Array(await response.arrayBuffer());
    }

    // Placeholder for the next steps: MMS sending and success logging
    return new Response("Not implemented", { status: 501 });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      `<div id="notification-area" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});