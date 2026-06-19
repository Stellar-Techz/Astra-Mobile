import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

import { useClipsStore } from '@/stores/clips-store';

/**
 * Returns whether the device currently has internet connectivity.
 * Also triggers queue replay whenever connectivity is restored.
 */
export function useNetworkStatus(
  apiFn: Parameters<ReturnType<typeof useClipsStore.getState>['replayQueue']>[0],
) {
  const [isOnline, setIsOnline] = useState(true);
  const replayQueue = useClipsStore((s) => s.replayQueue);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);

      if (connected && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        replayQueue(apiFn);
      }

      if (!connected) {
        wasOfflineRef.current = true;
      }
    });

    return unsubscribe;
  }, [apiFn, replayQueue]);

  return isOnline;
}
