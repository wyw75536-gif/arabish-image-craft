import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
      className="font-medium"
    >
      {language === "ar" ? "English" : "عربي"}
    </Button>
  );
};