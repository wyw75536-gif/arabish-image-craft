import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Image, TextLayout } from "https://deno.land/x/imagescript@v1.2.14/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-api-key",
};

function json(resBody: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(resBody), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    ...init,
  });
}

async function fetchPollinationsImage(prompt: string, width = 1024, height = 1024): Promise<Uint8Array> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  return arr;
}

async function watermark(imageData: Uint8Array): Promise<Uint8Array> {
  const base = await Image.decode(imageData);

  // Watermark rectangle size (responsive)
  const pad = Math.round(Math.min(base.width, base.height) * 0.02);
  const rectW = Math.round(Math.min(base.width * 0.38, 480));
  const rectH = Math.round(Math.min(base.height * 0.12, 140));
  const x = base.width - rectW - pad;
  const y = base.height - rectH - pad;

  // Create semi-transparent black rectangle
  const rect = new Image(rectW, rectH).fill(Image.rgbaToColor(0, 0, 0, 0.65));

  // Render text
  const label = "ARABISH IMAGE CRAFT";
  const fontUrl = "https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/master/ttf/DejaVuSans-Bold.ttf";
  const fontData = new Uint8Array(await (await fetch(fontUrl)).arrayBuffer());

  // Try to fit text
  let fontSize = Math.floor(rectH * 0.45);
  let textImg: Image | null = null;
  for (; fontSize >= 12; fontSize -= 2) {
    const candidate = Image.renderText(fontData, fontSize, label, 0xffffffff, new TextLayout({
      maxWidth: rectW - pad * 2,
      maxHeight: rectH - pad * 2,
      verticalAlign: "center",
      horizontalAlign: "middle",
    } as any));
    if (candidate.width <= rectW - pad * 2 && candidate.height <= rectH - pad * 2) {
      textImg = candidate;
      break;
    }
  }
  if (!textImg) {
    textImg = Image.renderText(fontData, 16, label, 0xffffffff);
  }

  base.composite(rect, x, y);
  base.composite(textImg, x + Math.floor((rectW - textImg.width) / 2), y + Math.floor((rectH - textImg.height) / 2));

  // Encode as PNG
  const png = await base.encode(1);
  return png;
}

function u8ToBase64(u8: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  try {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const apiKey = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth.trim();
    if (!apiKey) return json({ error: "Missing Authorization: Bearer <API_KEY>" }, { status: 401 });

    const { prompt, width, height } = await req.json();
    if (!prompt || typeof prompt !== "string") return json({ error: "Missing prompt" }, { status: 400 });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { "x-api-key": apiKey } },
    });

    const { data: keyRow, error } = await supabase
      .from("api_keys")
      .select("id, enabled, rate_limit_per_minute")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Key validation error", error);
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!keyRow) return json({ error: "Unauthorized" }, { status: 401 });

    const raw = await fetchPollinationsImage(prompt, Math.min(width || 1024, 1536), Math.min(height || 1024, 1536));
    const png = await watermark(raw);

    const b64 = u8ToBase64(png);
    return json({ image: `data:image/png;base64,${b64}` });
  } catch (err: any) {
    console.error("generate_image error", err);
    return json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
});
