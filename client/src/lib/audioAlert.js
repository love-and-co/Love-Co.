// Love & Co. Web Audio API Botanical Chime Synthesizer & Sound Player
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playOrderChime() {
  if (typeof window === 'undefined') return;

  try {
    // Try Web Audio API synthesized dual-tone harmonic chime
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Note 2: A5 (880 Hz) harmonic chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.28, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 1.6);

      // Note 3: F#6 (1479.98 Hz) delicate bell shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1479.98, now + 0.24);
      gain3.gain.setValueAtTime(0.12, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 1.8);
      return;
    }
  } catch (err) {
    // Fallback to HTML Audio
    try {
      const audio = new Audio('/sounds/order-chime.mp3');
      audio.play().catch(() => {});
    } catch (_) {}
  }
}
