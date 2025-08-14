import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstallable, setIsInstallable] = useState(true); // اظهار الزر دائماً
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    // فحص ما إذا كان التطبيق مثبت بالفعل
    const checkIfInstalled = () => {
      // فحص طريقة العرض
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsAlreadyInstalled(true);
        setIsInstallable(false);
        return;
      }
      
      // فحص navigator.standalone لسفاري
      if ('standalone' in window.navigator && (window.navigator as any).standalone) {
        setIsAlreadyInstalled(true);
        setIsInstallable(false);
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsAlreadyInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // إذا كان متاح البرومبت المحفوظ
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setIsAlreadyInstalled(true);
      }
      
      setDeferredPrompt(null);
    } else {
      // إرشادات يدوية للتثبيت
      let instructions = '';
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        instructions = 'في متصفح Chrome: اضغط على القائمة (⋮) ← "تثبيت التطبيق"';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        instructions = 'في متصفح Safari: اضغط على زر المشاركة ← "إضافة إلى الشاشة الرئيسية"';
      } else if (userAgent.includes('firefox')) {
        instructions = 'في متصفح Firefox: اضغط على القائمة ← "تثبيت"';
      } else {
        instructions = 'يمكنك تثبيت التطبيق من قائمة المتصفح';
      }
      
      alert(instructions);
    }
    
    setShowInstallModal(false);
  };

  // إخفاء الزر إذا كان التطبيق مثبت بالفعل
  if (isAlreadyInstalled) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowInstallModal(true)}
        className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
      >
        <Download className="w-4 h-4 ml-2" />
        احصل علي التطبيق
      </Button>

      <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
        <DialogContent className="sm:max-w-md mx-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold mb-4">
              حمّل تطبيق ARABISH IMAGE CRAFT
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center">
              <img 
                src="/lovable-uploads/b04ed2fa-16d4-4936-97ea-f5d4e9f30034.png" 
                alt="AIC App Icon" 
                className="w-16 h-16 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">مولد الصور بالذكاء الاصطناعي</h3>
              <p className="text-muted-foreground text-sm">
                احصل على تجربة أفضل مع التطبيق المحمول
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-muted-foreground">
              <div className="flex items-center">
                <Smartphone className="w-4 h-4 ml-1" />
                <span>يعمل بدون إنترنت</span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 ml-1" />
                <span>سريع ومريح</span>
              </div>
            </div>

            <Button 
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              <Download className="w-5 h-5 ml-2" />
              حمّله الآن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};