import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

interface ShareButtonProps {
  imageUrl: string;
  description?: string;
  style?: string;
  prompt?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ imageUrl, description, style, prompt }) => {
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      // إنشاء ID للصورة يحتوي على بياناتها
      const imageData = {
        url: imageUrl,
        prompt: prompt || description || '',
        style: style || '',
        timestamp: Date.now()
      };
      
      const encodedData = btoa(JSON.stringify(imageData));
      const shareUrl = `${window.location.origin}/image/${encodedData}`;
      
      const shareData = {
        title: t("site.title"),
        text: t("site.subtitle"),
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t("toast.share.success"),
          description: shareUrl,
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: t("toast.share.error"),
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="flex items-center gap-2"
    >
      <Share2 className="h-4 w-4" />
      {t("button.share")}
    </Button>
  );
};