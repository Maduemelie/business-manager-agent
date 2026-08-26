import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

/**
 * Luxury glassmorphism status banner displaying real-time offline status.
 * Automatically informs users when the app is running 100% on-device from IndexedDB.
 * 
 * @param {Object} props
 * @param {boolean} [props.isOnline] - Optional override for network state
 */
export default function OfflineStatusBanner({ isOnline: isOnlineProp }) {
  const networkStatus = useNetworkStatus();
  const isOnline = isOnlineProp !== undefined ? isOnlineProp : networkStatus.isOnline;

  if (isOnline) {
    return null;
  }

  return (
    <div 
      className="offline-status-banner offline-banner" 
      data-testid="offline-status-banner"
      role="status"
      aria-live="polite"
    >
      <div className="offline-banner-content">
        <span className="offline-icon-pulse">
          <WifiOff size={18} aria-hidden="true" />
        </span>
        <span className="offline-banner-text">
          <strong>Offline Mode Active</strong> — Operating 100% On-Device from IndexedDB
        </span>
      </div>
    </div>
  );
}
