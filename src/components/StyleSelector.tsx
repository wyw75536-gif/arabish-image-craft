import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

export type SelectionMode = "single" | "multiple";

export interface StyleItem {
  id: string;
  arName: string;
  enName: string;
  enSuffix: string; // appended to English prompt
  description: string;
  enDescription: string;
}

export const STYLES: StyleItem[] = [
  { id: "realistic", arName: "واقعي", enName: "Realistic", enSuffix: "realistic, photorealistic, high quality", description: "واقعية عالية تشبه التصوير الحقيقي.", enDescription: "High realism similar to real photography." },
  { id: "anime", arName: "أنمي", enName: "Anime", enSuffix: "anime style, manga, japanese animation", description: "أسلوب رسوم ياباني بملامح حادة وتلوين مسطح.", enDescription: "Japanese drawing style with sharp features and flat coloring." },
  { id: "3d", arName: "ثلاثي الأبعاد", enName: "3D", enSuffix: "3D render, octane render, highly detailed", description: "مظهر مجسم بإضاءة وظلال واقعية كالريندر.", enDescription: "Three-dimensional appearance with realistic lighting and shadows." },
  { id: "ultra-realistic", arName: "واقعي فائق", enName: "Ultra Realistic", enSuffix: "hyperrealistic, ultra-detailed, professional photography, 8k", description: "تفاصيل بالغة الدقة وإضاءة احترافية.", enDescription: "Extremely detailed with professional lighting." },
  { id: "abstract", arName: "فن التجريد", enName: "Abstract Art", enSuffix: "abstract art, geometric shapes, bold colors", description: "أشكال وألوان بلا تمثيل مباشر، تعبير بصري حر.", enDescription: "Shapes and colors without direct representation, free visual expression." },
  { id: "comic", arName: "أسلوب الكوميك", enName: "Comic Style", enSuffix: "comic style, inked lines, halftone shading", description: "خطوط حبرية ونقاط هالف تون كصفحات القصص المصورة.", enDescription: "Inked lines and halftone dots like comic book pages." },
  { id: "pop-art", arName: "البوب آرت", enName: "Pop Art", enSuffix: "pop art, bold outlines, ben-day dots, vibrant colors", description: "ألوان صاخبة وخطوط واضحة بروح آندي وارهول.", enDescription: "Vibrant colors and clear lines in Andy Warhol spirit." },
  { id: "pencil", arName: "رسم بالقلم الرصاص", enName: "Pencil Sketch", enSuffix: "pencil sketch, graphite drawing, cross-hatching", description: "محاكاة الرسم بالرصاص مع تظليل وتحبير خفيف.", enDescription: "Pencil drawing simulation with light shading and hatching." },
  { id: "oil", arName: "تأثير الزيت على اللوحة", enName: "Oil Painting", enSuffix: "oil painting, brush strokes, canvas texture", description: "ضربات فرشاة ولمس قماش كلوحة زيتية.", enDescription: "Brush strokes and canvas texture like oil painting." },
  { id: "bw-photo", arName: "فوتوغرافيا أبيض وأسود", enName: "Black & White", enSuffix: "black and white photography, monochrome, high contrast, film grain", description: "أبيض وأسود بتباين ولمسة فوتوغرافية كلاسيكية.", enDescription: "Black and white with contrast and classic photographic touch." },
  { id: "neon", arName: "تأثير الألوان النيون", enName: "Neon Colors", enSuffix: "neon colors, glowing lights, cyberpunk", description: "أضواء متوهجة وألوان نيون لجو سايبربنك.", enDescription: "Glowing lights and neon colors for cyberpunk atmosphere." },
  // الأربعة الإضافية المميزة
  { id: "cinematic", arName: "السينمائي", enName: "Cinematic Look", enSuffix: "cinematic look, dramatic lighting, color grading, anamorphic bokeh", description: "دراما لونية وعمق مجال قريب من الأفلام.", enDescription: "Color drama and depth of field close to movies." },
  { id: "cartoon", arName: "الرسوم الكرتونية", enName: "Cartoon Style", enSuffix: "cartoon style, simple shapes, flat shading", description: "أشكال بسيطة وتلوين مسطح كأفلام كرتون.", enDescription: "Simple shapes and flat coloring like cartoon movies." },
  { id: "expressive-realism", arName: "الواقعي التعبيري", enName: "Expressive Realism", enSuffix: "expressive realism, dynamic brushwork, emotional lighting", description: "مزج واقعية مع تعبيرية وحركة وإحساس.", enDescription: "Mixing realism with expressiveness and emotion." },
  { id: "surrealism", arName: "الفن السريالي", enName: "Surrealism", enSuffix: "surrealism, dreamlike, impossible scenes, Salvador Dali style", description: "مشاهد خيالية تحاكي أحلامًا وأفكارًا غير ممكنة.", enDescription: "Fantasy scenes simulating dreams and impossible ideas." },
];

interface Props {
  mode: SelectionMode;
  onModeChange: (m: SelectionMode) => void;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxMulti?: number; // default 8
}

export function StyleSelector({ mode, onModeChange, selectedIds, onChange, maxMulti = 8 }: Props) {
  const { language, t } = useLanguage();
  
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
      toast({ title: t("toast.download.warning"), description: language === "ar" ? `يمكنك اختيار حتى ${maxMulti} أنماط فقط.` : `You can select up to ${maxMulti} styles only.` });
      return;
    }
    set.add(id);
    onChange(Array.from(set));
  };

  return (
    <div className="space-y-3" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {language === "ar" ? "وضع الاختيار:" : "Selection Mode:"}
        </span>
        <div className="inline-flex rounded-md border bg-background p-1">
          <Button
            size="sm"
            variant={mode === "single" ? "secondary" : "ghost"}
            onClick={() => onModeChange("single")}
          >
            {language === "ar" ? "استايل واحد" : "Single Style"}
          </Button>
          <Button
            size="sm"
            variant={mode === "multiple" ? "secondary" : "ghost"}
            onClick={() => onModeChange("multiple")}
          >
            {language === "ar" ? `متعدد (حتى ${maxMulti})` : `Multiple (up to ${maxMulti})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {STYLES.map((s) => {
          const active = selectedIds.includes(s.id);
          const displayName = language === "ar" ? s.arName : s.enName;
          const displayDescription = language === "ar" ? s.description : s.enDescription;
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
              title={displayDescription}
            >
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{displayDescription}</div>
            </button>
          );
        })}
      </div>

      {mode === "multiple" && (
        <div className="text-xs text-muted-foreground">
          {language === "ar" ? `المحدد: ${selectedIds.length} / ${maxMulti}` : `Selected: ${selectedIds.length} / ${maxMulti}`}
        </div>
      )}
    </div>
  );
}

export default StyleSelector;
