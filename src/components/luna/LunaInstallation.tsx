import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Download, Moon, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const INSTALL_OFFER_KEY = 'luna_pwa_prompt_shown';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallationState {
  installed: boolean;
  installing: boolean;
  ready: boolean;
  offerVisible: boolean;
  showOffer: () => void;
  dismissOffer: () => void;
  install: () => Promise<void>;
}

const InstallationContext = createContext<InstallationState | null>(null);

export function LunaInstallationProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [ready, setReady] = useState(false);
  const [offerVisible, setOfferVisible] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [ios, setIos] = useState(false);
  const [safari, setSafari] = useState(false);
  const [installError, setInstallError] = useState(false);
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const offeredRef = useRef(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIos(isIos);
    setSafari(/Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent));
    const updateInstalled = () => {
      const standalone = displayMode.matches || navigatorWithStandalone.standalone === true;
      setInstalled(standalone);
      if (standalone) setOfferVisible(false);
    };
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      promptRef.current = null;
      setInstalled(true);
      setOfferVisible(false);
      setInstructions(false);
    };
    updateInstalled();
    setReady(true);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', updateInstalled);
    if ('serviceWorker' in navigator) {
      // No authenticated pages, API responses, or health data are cached.
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', updateInstalled);
    };
  }, []);

  const showOffer = () => {
    if (!ready || installed || offeredRef.current) return;
    offeredRef.current = true;
    try {
      if (localStorage.getItem(INSTALL_OFFER_KEY) || localStorage.getItem('luna_pwa_prompt_dismissed')) return;
      localStorage.setItem(INSTALL_OFFER_KEY, 'true');
    } catch {
      // Restricted storage still allows installation and suppresses repeats this session.
    }
    setOfferVisible(true);
  };

  const install = async () => {
    if (installed || installing) return;
    setOfferVisible(false);
    setInstallError(false);
    const prompt = promptRef.current;
    if (!prompt) {
      setInstructions(true);
      return;
    }
    setInstalling(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setInstallError(true);
      setInstructions(true);
    } finally {
      promptRef.current = null;
      setInstalling(false);
    }
  };

  return (
    <InstallationContext.Provider value={{ installed, installing, ready, offerVisible, showOffer, dismissOffer: () => setOfferVisible(false), install }}>
      {children}
      <Dialog open={instructions && !installed} onOpenChange={setInstructions}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-lg">
          <DialogHeader>
            <Moon className="mb-3 h-8 w-8 text-luna-brand" />
            <DialogTitle className="tracking-normal">Install Luna</DialogTitle>
            <DialogDescription>Add Luna to your home screen.</DialogDescription>
          </DialogHeader>
          {installError && <p role="status" className="text-sm text-muted-foreground">The installation prompt couldn’t open. You can use your browser’s menu instead.</p>}
          {ios ? (
            <ol className="space-y-3 text-sm text-foreground list-decimal pl-5">
              {!safari && <li>Open Luna in Safari.</li>}
              <li>Tap <Share className="inline h-4 w-4 mx-1" aria-hidden="true" /> <strong>Share</strong> in Safari.</li>
              <li>Choose <strong>Add to Home Screen</strong> (you may need to scroll).</li>
              <li>Tap <strong>Add</strong> to confirm.</li>
            </ol>
          ) : (
            <div className="space-y-3 text-sm text-foreground">
              <p>Open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</p>
              <p className="text-muted-foreground">If that option isn’t available, try opening Luna in Chrome or Edge. Some browsers don’t support installation.</p>
            </div>
          )}
          <Button onClick={() => setInstructions(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </InstallationContext.Provider>
  );
}

export function useLunaInstallation() {
  const context = useContext(InstallationContext);
  if (!context) throw new Error('Luna installation requires its provider');
  return context;
}

export function LunaInstallOffer({ signedInReady }: { signedInReady: boolean }) {
  const { ready, installed, offerVisible, showOffer, dismissOffer, install, installing } = useLunaInstallation();
  useEffect(() => {
    if (signedInReady && ready && !installed) showOffer();
  }, [signedInReady, ready, installed, showOffer]);

  if (!offerVisible || installed) return null;
  return (
    <aside aria-label="Luna home screen installation" className="relative mx-6 mt-6 rounded-lg border border-luna-brand/20 bg-card p-4 text-card-foreground">
      <Button variant="ghost" size="icon" aria-label="Dismiss installation offer" className="absolute right-1 top-1" onClick={dismissOffer}><X /></Button>
      <div className="flex items-start gap-3 pr-7">
        <Moon className="mt-1 h-6 w-6 shrink-0 text-luna-brand" />
        <h2 className="text-base font-semibold">Add Luna to your home screen</h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="bg-luna-brand text-luna-brand-foreground hover:bg-luna-brand/90" onClick={install} disabled={installing}><Download />Add to home screen</Button>
        <Button variant="ghost" onClick={dismissOffer}>Dismiss</Button>
      </div>
    </aside>
  );
}

export function LunaInstallSettings() {
  const { installed, install, installing, ready } = useLunaInstallation();
  return (
    <section aria-labelledby="installation-heading" className="space-y-3">
      <h2 id="installation-heading" className="text-lg font-semibold text-foreground">App Installation</h2>
      {installed ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-luna-brand" />Luna is installed on this device</p>
      ) : (
        <Button variant="outline" className="w-full" onClick={install} disabled={!ready || installing}><Download />{installing ? 'Installing…' : 'Install Luna'}</Button>
      )}
    </section>
  );
}