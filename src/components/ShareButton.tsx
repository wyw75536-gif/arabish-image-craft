import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

interface ShareButtonProps {
  imageUrl: string;
  description?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ imageUrl, description }) => {
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      const shareData = {
        title: t("site.title"),
        text: description || t("site.subtitle"),
        url: imageUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(imageUrl);
        toast({
          title: t("toast.share.success"),
          description: imageUrl,
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