import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function for handling user registration.
 * This function will validate input and use Supabase Auth to sign up a new user.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // The full implementation will be added in the next steps.
    // This includes:
    // - Parsing the request body (RegisterCommand).
    // - Validating the data (passwords match, terms accepted).
    // - Calling supabase.auth.signUp().
    // - Handling success (HX-Redirect) and errors (4xx/5xx with HTML).

    // For now, we return a placeholder response to test the HTMX connection.
    console.log("Register function invoked.");
    const body = await req.json();
    console.log("Received data:", body);

    // Placeholder for successful redirect
    return new Response(null, { status: 200, headers: { ...corsHeaders, "HX-Redirect": "/verify-phone" } });

  } catch (error) {
    console.error("Unhandled error in register function:", error);
    return new Response(
      `<div id="notification-area" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});