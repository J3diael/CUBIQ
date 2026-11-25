import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/store/settings-store';

export type HapticCue = 'ready' | 'stop' | 'warning' | 'select' | 'record';

/**
 * Fire-and-forget haptic feedback, respecting the user's setting.
 * Always called after the timestamp it relates to has been recorded, never before.
 */
export function playHaptic(cue: HapticCue): void {
  if (!useSettingsStore.getState().timer.hapticsEnabled) return;
  const promise =
    cue === 'ready'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      : cue === 'stop'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : cue === 'warning'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          : cue === 'record'
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            : Haptics.selectionAsync();
  // Devices without a vibration motor reject; that is fine.
  promise.catch(() => {});
}
