/**
 * Synthesized sound kit for the landing page. Every sound is generated with
 * Web Audio when it plays, so there are no audio files or licenses.
 *
 * Nothing here touches `window` or creates an AudioContext at import time, so
 * the module is safe on the server and in jsdom. Randomness (pitch, noise)
 * only runs inside `playSound`, which is called from event handlers.
 */

export const SOUND_NAMES = [
  'tap',
  'coin',
  'tear',
  'register',
  'whoosh',
  'thud',
  'notch',
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

/**
 * Recorded sounds, fetched and decoded once audio is unlocked. Until a sample
 * is ready, its fallback synth plays instead.
 */
export const SAMPLE_SOUNDS = {
  // One real mechanical key press and release, for the Q keycap.
  key: { url: '/sounds/quick-add-key.wav', fallback: 'tap' },
} as const satisfies Record<string, { url: string; fallback: SoundName }>;

export type SampleName = keyof typeof SAMPLE_SOUNDS;

export type LandingSoundName = SoundName | SampleName;

export function isSampleName(name: LandingSoundName): name is SampleName {
  return Object.hasOwn(SAMPLE_SOUNDS, name);
}

/** Fetches and decodes a sample, or `null` if that fails. */
export async function loadSample(
  ctx: BaseAudioContext,
  url: string,
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await ctx.decodeAudioData(await response.arrayBuffer());
  } catch {
    return null;
  }
}

/** Plays a decoded sample now, pitched like the synths. Never throws. */
export function playBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  pitch = 1,
) {
  try {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = pitch;
    src.connect(masterGain(ctx));
    src.start(ctx.currentTime + 0.005);
  } catch {
    // Audio is decoration; a failed node must not break the interaction.
  }
}

export const PITCH_VARIANCE = 0.04;

/** A pitch multiplier within ±4%. Call from event handlers only. */
export function randomPitch(random: () => number = Math.random): number {
  return 1 + (random() * 2 - 1) * PITCH_VARIANCE;
}

type AudioContextCtor = typeof AudioContext;

/** Creates an AudioContext, or `null` where Web Audio is unavailable. */
export function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

const masters = new WeakMap<BaseAudioContext, GainNode>();
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function masterGain(ctx: BaseAudioContext): GainNode {
  let gain = masters.get(ctx);
  if (!gain) {
    gain = ctx.createGain();
    gain.gain.value = 0.5;
    gain.connect(ctx.destination);
    masters.set(ctx, gain);
  }
  return gain;
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** Percussive gain envelope routed to the master bus. */
function envelope(
  ctx: BaseAudioContext,
  start: number,
  peak: number,
  attack: number,
  decay: number,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  gain.connect(masterGain(ctx));
  return gain;
}

type ToneOptions = {
  type: OscillatorType;
  from: number;
  to?: number;
  start: number;
  peak: number;
  decay: number;
  attack?: number;
};

function tone(
  ctx: BaseAudioContext,
  { type, from, to = from, start, peak, decay, attack = 0.004 }: ToneOptions,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) {
    osc.frequency.exponentialRampToValueAtTime(to, start + attack + decay);
  }
  osc.connect(envelope(ctx, start, peak, attack, decay));
  osc.start(start);
  osc.stop(start + attack + decay + 0.02);
}

type NoiseOptions = {
  start: number;
  duration: number;
  peak: number;
  filter: BiquadFilterType;
  freqFrom: number;
  freqTo?: number;
  q?: number;
  attack?: number;
};

function noiseBurst(
  ctx: BaseAudioContext,
  {
    start,
    duration,
    peak,
    filter,
    freqFrom,
    freqTo = freqFrom,
    q = 1,
    attack = 0.003,
  }: NoiseOptions,
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(freqFrom, start);
  if (freqTo !== freqFrom) {
    biquad.frequency.exponentialRampToValueAtTime(freqTo, start + duration);
  }
  src.connect(biquad);
  biquad.connect(envelope(ctx, start, peak, attack, duration));
  // Random offset into the 1s buffer so repeats don't sound identical.
  src.start(start, Math.random() * 0.4, attack + duration + 0.02);
}

type Synth = (ctx: BaseAudioContext, t: number, pitch: number) => void;

/**
 * One microswitch snap: a very short, bright crack of noise, the plastic
 * shell's ping, and a little low body. `level` scales the whole snap.
 */
