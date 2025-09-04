import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Share2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ImageData {
  url: string;
  prompt: string;
  style: string;
  timestamp: number;
}

const ImageView = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const { language, t } = useLanguage();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageId) return;
    
    try {
      // فك تشفير بيانات الصورة من الـ ID
      const decoded = atob(imageId);
      const data = JSON.parse(decoded);
      setImageData(data);
    } catch (error) {
      console.error('Error decoding image data:', error);
    } finally {
      setLoading(false);
    }
  }, [imageId]);

  const handleDownload = async () => {
    if (!imageData) return;
    
    try {
      const response = await fetch(imageData.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arabish-image-craft-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('site.title'),
          text: t('site.subtitle'),
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
      } catch (error) {
        console.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{language === 'ar' ? 'الصورة غير موجودة' : 'Image Not Found'}</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={imageData.url}
                alt={imageData.prompt}
                className="w-full h-auto"
                style={{ maxHeight: '80vh', objectFit: 'contain' }}
              />
              
              {/* العلامة المائية */}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
                Arabish Image Craft
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h1 className="text-xl font-bold mb-2">{imageData.style}</h1>
                <p className="text-muted-foreground">{imageData.prompt}</p>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تحميل' : 'Download'}
                </Button>
                
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'مشاركة' : 'Share'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageView;