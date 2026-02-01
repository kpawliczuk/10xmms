import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Supabase Edge Function to fetch a paginated list of history items as HTML.
 * This is called by the "Load More" button.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "12", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    // The full implementation will be added in the next steps.
    // This includes:
    // - Creating a Supabase client with user's auth context.
    // - Fetching paginated data from the `mms_history` table.
    // - Rendering the fetched items into a list of `HistoryItem` HTML fragments.
    // - Rendering a new `LoadMoreButton` with the next offset.
    // - Returning the combined HTML.

    // For now, we return an empty response to confirm the endpoint is reachable.
    return new Response("", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error in history-items function:", error);
    // In case of an error, return an empty response so the UI doesn't break.
    return new Response("", { status: 500, headers: corsHeaders });
  }
});