function switchSnap(
  ctx: BaseAudioContext,
  t: number,
  p: number,
  level: number,
) {
  noiseBurst(ctx, {
    start: t,
    duration: 0.008,
    attack: 0.0008,
    peak: 0.55 * level,
    filter: 'bandpass',
    freqFrom: 3800 * p,
    q: 1.8,
  });
  tone(ctx, {
    type: 'sine',
    from: 2300 * p,
    to: 1700 * p,
    start: t,
    attack: 0.0008,
    peak: 0.07 * level,
    decay: 0.018,
  });
  noiseBurst(ctx, {
    start: t,
    duration: 0.022,
    attack: 0.001,
    peak: 0.2 * level,
    filter: 'lowpass',
    freqFrom: 650 * p,
  });
}

const SYNTHS: Record<SoundName, Synth> = {
  // Mouse click, modeled on recorded clicks: a sharp snap when the switch goes
  // down, then a quieter, slightly higher one when it comes back up.
  tap: (ctx, t, p) => {
    switchSnap(ctx, t, p, 1);
    switchSnap(ctx, t + 0.07 + (p - 1) * 0.4, p * 1.08, 0.45);
  },
  // Coin clink: two bright partials a fifth apart with a short shimmer.
  coin: (ctx, t, p) => {
    tone(ctx, {
      type: 'triangle',
      from: 1318 * p,
      start: t,
      peak: 0.18,
      decay: 0.12,
    });
    tone(ctx, {
      type: 'sine',
      from: 1976 * p,
      start: t + 0.07,
      peak: 0.22,
      decay: 0.45,
    });
    tone(ctx, {
      type: 'sine',
      from: 3951 * p,
      start: t + 0.07,
      peak: 0.05,
      decay: 0.2,
    });
  },
  // Receipt tear: a quick run of high, crackly noise grains.
  tear: (ctx, t, p) => {
    for (let i = 0; i < 8; i++) {
      noiseBurst(ctx, {
        start: t + i * 0.028,
        duration: 0.022,
        peak: i % 2 === 0 ? 0.22 : 0.14,
        filter: 'bandpass',
        freqFrom: (2600 + i * 180) * p,
        q: 1.4,
        attack: 0.002,
      });
    }
  },
  // Cash register: a mechanical thunk, then a two-note bell.
  register: (ctx, t, p) => {
    noiseBurst(ctx, {
      start: t,
      duration: 0.08,
      peak: 0.35,
      filter: 'lowpass',
      freqFrom: 700,
    });
    tone(ctx, {
      type: 'triangle',
      from: 180 * p,
      to: 90 * p,
      start: t,
      peak: 0.28,
      decay: 0.08,
    });
    noiseBurst(ctx, {
      start: t + 0.05,
      duration: 0.06,
      peak: 0.08,
      filter: 'highpass',
      freqFrom: 5000,
    });
    tone(ctx, {
      type: 'sine',
      from: 2093 * p,
      start: t + 0.09,
      peak: 0.18,
      decay: 0.5,
    });
    tone(ctx, {
      type: 'sine',
      from: 2637 * p,
      start: t + 0.16,
      peak: 0.16,
      decay: 0.7,
    });
  },
  // Air past a paper plane: filtered noise that swells and sweeps up.
  whoosh: (ctx, t, p) => {
    noiseBurst(ctx, {
      start: t,
      duration: 0.32,
      attack: 0.16,
      peak: 0.3,
      filter: 'bandpass',
      freqFrom: 400 * p,
      freqTo: 1800 * p,
      q: 0.9,
    });
  },
  // Soft landing: a falling sine body with a muffled noise hit.
  thud: (ctx, t, p) => {
    tone(ctx, {
      type: 'sine',
      from: 150 * p,
      to: 50 * p,
      start: t,
      peak: 0.5,
      decay: 0.22,
      attack: 0.005,
    });
    noiseBurst(ctx, {
      start: t,
      duration: 0.1,
      peak: 0.22,
      filter: 'lowpass',
      freqFrom: 300,
    });
  },
  // Detent tick, like a ratchet or a dial clicking past a stop: a soft,
  // woody knock with a muted rattle, much gentler than the mouse click.
  notch: (ctx, t, p) => {
    tone(ctx, {
      type: 'triangle',
      from: 620 * p,
      to: 420 * p,
      start: t,
      attack: 0.001,
      peak: 0.16,
      decay: 0.035,
    });
    noiseBurst(ctx, {
      start: t,
      duration: 0.018,
      attack: 0.001,
      peak: 0.12,
      filter: 'bandpass',
      freqFrom: 1400 * p,
      q: 3,
    });
  },
};

/** Schedules one sound now. Never throws into UI handlers. */
export function playSound(ctx: BaseAudioContext, name: SoundName, pitch = 1) {
  try {
    SYNTHS[name](ctx, ctx.currentTime + 0.005, pitch);
  } catch {
    // Audio is decoration; a failed node must not break the interaction.
  }
}
