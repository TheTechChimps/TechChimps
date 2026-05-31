type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

export async function primeNotificationSound() {
  const context = getAudioContext();
  if (!context || context.state !== "suspended") return;

  try {
    await context.resume();
  } catch {
    // Browser audio permissions are gesture-based, so failing quietly keeps chat usable.
  }
}

export async function playGentleChimpChime() {
  const context = getAudioContext();
  if (!context) return;

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    const now = context.currentTime;
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const notes = [392, 523.25, 659.25];

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1600, now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);

    filter.connect(master);
    master.connect(context.destination);

    notes.forEach((frequency, index) => {
      const start = now + index * 0.11;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.detune.setValueAtTime(index === 0 ? -4 : index === 2 ? 5 : 0, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);

      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(start);
      oscillator.stop(start + 0.68);
    });
  } catch {
    // Notification sounds are a tiny enhancement; chat must never depend on them.
  }
}
