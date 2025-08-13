import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type SelectionMode = "single" | "multiple";

export interface StyleItem {
  id: string;
  arName: string;
  enSuffix: string; // appended to English prompt
  description: string;
}

export const STYLES: StyleItem[] = [
  { id: "realistic", arName: "واقعي (Realistic)", enSuffix: "realistic, photorealistic, high quality", description: "واقعية عالية تشبه التصوير الحقيقي." },
  { id: "anime", arName: "أنمي (Anime)", enSuffix: "anime style, manga, japanese animation", description: "أسلوب رسوم ياباني بملامح حادة وتلوين مسطح." },
  { id: "3d", arName: "ثلاثي الأبعاد (3D)", enSuffix: "3D render, octane render, highly detailed", description: "مظهر مجسم بإضاءة وظلال واقعية كالريندر." },
  { id: "ultra-realistic", arName: "واقعي فائق (Ultra Realistic)", enSuffix: "hyperrealistic, ultra-detailed, professional photography, 8k", description: "تفاصيل بالغة الدقة وإضاءة احترافية." },
  { id: "abstract", arName: "فن التجريد (Abstract Art)", enSuffix: "abstract art, geometric shapes, bold colors", description: "أشكال وألوان بلا تمثيل مباشر، تعبير بصري حر." },
  { id: "comic", arName: "أسلوب الكوميك (Comic Style)", enSuffix: "comic style, inked lines, halftone shading", description: "خطوط حبرية ونقاط هالف تون كصفحات القصص المصورة." },
  { id: "pop-art", arName: "البوب آرت (Pop Art)", enSuffix: "pop art, bold outlines, ben-day dots, vibrant colors", description: "ألوان صاخبة وخطوط واضحة بروح آندي وارهول." },
  { id: "pencil", arName: "رسم بالقلم الرصاص (Pencil Sketch)", enSuffix: "pencil sketch, graphite drawing, cross-hatching", description: "محاكاة الرسم بالرصاص مع تظليل وتحبير خفيف." },
  { id: "oil", arName: "تأثير الزيت على اللوحة (Oil Painting)", enSuffix: "oil painting, brush strokes, canvas texture", description: "ضربات فرشاة ولمس قماش كلوحة زيتية." },
  { id: "bw-photo", arName: "فوتوغرافيا أبيض وأسود (Black & White)", enSuffix: "black and white photography, monochrome, high contrast, film grain", description: "أبيض وأسود بتباين ولمسة فوتوغرافية كلاسيكية." },
  { id: "neon", arName: "تأثير الألوان النيون (Neon Colors)", enSuffix: "neon colors, glowing lights, cyberpunk", description: "أضواء متوهجة وألوان نيون لجو سايبربنك." },
  // الأربعة الإضافية المميزة
  { id: "cinematic", arName: "السينمائي (Cinematic Look)", enSuffix: "cinematic look, dramatic lighting, color grading, anamorphic bokeh", description: "دراما لونية وعمق مجال قريب من الأفلام." },
  { id: "cartoon", arName: "الرسوم الكرتونية (Cartoon Style)", enSuffix: "cartoon style, simple shapes, flat shading", description: "أشكال بسيطة وتلوين مسطح كأفلام كرتون." },
  { id: "expressive-realism", arName: "الواقعي التعبيري (Expressive Realism)", enSuffix: "expressive realism, dynamic brushwork, emotional lighting", description: "مزج واقعية مع تعبيرية وحركة وإحساس." },
  { id: "surrealism", arName: "الفن السريالي (Surrealism)", enSuffix: "surrealism, dreamlike, impossible scenes, Salvador Dali style", description: "مشاهد خيالية تحاكي أحلامًا وأفكارًا غير ممكنة." },
];

interface Props {
  mode: SelectionMode;
  onModeChange: (m: SelectionMode) => void;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxMulti?: number; // default 8
}

export function StyleSelector({ mode, onModeChange, selectedIds, onChange, maxMulti = 8 }: Props) {
  const toggle = (id: string) => {
    if (mode === "single") {
      onChange([id]);
      return;
    }
    const set = new Set(selectedIds);
    if (set.has(id)) {
      set.delete(id);
      onChange(Array.from(set));
      return;
    }
    if (set.size >= maxMulti) {
      toast({ title: "تنبيه", description: `يمكنك اختيار حتى ${maxMulti} أنماط فقط.` });
      return;
    }
    set.add(id);
    onChange(Array.from(set));
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">وضع الاختيار:</span>
        <div className="inline-flex rounded-md border bg-background p-1">
          <Button
            size="sm"
            variant={mode === "single" ? "secondary" : "ghost"}
            onClick={() => onModeChange("single")}
          >
            استايل واحد
          </Button>
          <Button
            size="sm"
            variant={mode === "multiple" ? "secondary" : "ghost"}
            onClick={() => onModeChange("multiple")}
          >
            متعدد (حتى {maxMulti})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {STYLES.map((s) => {
          const active = selectedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                "text-start rounded-md border p-3 transition-colors",
                active ? "bg-primary/10 border-primary" : "hover:bg-muted"
              )}
              aria-pressed={active}
              title={s.description}
            >
              <div className="text-sm font-medium">{s.arName}</div>
              <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{s.description}</div>
            </button>
          );
        })}
      </div>

      {mode === "multiple" && (
        <div className="text-xs text-muted-foreground">المحدد: {selectedIds.length} / {maxMulti}</div>
      )}
    </div>
  );
}

export default StyleSelector;
