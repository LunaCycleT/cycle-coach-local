import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Download, Moon, MoreVertical, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const INSTALL_OFFER_KEY = 'luna_pwa_prompt_shown';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallOutcome = 'idle' | 'accepted' | 'dismissed' | 'installed';

interface InstallationState {
  /** True only when Luna is running as the installed app (standalone display). */
  standalone: boolean;
  /** True when the browser has offered its native install prompt. */
  canPrompt: boolean;
  outcome: InstallOutcome;
  installing: boolean;
  ready: boolean;
  offerVisible: boolean;
  showOffer: () => void;
  dismissOffer: () => void;
  install: () => Promise<void>;
  showInstructions: () => void;
}

const InstallationContext = createContext<InstallationState | null>(null);

function isPreviewContext() {
  const host = window.location.hostname;
  let framed = false;
  try { framed = window.self !== window.top; } catch { framed = true; }
  return !import.meta.env.PROD || framed || host.startsWith('id-preview--') || host.startsWith('preview--') ||
    host === 'lovableproject.com' || host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovableproject-dev.com') || host.endsWith('.beta.lovable.dev');
}

export function LunaInstallationProvider({ children }: { children: ReactNode }) {
  const [standalone, setStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [outcome, setOutcome] = useState<InstallOutcome>('idle');
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
    const updateStandalone = () => {
      const isStandalone = displayMode.matches || navigatorWithStandalone.standalone === true;
      setStandalone(isStandalone);
      if (isStandalone) setOfferVisible(false);
    };
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as InstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setCanPrompt(false);
      setOutcome('installed');
      setOfferVisible(false);
      setInstructions(false);
    };
    updateStandalone();
    setReady(true);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', updateStandalone);
    if ('serviceWorker' in navigator) {
      if (isPreviewContext()) {
        navigator.serviceWorker.getRegistrations()
          .then((regs) => regs.forEach((r) => { if (r.active?.scriptURL.endsWith('/sw.js')) r.unregister(); }))
          .catch(() => {});
      } else {
        // Network-only worker: no authenticated pages, API responses, or health data are cached.
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', updateStandalone);
    };
  }, []);

  const showOffer = () => {
    if (!ready || standalone || offeredRef.current) return;
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
    if (standalone || installing) return;
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
      const choice = await prompt.userChoice;
      // "accepted" only means the user agreed; appinstalled confirms the install.
      setOutcome((current) => (current === 'installed' ? current : choice.outcome));
    } catch {
      setInstallError(true);
      setInstructions(true);
    } finally {
      // A prompt event can only be used once; the browser may fire a new one later.
      promptRef.current = null;
      setCanPrompt(false);
      setInstalling(false);
    }
  };

  return (
    <InstallationContext.Provider value={{ standalone, canPrompt, outcome, installing, ready, offerVisible, showOffer, dismissOffer: () => setOfferVisible(false), install, showInstructions: () => setInstructions(true) }}>
      {children}
      <Dialog open={instructions && !standalone} onOpenChange={setInstructions}>
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
            <ol className="space-y-3 text-sm text-foreground list-decimal pl-5">
              <li>Open Luna in Chrome on your Android phone.</li>
              <li>Tap the <MoreVertical className="inline h-4 w-4 mx-1" aria-hidden="true" /> <strong>menu</strong> in the top corner.</li>
              <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then tap <strong>Install</strong>.</li>
              <li>Open Luna from the new icon on your home screen or app drawer.</li>
            </ol>
          )}
          <p className="text-sm text-muted-foreground">If you already installed Luna, open it from its home screen icon.</p>
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
  const { ready, standalone, offerVisible, showOffer, dismissOffer, install, installing } = useLunaInstallation();
  useEffect(() => {
    if (signedInReady && ready && !standalone) showOffer();
  }, [signedInReady, ready, standalone, showOffer]);

  if (!offerVisible || standalone) return null;
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
  const { standalone, canPrompt, outcome, install, installing, ready, showInstructions } = useLunaInstallation();
  return (
    <section aria-labelledby="installation-heading" className="space-y-3">
      <h2 id="installation-heading" className="text-lg font-semibold text-foreground">App Installation</h2>
      {standalone ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-luna-brand" />You’re using the installed Luna app.</p>
      ) : (
        <>
          {outcome === 'installed' && <p role="status" className="text-sm text-muted-foreground">Your browser finished adding Luna. Open it from your home screen or app drawer.</p>}
          {outcome === 'accepted' && <p role="status" className="text-sm text-muted-foreground">Installation started. Look for the Luna icon on your home screen in a moment.</p>}
          {outcome === 'dismissed' && <p role="status" className="text-sm text-muted-foreground">Installation was cancelled. You can try again any time.</p>}
          {canPrompt ? (
            <Button variant="outline" className="w-full" onClick={install} disabled={!ready || installing}><Download />{installing ? 'Opening…' : 'Install Luna'}</Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={showInstructions} disabled={!ready}><Download />Install Luna</Button>
          )}
          {!canPrompt && <p className="text-xs text-muted-foreground">Your browser hasn’t offered a one-tap install here, so we’ll show you how to add Luna from the browser menu.</p>}
        </>
      )}
    </section>
  );
}