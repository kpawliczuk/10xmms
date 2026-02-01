import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "../_shared/cors.ts";
import type { RegisterCommand } from "../../../src/types.ts";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const form = await req.formData();
    const command: RegisterCommand = Object.fromEntries(form.entries()) as any;

    // 1. Server-side validation
    if (command.password !== command.passwordConfirm) {
      return new Response(
        `<div id="notification-area" class="alert alert-error">Hasła nie są zgodne.</div>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }
    if (command.termsAccepted !== "on") {
      return new Response(
        `<div id="notification-area" class="alert alert-error">Musisz zaakceptować regulamin.</div>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 2. Call Supabase Auth to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: command.email,
      password: command.password,
      phone: command.phone,
      options: {
        // Pass additional data to be available in the user's metadata and for the database trigger
        data: {
          username: command.email.split("@")[0], // Use email prefix as initial username
        },
      },
    });

    if (error) {
      console.error("Supabase signUp error:", error.message);
      // Check for a specific error indicating the user already exists
      if (error.message.includes("User already registered")) {
        return new Response(
          `<div id="notification-area" class="alert alert-error">Użytkownik o tym adresie e-mail już istnieje.</div>`,
          { status: 409, headers: { ...corsHeaders, "Content-Type": "text/html" } },
        );
      }
      // For other auth errors
      throw error;
    }

    if (!data.user) {
      throw new Error("User registration did not return a user object.");
    }

    // 3. Handle success: Redirect to the phone verification page
    // We pass the phone number in the URL to pre-fill it on the next page.
    const redirectUrl = new URL(req.url);
    redirectUrl.pathname = "/verify-phone";
    redirectUrl.searchParams.set("phone", command.phone);

    return new Response(null, {
      status: 200, // Or 303 See Other for redirects, but 200 is fine for HTMX
      headers: { ...corsHeaders, "HX-Redirect": redirectUrl.toString() },
    });
  } catch (error) {
    console.error("Unhandled error in register function:", error);
    return new Response(
      `<div id="notification-area" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});