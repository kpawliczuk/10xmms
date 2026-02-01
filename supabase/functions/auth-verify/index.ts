import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "../_shared/cors.ts";
import type { VerifyOtpCommand } from "../../../src/types.ts";

/**
 * Supabase Edge Function for handling OTP verification (2FA and phone confirmation).
 * On success, it completes the sign-in/sign-up process and redirects to the main app.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Note: We use the service role key here to perform the verification,
    // as the user does not have an active session yet at this stage.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const form = await req.formData();
    const command: VerifyOtpCommand = Object.fromEntries(form.entries()) as any;

    // 1. Validate the incoming command
    if (!command.token || !command.phone || !command.type) {
      return new Response(
        `<div id="notification-area" class="alert alert-error">Brakujące dane weryfikacyjne.</div>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 2. Call Supabase Auth to verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      phone: command.phone,
      token: command.token,
      type: command.type,
    });

    if (error) {
      console.error("Supabase verifyOtp error:", error.message);
      return new Response(
        `<div id="notification-area" class="alert alert-error">Wprowadzony kod jest nieprawidłowy lub wygasł.</div>`,
        { status: 401, headers: { ...corsHeaders, "Content-Type": "text/html" } },
      );
    }

    // 3. Handle success: Redirect to the main application view
    return new Response(null, {
      status: 200,
      headers: { ...corsHeaders, "HX-Redirect": "/app" },
    });
  } catch (error) {
    console.error("Unhandled error in auth-verify function:", error);
    return new Response(
      `<div id="notification-area" class="alert alert-error">Wystąpił nieoczekiwany błąd serwera.</div>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }
});