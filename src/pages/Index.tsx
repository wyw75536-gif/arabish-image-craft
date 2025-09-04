
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useImageHistory } from "@/hooks/useImageHistory";
import { StyleSelector, STYLES, SelectionMode } from "@/components/StyleSelector";
import { PWAInstall } from "@/components/PWAInstall";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ShareButton } from "@/components/ShareButton";
import { useLanguage } from "@/context/LanguageContext";
import { useUserStats } from "@/hooks/useUserStats";
import { Download, VideoIcon, Trash2, Users, UserCheck } from "lucide-react";


const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt/";

const Index = () => {
  const { language, t } = useLanguage();
  const { totalUsers, activeUsers } = useUserStats();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Array<{ id: string; url: string; moving: boolean; style?: string }>>([]);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [lastPromptAr, setLastPromptAr] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const { items: historyItems, add: addHistory, remove: removeHistory, clear: clearHistory } = useImageHistory();
  const addedRef = useRef<Set<string>>(new Set());

  // أسلوب التحديد
  const [mode, setMode] = useState<SelectionMode>("single");
  const [selectedIds, setSelectedIds] = useState<string[]>([STYLES[0]?.id]);


  useEffect(() => {
    document.title = t("site.title") + " — " + t("site.subtitle");
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    
    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    ensureMeta("description", t("site.subtitle"));

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);
  }, [language, t]);

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
      toast({ title: t("toast.empty") });
      return;
    }
    setLoading(true);
    setLastPromptAr(desc);
    try {
      const english = await translateToEnglish(desc);
      setLastPrompt(english);

      // جهّز قائمة الأنماط المطلوبة (حتى 8)
      const ids = (mode === 'multiple' ? (selectedIds.length ? selectedIds : [STYLES[0].id]) : [selectedIds[0] || STYLES[0].id]).slice(0, 8);
      const selected = ids.map(id => STYLES.find(s => s.id === id)!).filter(Boolean);

      const urls = selected.map((style, i) => {
        const seed = (Date.now() + i + Math.floor(Math.random() * 1000)).toString();
        const fullPrompt = `${english}, ${style.enSuffix}`;
        return {
          id: (crypto?.randomUUID?.() || `${Date.now()}-${i}`),
          url: buildUrl(fullPrompt, seed),
          moving: false,
          style: style.arName,
        };
      });

      setImages(urls);
      const map: Record<string, boolean> = {};
      urls.forEach(u => { map[u.id] = true; });
      setLoadingMap(map);
    } catch (err) {
      console.error(err);
      toast({ title: t("toast.error") });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!lastPrompt) return;
    setLoading(true);
    try {
      const ids = (mode === 'multiple' ? (selectedIds.length ? selectedIds : [STYLES[0].id]) : [selectedIds[0] || STYLES[0].id]).slice(0, 8);
      const selected = ids.map(id => STYLES.find(s => s.id === id)!).filter(Boolean);

      const urls = selected.map((style, i) => {
        const seed = (Date.now() + i + Math.floor(Math.random() * 1000)).toString();
        const fullPrompt = `${lastPrompt}, ${style.enSuffix}`;
        return {
          id: (crypto?.randomUUID?.() || `${Date.now()}-${i}`),
          url: buildUrl(fullPrompt, seed),
          moving: false,
          style: language === "ar" ? style.arName : style.enName,
        };
      });
      setImages(urls);
    } catch (e) {
      toast({ title: t("toast.error") });
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
      toast({ title: t("toast.download.warning"), description: t("toast.download.fallback") });
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
      toast({ title: t("toast.video.creating"), description: t("toast.video.wait") });

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

      toast({ title: t("toast.done"), description: t("toast.video.success") });
    } catch (e) {
      console.error(e);
      toast({ title: t("toast.image.error"), description: t("toast.video.error") });
    }
  };

  const toggleMove = (id: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, moving: !img.moving } : img)));
  };

  const canRegenerate = useMemo(() => !!lastPrompt, [lastPrompt]);

  return (
    <main className="min-h-screen bg-background">
      <PWAInstall />
      
      {/* Header with controls */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <header className="px-6 pt-16 pb-10 bg-gradient-to-b from-primary/10 to-background text-center animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{t("site.title")}</h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base">{t("site.subtitle")}</p>
        
        {/* User Statistics */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/40">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{t("stats.total.users")}:</span>
            <span className="font-semibold text-foreground">{totalUsers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/40">
            <UserCheck className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">{t("stats.active.users")}:</span>
            <span className="font-semibold text-foreground">{activeUsers.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <section className={`container mx-auto px-4 max-w-4xl ${language === "ar" ? "dir-rtl" : "dir-ltr"}`} dir={language === "ar" ? "rtl" : "ltr"}>
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("input.placeholder")}
                className="flex-1"
              />
              <Button variant="hero" onClick={handleGenerate} disabled={loading} className="md:w-48">
                {loading ? t("button.generating") : t("button.generate")}
              </Button>
            </div>
            <div className="space-y-3">
              <StyleSelector
                mode={mode}
                onModeChange={setMode}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
                maxMulti={8}
              />
              <div className="flex items-center justify-end">
                <Button variant="outline" onClick={handleRegenerate} disabled={!canRegenerate || loading}>{t("button.regenerate")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {Array.from({ length: mode === 'multiple' ? Math.min(selectedIds.length || 1, 8) : 1 }).map((_, i) => (
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
                    alt={lastPromptAr ? `${t("site.title")}: ${lastPromptAr}` : t("site.title")}
                    loading="lazy"
                    decoding="async"
                    
                    className={`size-full object-cover transition-transform duration-500 ${img.moving ? 'animate-ken-burns' : 'group-hover:scale-105'}`}
                    onLoad={() => {
                      if (loadingMap[img.id]) {
                        setLoadingMap((prev) => {
                          const next = { ...prev } as Record<string, boolean>;
                          delete next[img.id];
                          return next;
                        });
                        if (!addedRef.current.has(img.id)) {
                          addHistory({
                            id: img.id,
                            url: img.url,
                            promptAr: lastPromptAr ?? description.trim(),
                            promptEn: lastPrompt ?? undefined,
                            style: language === "ar" ? img.style : STYLES.find(s => s.arName === img.style)?.enName || img.style,
                            createdAt: Date.now(),
                          });
                          addedRef.current.add(img.id);
                        }
                      }
                    }}
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      const tried = el.getAttribute('data-retried');
                      if (!tried) {
                        el.setAttribute('data-retried', '1');
                        const sep = img.url.includes('?') ? '&' : '?';
                        el.src = `${img.url}${sep}cb=${Date.now()}`;
                        return;
                      }
                      toast({ title: t("toast.image.error"), description: t("toast.image.load.error") });
                    }}
                  />
                  {img.style && (
                    <div className="absolute top-2 right-2 bg-background/80 text-foreground px-2 py-1 rounded text-xs">
                      {img.style}
                    </div>
                  )}
                  {loadingMap[img.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/70 border-t-transparent animate-spin" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload(img.url)}
                      className="flex items-center gap-1.5 bg-background/90 text-foreground hover:bg-background border border-border/50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("button.download")}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExportVideo(img.url)}
                      className="flex items-center gap-1.5"
                    >
                      <VideoIcon className="h-3.5 w-3.5" />
                      {t("button.video")}
                    </Button>
                    <ShareButton 
                      imageUrl={img.url} 
                      description={lastPromptAr || t("site.subtitle")} 
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {historyItems.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t("history.title")}</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("history.clear")}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyItems.slice(0, 12).map((item) => (
                  <div key={item.id} className="relative group rounded-lg border bg-card overflow-hidden">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={item.url}
                        alt={item.promptAr}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeHistory(item.id)}
                          className="text-destructive hover:text-destructive bg-background/90"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          onClick={() => handleDownload(item.url)}
                          className="w-full flex items-center gap-1.5 bg-background/90 text-foreground hover:bg-background border border-border/50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("button.download")}
                        </Button>
                      </div>
                    </div>
                    {item.style && (
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground truncate">{item.style}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {historyItems.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t("history.empty")}</p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <footer className="mt-16 py-8 border-t bg-muted/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {t("footer.developer")} <span className="text-primary font-medium">{t("footer.developer.name")}</span> {t("footer.with")}
          </p>
          <a 
            href="https://www.facebook.com/profile.php?id=61575151770729" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {t("footer.developer.account")}
          </a>
        </div>
      </footer>
    </main>
  );
};

export default Index;
