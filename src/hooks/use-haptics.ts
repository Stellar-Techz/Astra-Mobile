import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isPhysicalDevice = Platform.OS !== 'web' && Device.isDevice;

function guard(fn: () => Promise<void>) {
  if (!isPhysicalDevice) return;
  fn().catch(() => {});
}

export const useHaptics = () => ({
  /** Toggle / selection feedback */
  selection: () =>
    guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** Primary CTA buttons (Post, Upload, Finalize & Post) */
  action: () =>
    guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** Completed mint or payout */
  success: () =>
    guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  /** Failed operation */
  error: () =>
    guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
});
