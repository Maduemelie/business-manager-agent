import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

/**
 * PWA Install Prompt Button component.
 * Captures the 'beforeinstallprompt' browser event and provides a native-like installation trigger.
 */
export default function InstallPromptButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      // Prevent standard mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show native browser install prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <button
      className="btn-install-pwa"
      data-testid="install-pwa-btn"
      onClick={handleInstallClick}
      title="Install SirviniStyles PWA to your device"
    >
      <Download size={16} aria-hidden="true" />
      <span>Install App</span>
    </button>
  );
}
