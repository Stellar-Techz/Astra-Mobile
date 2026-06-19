import { useEffect } from 'react';

import {
  requestNotificationPermissions,
  setupAndroidChannel,
} from '@/services/notifications';

/**
 * Call this hook in the onboarding flow to request push notification
 * permissions at the appropriate point (e.g., after the user signs in).
 */
export function useNotificationSetup() {
  useEffect(() => {
    (async () => {
      await setupAndroidChannel();
      await requestNotificationPermissions();
    })();
  }, []);
}
