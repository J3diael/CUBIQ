import { playHaptic, type HapticCue } from './haptics';
import { playSound, type SoundCue } from './sounds';

export type FeedbackCue = Extract<HapticCue, SoundCue>;

/** Haptic and sound feedback for a timer event; each respects its own setting. */
export function feedback(cue: FeedbackCue): void {
  playHaptic(cue);
  playSound(cue);
}
