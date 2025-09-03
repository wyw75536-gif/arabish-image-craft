import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    // Header
    "site.title": "ARABISH IMAGE CRAFT",
    "site.subtitle": "اكتب وصفك بالعربية وسنترجمه. اختر صورة واحدة أو حتى 8 صور بأساليب مختلفة في آنٍ واحد.",
    
    // Input section
    "input.placeholder": "مثال: كلب يمشي في حديقة عند الغروب بعدسة احترافية",
    "button.generate": "اعرض الصورة",
    "button.generating": "جارٍ التوليد...",
    "button.regenerate": "إعادة الإنشاء",
    
    // Actions
    "button.download": "تحميل",
    "button.video": "فيديو",
    "button.share": "مشاركة",
    "button.toggle.light": "الوضع الفاتح",
    "button.toggle.dark": "الوضع الداكن",
    
    // Messages
    "toast.empty": "من فضلك اكتب وصفًا للصورة.",
    "toast.error": "حدث خطأ أثناء التوليد. حاول مرة أخرى.",
    "toast.video.creating": "جارٍ إنشاء فيديو",
    "toast.video.wait": "قد يستغرق بضع ثوانٍ...",
    "toast.video.success": "تم إنشاء الفيديو وتحميله.",
    "toast.video.error": "تعذر إنشاء الفيديو في هذا المتصفح.",
    "toast.share.success": "تم نسخ رابط الصورة",
    "toast.share.error": "تعذر مشاركة الصورة",
    
    // History
    "history.title": "المحفوظات",
    "history.clear": "مسح الكل",
    "history.empty": "لا توجد صور محفوظة بعد",
    
    // Footer
    "footer.developer": "طور بواسطة",
    "footer.with": "بـ",
    
    // PWA
    "pwa.install": "احصل علي التطبيق",
    "pwa.download": "حمّله الآن",
    
    // Additional messages
    "toast.download.warning": "تنبيه",
    "toast.download.fallback": "تعذر تجهيز الصورة، سيتم تحميل الأصل.",
    "toast.image.error": "خطأ",
    "toast.image.load.error": "تعذر تحميل الصورة الآن. أعد المحاولة بعد ثوانٍ.",
    "toast.done": "تم"
  },
  en: {
    // Header
    "site.title": "ARABISH IMAGE CRAFT",
    "site.subtitle": "Write your description in Arabic and we'll translate it. Choose one image or up to 8 images with different styles at once.",
    
    // Input section
    "input.placeholder": "Example: A dog walking in a garden at sunset with professional lens",
    "button.generate": "Generate Image",
    "button.generating": "Generating...",
    "button.regenerate": "Regenerate",
    
    // Actions
    "button.download": "Download",
    "button.video": "Video",
    "button.share": "Share",
    "button.toggle.light": "Light Mode",
    "button.toggle.dark": "Dark Mode",
    
    // Messages
    "toast.empty": "Please write an image description.",
    "toast.error": "An error occurred during generation. Try again.",
    "toast.video.creating": "Creating video",
    "toast.video.wait": "This may take a few seconds...",
    "toast.video.success": "Video created and downloaded.",
    "toast.video.error": "Could not create video in this browser.",
    "toast.share.success": "Image link copied",
    "toast.share.error": "Could not share image",
    
    // History
    "history.title": "History",
    "history.clear": "Clear All",
    "history.empty": "No saved images yet",
    
    // Footer
    "footer.developer": "Developed by",
    "footer.with": "with",
    
    // PWA
    "pwa.install": "Get App",
    "pwa.download": "Download Now",
    
    // Additional messages
    "toast.download.warning": "Warning",
    "toast.download.fallback": "Could not process image, downloading original.",
    "toast.image.error": "Error",
    "toast.image.load.error": "Could not load image now. Try again in few seconds.",
    "toast.done": "Done"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("ar");

  const t = (key: string): string => {
    return translations[language][key] || translations.ar[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};