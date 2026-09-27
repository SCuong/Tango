/**
 * Tango — Optional Tactile Audio Feedback (Off by Default)
 *
 * Governed by:
 * - docs/DESIGN_SYSTEM.md (§12.3)
 * - docs/ARCHITECTURE.md (§4.4)
 * - docs/PRODUCT_SPEC.md (§6.3)
 *
 * A tiny Web Audio synthesizer: a soft ceramic tap for correct answers and a gentle
 * low wooden tone for incorrect ones, each under 200ms with soft attack and decay.
 * Callers only invoke it when `soundEnabled` is true; playback never blocks the UI.
 */

type FeedbackSound = 'correct' | 'incorrect';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

interface Tone {
  frequency: number;
  startOffset: number;
  duration: number;
  peak: number;
}

const TONES: Record<FeedbackSound, Tone[]> = {
  // Two quick, warm partials: a light ceramic "tink"
  correct: [
    { frequency: 880, startOffset: 0, duration: 0.14, peak: 0.08 },
    { frequency: 1320, startOffset: 0.045, duration: 0.12, peak: 0.05 },
  ],
  // One soft, low wooden tap
  incorrect: [{ frequency: 220, startOffset: 0, duration: 0.18, peak: 0.09 }],
};

/** Plays a feedback sound without awaiting it. Errors are swallowed (visuals stay authoritative). */
export function playFeedbackSound(kind: FeedbackSound): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + 0.005;
    for (const tone of TONES[kind]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = tone.frequency;
      const t0 = start + tone.startOffset;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(tone.peak, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(t0);
      oscillator.stop(t0 + tone.duration + 0.02);
    }
  } catch {
    // Sound is optional feedback; never let it break the quiz flow
  }
}
