import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id",
};

function json(resBody: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(resBody), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    ...init,
  });
}

function randomKey(): string {
  const rand = crypto.getRandomValues(new Uint8Array(24));
  const b64 = btoa(String.fromCharCode(...rand)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  const prefix = b64.slice(0, 8).toLowerCase();
  return `arc_live_${prefix}_${b64}`;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const deviceId = req.headers.get("x-device-id") ?? "";
    if (!deviceId) return json({ error: "x-device-id header is required" }, { status: 400 });

    const { name } = await req.json().catch(() => ({ name: null }));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { "x-device-id": deviceId } },
    });

    const apiKey = randomKey();
    const keyHash = await sha256Hex(apiKey);
    const keyPrefix = apiKey.split("_")[2]?.slice(0, 8) || apiKey.slice(10, 18);

    const { data, error } = await supabase
      .from("api_keys")
      .insert({ device_id: deviceId, name: name ?? null, key_prefix: keyPrefix, key_hash: keyHash })
      .select("id, created_at, key_prefix")
      .single();

    if (error) {
      console.error("Insert api_key error", error);
      return json({ error: error.message }, { status: 400 });
    }

    return json({ apiKey, prefix: data.key_prefix, created_at: data.created_at });
  } catch (err: any) {
    console.error("create_api_key error", err);
    return json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
});
