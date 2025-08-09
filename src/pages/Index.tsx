import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt/";

const Index = () => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Array<{ id: string; url: string; moving: boolean }>>([]);
  const [batch10, setBatch10] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  useEffect(() => {
    document.title = "مولد صور Pollinations بالعربية";
    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    ensureMeta("description", "مولد صور بالذكاء الاصطناعي يدعم العربية مع ترجمة فورية وخيارات توليد متعددة.");

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);
  }, []);

  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("translate failed");
      const data = await res.json();
      const translated: string | undefined = data?.responseData?.translatedText;
      return translated && translated.trim().length > 0 ? translated : text;
    } catch (e) {
      console.warn("Translation failed, using original text", e);
      return text; // fallback
    }
  };

  const buildUrl = (prompt: string, seed?: string) => {
    const encoded = encodeURIComponent(prompt);
    const t = Date.now();
    const r = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const qp = `?t=${t}&r=${r}${seed ? `&seed=${seed}` : ""}`;
    return `${POLLINATIONS_BASE}${encoded}${qp}`;
  };

  const handleGenerate = async () => {
    const desc = description.trim();
    setImages([]);
    if (!desc) {
      toast({ title: "تنبيه", description: "من فضلك اكتب وصفًا للصورة." });
      return;
    }
    setLoading(true);
    try {
      const english = await translateToEnglish(desc);
      setLastPrompt(english);
      const count = batch10 ? 10 : 1;
      const urls = Array.from({ length: count }).map((_, i) => {
        const seed = (i + 1).toString();
        return { id: (crypto?.randomUUID?.() || `${Date.now()}-${i}`), url: buildUrl(`${english} seed:${seed}`), moving: false };
      });
      setImages(urls);
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "حدث خطأ أثناء التوليد. حاول مرة أخرى." });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!lastPrompt) return;
    setLoading(true);
    try {
      const count = batch10 ? 10 : 1;
      const urls = Array.from({ length: count }).map((_, i) => {
        const seed = (i + 1 + Math.floor(Math.random() * 1000)).toString();
        return { id: (crypto?.randomUUID?.() || `${Date.now()}-${i}`), url: buildUrl(`${lastPrompt} seed:${seed}`), moving: false };
      });
      setImages(urls);
    } catch (e) {
      toast({ title: "خطأ", description: "تعذر إعادة الإنشاء الآن." });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `pollinations-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      toast({ title: "تنبيه", description: "تعذر تنزيل الصورة الآن." });
    }
  };

  const toggleMove = (id: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, moving: !img.moving } : img)));
  };

  const canRegenerate = useMemo(() => !!lastPrompt, [lastPrompt]);

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 pt-16 pb-10 bg-gradient-to-b from-primary/10 to-background text-center animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">مولد صور Pollinations</h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base">اكتب وصفك بالعربية، وسنترجمه ونعرض صورًا مبهرة. اختر صورة واحدة أو 10 صور بلمسة اختلاف.</p>
      </header>

      <section className="container mx-auto px-4 max-w-4xl" dir="rtl">
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: كلب يمشي في حديقة عند الغروب بعدسة احترافية"
                className="flex-1"
              />
              <Button variant="hero" onClick={handleGenerate} disabled={loading} className="md:w-48">
                {loading ? "جارٍ التوليد..." : "اعرض الصورة"}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch id="batch" checked={batch10} onCheckedChange={setBatch10} />
                <label htmlFor="batch" className="text-sm text-muted-foreground">توليد 10 صور مع اختلاف بسيط</label>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleRegenerate} disabled={!canRegenerate || loading}>إعادة الإنشاء</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {Array.from({ length: batch10 ? 6 : 1 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {images.map((img) => (
              <article key={img.id} className="group overflow-hidden rounded-lg border bg-card text-card-foreground">
                <div className={`relative aspect-[4/3] overflow-hidden`}>
                  <img
                    src={img.url}
                    alt="صورة مولدة بالذكاء الاصطناعي"
                    loading="lazy"
                    className={`size-full object-cover transition-transform duration-500 ${img.moving ? 'animate-ken-burns' : 'group-hover:scale-105'}`}
                    onError={() => toast({ title: "خطأ", description: "تعذر تحميل الصورة. حاول وصفًا مختلفًا." })}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-center gap-2 bg-gradient-to-t from-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => toggleMove(img.id)}>{img.moving ? "إيقاف التحريك" : "تحريك"}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(img.url)}>تحميل</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Index;
