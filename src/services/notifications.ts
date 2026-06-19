import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show banner for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('clip-status', {
    name: 'Clip processing',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function notifyJobDone(jobId: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Clips ready!',
      body: 'Your video has been processed. Tap to review your clips.',
      data: { jobId, screen: 'curation' },
    },
    trigger: null,
  });
}

export async function notifyJobFailed(jobId: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '❌ Processing failed',
      body: 'Something went wrong. Tap to view details.',
      data: { jobId, screen: 'curation' },
    },
    trigger: null,
  });
}
