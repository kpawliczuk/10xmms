import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import type { MmsHistoryDto } from "../../../src/types.ts";
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

    // 2. Fetch paginated data from the `mms_history` table
    const { data: historyItems, error } = await supabaseClient
      .from("mms_history")
      .select("id, prompt, status, model_info, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<MmsHistoryDto[]>();

    if (error) {
      throw error;
    }

    // 3. Render the fetched items into HTML fragments
    const itemsHtml = historyItems
      .map((item) => {
        const imageUrl = `/functions/v1/mms-image?id=${item.id}`;
        return `
          <a href="${imageUrl}" target="_blank" class="group relative block aspect-square overflow-hidden rounded-lg shadow-md">
            <img src="${imageUrl}" alt="${item.prompt ?? "Wygenerowana grafika"}" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
            <div class="absolute inset-0 bg-black bg-opacity-0 transition-all group-hover:bg-opacity-70"></div>
            <div class="absolute bottom-0 left-0 p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p class="text-xs font-semibold line-clamp-2">${item.prompt}</p>
            </div>
          </a>
        `;
      })
      .join("");

    // 4. Render a new "Load More" button if there are more items
    let loadMoreButtonHtml = "";
    if (historyItems.length === limit) {
      const nextOffset = offset + limit;
      loadMoreButtonHtml = `
        <div id="load-more-container" class="mt-8 text-center">
          <button
            class="transform rounded-lg bg-slate-200 px-7 py-3 font-semibold text-slate-800 transition-transform hover:scale-105 hover:bg-slate-300"
            hx-get="/functions/v1/history-items?limit=${limit}&offset=${nextOffset}"
            hx-target="#load-more-container"
            hx-swap="outerHTML"
          >
            Załaduj więcej
          </button>
        </div>
      `;
    }

    // 5. Return the combined HTML
    // The `hx-swap` on the original button was `outerHTML`, so this response will replace it.
    // The new items are not included here because the target was the button container itself.
    // A better approach is to target a wrapper and have two OOB swaps.
    // For simplicity, we'll adjust the frontend to have a different target.
    // Let's assume the button's hx-target is the grid, and hx-swap is beforeend.
    // The button itself will be replaced by this response.
    const responseHtml = itemsHtml + loadMoreButtonHtml;

    return new Response(responseHtml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error in history-items function:", error);
    // In case of an error, return an empty response so the UI doesn't break.
    return new Response("", { status: 500, headers: corsHeaders });
  }
});