
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
  const [images, setImages] = useState<Array<{ id: string; url: string; moving: boolean; style?: string }>>([]);
  const [batch4Styles, setBatch4Styles] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  useEffect(() => {
    document.title = "ARABISH IMAGE CRAFT — مولد صور بالذكاء الاصطناعي";
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
      
      if (batch4Styles) {
        const styles = [
          { name: "واقعية", prompt: `${english}, realistic, photorealistic, high quality` },
          { name: "أنمي", prompt: `${english}, anime style, manga style, japanese animation` },
          { name: "كرتون ثلاثي الأبعاد", prompt: `${english}, 3D cartoon style, pixar style, animated movie` },
          { name: "واقعية فائقة", prompt: `${english}, hyperrealistic, ultra realistic, professional photography, 8k` }
        ];
        
        const urls = styles.map((style, i) => {
          const seed = (Date.now() + i + Math.floor(Math.random() * 1000)).toString();
          return { 
            id: (crypto?.randomUUID?.() || `${Date.now()}-${i}`), 
            url: buildUrl(style.prompt, seed), 
            moving: false,
            style: style.name
          };
        });
        setImages(urls);
      } else {
        const randomSeed = (Date.now() + Math.floor(Math.random() * 10000)).toString();
        const urls = [{ 
          id: (crypto?.randomUUID?.() || `${Date.now()}`), 
          url: buildUrl(english, randomSeed), 
          moving: false 
        }];
        setImages(urls);
      }
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
      if (batch4Styles) {
        const styles = [
          { name: "واقعية", prompt: `${lastPrompt}, realistic, photorealistic, high quality` },
          { name: "أنمي", prompt: `${lastPrompt}, anime style, manga style, japanese animation` },
          { name: "كرتون ثلاثي الأبعاد", prompt: `${lastPrompt}, 3D cartoon style, pixar style, animated movie` },
          { name: "واقعية فائقة", prompt: `${lastPrompt}, hyperrealistic, ultra realistic, professional photography, 8k` }
        ];
        
        const urls = styles.map((style, i) => {
          const seed = (Date.now() + i + Math.floor(Math.random() * 1000)).toString();
          return { 
            id: (crypto?.randomUUID?.() || `${Date.now()}-${i}`), 
            url: buildUrl(style.prompt, seed), 
            moving: false,
            style: style.name
          };
        });
        setImages(urls);
      } else {
        const randomSeed = (Date.now() + Math.floor(Math.random() * 10000)).toString();
        const urls = [{ 
          id: (crypto?.randomUUID?.() || `${Date.now()}`), 
          url: buildUrl(lastPrompt, randomSeed), 
          moving: false 
        }];
        setImages(urls);
      }
    } catch (e) {
      toast({ title: "خطأ", description: "تعذر إعادة الإنشاء الآن." });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      // جلب الصورة ثم معالجة العلامة المائية قبل التنزيل
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // تحميل الصورة في عنصر Image لاستخدام أبعادها
      const img: HTMLImageElement = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => reject(e);
        image.src = objectUrl;
      });

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-2d-context");

      // رسم الصورة الأصلية
      ctx.drawImage(img, 0, 0, w, h);

      // تحديد مستطيل العلامة المائية أسفل يمين الصورة (نسبة تقريبية لتناسق أغلب الصور)
      const pad = Math.round(Math.min(w, h) * 0.02);
      const rectW = Math.round(Math.min(w * 0.38, 480));
      const rectH = Math.round(Math.min(h * 0.12, 140));
      const x = w - rectW - pad;
      const y = h - rectH - pad;
      const radius = Math.max(6, Math.round(Math.min(rectW, rectH) * 0.12));

      // قصّ منطقة العلامة المائية ثم تمويهها بقوة
      ctx.save();
      const r = radius;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + rectW - r, y);
      ctx.quadraticCurveTo(x + rectW, y, x + rectW, y + r);
      ctx.lineTo(x + rectW, y + rectH - r);
      ctx.quadraticCurveTo(x + rectW, y + rectH, x + rectW - r, y + rectH);
      ctx.lineTo(x + r, y + rectH);
      ctx.quadraticCurveTo(x, y + rectH, x, y + rectH - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.clip();

      // إعادة رسم الجزء ذاته بفلتر تمويه لمحو الشعار الأصلي
      const expand = Math.round(Math.min(rectW, rectH) * 0.15);
      const sx = Math.max(0, x - expand);
      const sy = Math.max(0, y - expand);
      const sw = Math.min(w - sx, rectW + expand * 2);
      const sh = Math.min(h - sy, rectH + expand * 2);
      ctx.filter = "blur(12px)";
      ctx.drawImage(img, sx, sy, sw, sh, x - (sx - x), y - (sy - y), sw, sh);
      ctx.filter = "none";

      // خلفية نصف شفافة لضمان وضوح النص
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, rectW, rectH);
      ctx.globalAlpha = 1;

      // كتابة اسم أداتنا بنفس حجم الصندوق تقريبًا
      const label = "ARABISH IMAGE CRAFT";
      let fontSize = Math.floor(rectH * 0.45);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      for (; fontSize > 10; fontSize--) {
        ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto`;
        if (ctx.measureText(label).width <= rectW - pad * 1.5) break;
      }
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = Math.max(2, Math.floor(fontSize * 0.1));
      ctx.fillText(label, x + rectW / 2, y + rectH / 2);
      ctx.restore();

      // تصدير وتحميل
      const outBlob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.95));
      URL.revokeObjectURL(objectUrl);

      const a = document.createElement("a");
      const dlUrl = URL.createObjectURL(outBlob);
      a.href = dlUrl;
      a.download = `arabish-image-craft-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 0);
    } catch (e) {
      toast({ title: "تنبيه", description: "تعذر تجهيز الصورة، سيتم تحميل الأصل." });
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
      } catch {}
    }
  };

  const handleExportVideo = async (url: string) => {
    try {
      toast({ title: "جارٍ إنشاء فيديو", description: "قد يستغرق بضع ثوانٍ..." });

      // جلب الصورة كـ Blob لتجنب مشاكل CORS على الـ canvas
      const res = await fetch(url);
      const imgBlob = await res.blob();
      const objectUrl = URL.createObjectURL(imgBlob);

      // إعداد الصورة
      const loadImage = (): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => reject(e);
        image.src = objectUrl;
      });

      const imageEl = await loadImage();

      const width = 1280, height = 720, fps = 30, duration = 6000; // 6 ثوانٍ ثابتة
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-2d-context');

      // مسجل الفيديو من الـ canvas
      const stream = canvas.captureStream(fps);
      const track = stream.getVideoTracks()[0] as any; // CanvasCaptureMediaStreamTrack في بعض المتصفحات
      const chunks: BlobPart[] = [];
      const tryOptions: MediaRecorderOptions[] = [
        { mimeType: 'video/webm;codecs=vp9' },
        { mimeType: 'video/webm;codecs=vp8' },
        { mimeType: 'video/webm' },
        {}
      ];
      let recorder: MediaRecorder | null = null;
      for (const opt of tryOptions) {
        try { recorder = new MediaRecorder(stream, opt); break; } catch {}
      }
      if (!recorder) throw new Error('MediaRecorder-unsupported');
      recorder.ondataavailable = (e) => e.data?.size && chunks.push(e.data);

      let stopped = false;
      let timer: number | null = null;
      const stopRecording = () => {
        if (stopped) return;
        stopped = true;
        if (timer) { clearInterval(timer); timer = null; }
        try { recorder!.stop(); } catch {}
      };

      // نسجل بقطع 100ms لتحسين الميتاداتا في بعض المتصفحات
      recorder.start(100);

      const totalFrames = Math.round((fps * duration) / 1000);
      let frameIndex = 0;
      const intervalMs = Math.max(4, Math.round(1000 / fps));

      // ضمان الإيقاف بعد المدة المطلوبة كحزام أمان
      const safety = window.setTimeout(stopRecording, duration + 400);

      timer = window.setInterval(() => {
        const t = Math.min(1, frameIndex / Math.max(1, totalFrames - 1));
        const scale = 1 + 0.12 * t; // تكبير بسيط
        const panX = -0.2 * (width * (scale - 1));
        const panY = -0.2 * (height * (scale - 1));

        // حساب تغطية الصورة لقماش الفيديو
        const imgAspect = imageEl.naturalWidth / imageEl.naturalHeight;
        const canvasAspect = width / height;
        let dw = width, dh = height, dx = 0, dy = 0;
        if (imgAspect > canvasAspect) {
          dh = height;
          dw = dh * imgAspect;
          dx = (width - dw) / 2;
          dy = 0;
        } else {
          dw = width;
          dh = dw / imgAspect;
          dx = 0;
          dy = (height - dh) / 2;
        }

        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);
        ctx.drawImage(imageEl, dx, dy, dw, dh);
        ctx.restore();

        track?.requestFrame?.();

        frameIndex++;
        if (frameIndex >= totalFrames) {
          window.clearTimeout(safety);
          stopRecording();
        }
      }, intervalMs);

      const videoBlob: Blob = await new Promise((resolve) => {
        recorder!.onstop = () => resolve(new Blob(chunks, { type: chunks[0] ? (chunks[0] as any).type : 'video/webm' }));
      });

      const a = document.createElement('a');
      const videoUrl = URL.createObjectURL(videoBlob);
      a.href = videoUrl;
      a.download = `pollinations-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(videoUrl);
      URL.revokeObjectURL(objectUrl);

      toast({ title: "تم", description: "تم إنشاء الفيديو وتحميله." });
    } catch (e) {
      console.error(e);
      toast({ title: "خطأ", description: "تعذر إنشاء الفيديو في هذا المتصفح." });
    }
  };

  const toggleMove = (id: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, moving: !img.moving } : img)));
  };

  const canRegenerate = useMemo(() => !!lastPrompt, [lastPrompt]);

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 pt-16 pb-10 bg-gradient-to-b from-primary/10 to-background text-center animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">ARABISH IMAGE CRAFT</h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base">اكتب وصفك بالعربية، وسنترجمه ونعرض صورًا مبهرة. اختر صورة واحدة أو 4 صور بأساليب مختلفة.</p>
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
                <Switch id="batch" checked={batch4Styles} onCheckedChange={setBatch4Styles} />
                <label htmlFor="batch" className="text-sm text-muted-foreground">توليد 4 صور بأساليب مختلفة (واقعي، أنمي، 3D، واقعي فائق)</label>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleRegenerate} disabled={!canRegenerate || loading}>إعادة الإنشاء</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {Array.from({ length: batch4Styles ? 4 : 1 }).map((_, i) => (
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
                  {img.style && (
                    <div className="absolute top-2 right-2 bg-background/80 text-foreground px-2 py-1 rounded text-xs">
                      {img.style}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-center gap-2 bg-gradient-to-t from-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => toggleMove(img.id)}>{img.moving ? "إيقاف التحريك" : "تحريك"}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(img.url)}>تحميل</Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportVideo(img.url)}>تحويل إلى فيديو</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t mt-10">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground text-xs" dir="rtl">
          <p className="flex items-center justify-center gap-2">
            <span>تم تطوير هذه الاداه عن طريق محمد عاطف</span>
            <a
              href="https://www.facebook.com/profile.php?id=61575151770729"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 story-link"
              aria-label="حساب المطور على فيسبوك"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06C2 17.08 5.66 21.18 10.44 22v-7.03H7.9v-2.91h2.54V9.83c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.18 22 17.08 22 12.06z"/>
              </svg>
              <span>حساب المطور</span>
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
