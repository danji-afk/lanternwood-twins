// Original, short WebAudio cues; no recordings, downloads, or audio dependencies.
// The AudioContext is created on the first genuine gesture and resumed if the browser suspended
// it, so a page that has never been touched never logs an autoplay warning.
export function createAudio() {
  let context;
  let muted = false;
  function unlock() {
    try {
      if (!context) {
        const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Ctor) return;
        context = new Ctor();
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* The game remains playable without an audio device. */ }
  }
  function tone(frequency, delay, duration, shape = 'sine', volume = 0.09) {
    if (muted || !context || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }
  return {
    unlock,
    setMuted(value) { muted = value; },
    play(kind) {
      if (kind === 'found') { tone(659.25, 0, 0.25); tone(987.77, 0.10, 0.4); }
      if (kind === 'wrong') { tone(105, 0, 0.19, 'sawtooth', 0.045); tone(98, 0.06, 0.22, 'triangle', 0.05); }
      if (kind === 'hint') { tone(440, 0, 0.45, 'sine', 0.055); tone(554.37, 0.3, 0.6, 'sine', 0.045); }
      if (kind === 'complete') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.65, 'triangle', 0.075));
    },
  };
}
