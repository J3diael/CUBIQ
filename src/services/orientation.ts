import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * CUBIQ is a portrait app; only the Timer tab may rotate, when the user allows it.
 * Failures (for example on web, where locking needs fullscreen) are ignored.
 */
export function lockPortrait(): void {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export function allowAnyOrientation(): void {
  ScreenOrientation.unlockAsync().catch(() => {});
}
