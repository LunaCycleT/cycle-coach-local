import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INSTALL_OFFER_KEY, LunaInstallationProvider, LunaInstallOffer, LunaInstallSettings } from '@/components/luna/LunaInstallation';

function renderInstallation(signedInReady = true) {
  return render(<LunaInstallationProvider><LunaInstallOffer signedInReady={signedInReady} /><LunaInstallSettings /></LunaInstallationProvider>);
}

describe('Luna installation', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('does not offer installation before a successful sign-in', () => {
    renderInstallation(false);
    expect(screen.queryByLabelText('Luna home screen installation')).not.toBeInTheDocument();
    expect(localStorage.getItem(INSTALL_OFFER_KEY)).toBeNull();
  });

  it('records first display and never automatically repeats after reload', () => {
    const view = renderInstallation();
    expect(screen.getByLabelText('Luna home screen installation')).toBeInTheDocument();
    expect(localStorage.getItem(INSTALL_OFFER_KEY)).toBe('true');
    view.unmount();
    renderInstallation();
    expect(screen.queryByLabelText('Luna home screen installation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Install Luna' })).toBeEnabled();
  });

  it('dismisses the offer but keeps installation available in Profile', () => {
    renderInstallation();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByLabelText('Luna home screen installation')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Install Luna' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Install app');
  });

  it('opens the captured native prompt only after user approval', async () => {
    renderInstallation();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Add to home screen' })); });
    expect(prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Luna is installed on this device')).not.toBeInTheDocument();
  });

  it('shows iPhone Safari Share instructions', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1');
    renderInstallation();
    fireEvent.click(screen.getByRole('button', { name: 'Add to home screen' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Share');
    expect(dialog).toHaveTextContent('Add to Home Screen');
  });

  it('suppresses the offer when already in standalone mode', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: true, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
    renderInstallation();
    expect(screen.queryByLabelText('Luna home screen installation')).not.toBeInTheDocument();
    expect(screen.getByText('Luna is installed on this device')).toBeInTheDocument();
  });

  it('updates Profile when the browser completes installation', () => {
    renderInstallation();
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(screen.queryByLabelText('Luna home screen installation')).not.toBeInTheDocument();
    expect(screen.getByText('Luna is installed on this device')).toBeInTheDocument();
  });
});