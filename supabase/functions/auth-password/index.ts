import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "../_shared/cors.ts";
import type { LoginCommand } from "../../../src/types.ts";

/**
 * Supabase Edge Function for handling the first step of user login (password verification).
 * On success, it redirects the user to the 2FA verification step.
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
    const command: LoginCommand = Object.fromEntries(form.entries()) as any;

    // 1. Call Supabase Auth to sign in the user
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    if (signInError) {
      console.error("Supabase signIn error:", signInError.message);
      return new Response(
        `<div id="notification-area" class="alert alert-error">Nieprawidłowy login lub hasło.</div>`,
        { status: 401, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    if (!user) {
      throw new Error("Sign-in did not return a user object.");
    }

    // 2. Fetch the user's phone number from their profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("phone_number")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.phone_number) {
      console.error("Could not find phone number for user:", user.id, profileError?.message);
      return new Response(
        `<div id="notification-area" class="alert alert-error">Nie można odnaleźć numeru telefonu dla tego konta.</div>`,
        { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 3. Handle success: Redirect to the 2FA verification page
    const redirectUrl = new URL(req.url);
    redirectUrl.pathname = "/verify-2fa";
    redirectUrl.searchParams.set("phone", profile.phone_number);

    return new Response(null, {
      status: 200,
      headers: { ...corsHeaders, "HX-Redirect": redirectUrl.toString() },
    });
  } catch (error) {
    console.error("Unhandled error in auth-password function:", error);
    return new Response(
      `<div id="notification-area" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});