import type { Track } from '../game/types';

/**
 * Preview builds (EXPO_PUBLIC_DEMO=1) play original tracks synthesized on the device instead of
 * streaming from Audius. They exist so the app can run where outside services are unreachable,
 * such as a sandboxed web preview. Every title and artist here is made up.
 */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

export const DEMO_RATE = 16_000;
const DURATION = 60;

type Wave = 'sine' | 'square' | 'saw' | 'tri';
type Drums = 'four' | 'boom' | 'trap' | 'break' | 'soft';

type Spec = {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  root: number;
  minor: boolean;
  lead: Wave;
  bass: Wave;
  drums: Drums;
  pad: boolean;
  colors: [string, string];
};

const SPECS: Spec[] = [
  { title: 'Basement Frequencies', artist: 'Lowlight', genre: 'Electronic', bpm: 124, root: 57, minor: true, lead: 'saw', bass: 'square', drums: 'four', pad: true, colors: ['#4FD8FF', '#0B2A4A'] },
  { title: 'Concrete Lullaby', artist: 'mxrrow', genre: 'Lo-Fi', bpm: 78, root: 60, minor: false, lead: 'tri', bass: 'sine', drums: 'soft', pad: true, colors: ['#A9B8FF', '#20163F'] },
  { title: 'Night Bus Home', artist: 'Kaya Vex', genre: 'Hip-Hop/Rap', bpm: 88, root: 55, minor: true, lead: 'square', bass: 'sine', drums: 'boom', pad: false, colors: ['#FFD84A', '#3A1F00'] },
  { title: 'Neon Ghosts', artist: 'drexl.wav', genre: 'Hyperpop', bpm: 150, root: 64, minor: false, lead: 'square', bass: 'saw', drums: 'four', pad: true, colors: ['#FF8FE9', '#2C0A3A'] },
  { title: 'Paper Crowns', artist: 'Saint Odd', genre: 'Trap', bpm: 140, root: 53, minor: true, lead: 'tri', bass: 'sine', drums: 'trap', pad: false, colors: ['#FF7A45', '#2A0A00'] },
  { title: 'Tape Hiss Heart', artist: 'cassette.boi', genre: 'Lo-Fi', bpm: 72, root: 62, minor: true, lead: 'sine', bass: 'tri', drums: 'soft', pad: true, colors: ['#C9F06B', '#1B2A05'] },
  { title: 'Underpass', artist: 'Juno Grey', genre: 'Drum & Bass', bpm: 172, root: 52, minor: true, lead: 'saw', bass: 'sine', drums: 'break', pad: true, colors: ['#7CFFB2', '#00261A'] },
  { title: '808 Confessions', artist: 'Rook City', genre: 'Trap', bpm: 136, root: 50, minor: true, lead: 'square', bass: 'sine', drums: 'trap', pad: false, colors: ['#FF6B6B', '#2A0606'] },
  { title: 'Velvet Static', artist: 'Mira Lune', genre: 'R&B/Soul', bpm: 92, root: 58, minor: false, lead: 'sine', bass: 'tri', drums: 'boom', pad: true, colors: ['#FFB86B', '#2E1600'] },
  { title: 'Back Alley Choir', artist: 'OHMNI', genre: 'Experimental', bpm: 110, root: 61, minor: true, lead: 'tri', bass: 'saw', drums: 'break', pad: true, colors: ['#B57BFF', '#1A0B33'] },
  { title: 'Cold Signal', artist: 'dusk.exe', genre: 'Electronic', bpm: 128, root: 59, minor: true, lead: 'square', bass: 'saw', drums: 'four', pad: false, colors: ['#4FD8FF', '#002A33'] },
  { title: 'Rooftop Prayers', artist: 'Tavi Blu', genre: 'Hip-Hop/Rap', bpm: 84, root: 57, minor: false, lead: 'tri', bass: 'sine', drums: 'boom', pad: true, colors: ['#FFD84A', '#202000'] },
  { title: 'Grainy Polaroids', artist: 'Fenn', genre: 'Alternative', bpm: 116, root: 64, minor: false, lead: 'saw', bass: 'tri', drums: 'boom', pad: true, colors: ['#FF6B6B', '#331A00'] },
  { title: 'Low End Theory II', artist: 'Bassment Kid', genre: 'House', bpm: 122, root: 48, minor: true, lead: 'sine', bass: 'square', drums: 'four', pad: true, colors: ['#FF5FD2', '#2A0022'] },
  { title: 'Moth to Flame', artist: 'Ivory Ash', genre: 'Alternative', bpm: 100, root: 56, minor: true, lead: 'saw', bass: 'sine', drums: 'boom', pad: false, colors: ['#FF8A5B', '#240B05'] },
  { title: 'Subway Echoes', artist: 'Rook City', genre: 'Trap', bpm: 144, root: 55, minor: true, lead: 'sine', bass: 'sine', drums: 'trap', pad: true, colors: ['#FF7A45', '#1E1E1E'] },
  { title: 'Pixel Rain', artist: 'glasshour', genre: 'Hyperpop', bpm: 160, root: 66, minor: false, lead: 'tri', bass: 'square', drums: 'four', pad: false, colors: ['#FF8FE9', '#08263A'] },
  { title: 'Midnight Rotation', artist: 'Kaya Vex', genre: 'Hip-Hop/Rap', bpm: 94, root: 52, minor: true, lead: 'saw', bass: 'sine', drums: 'boom', pad: true, colors: ['#FFD84A', '#14001F'] },
  { title: 'Rust & Gold', artist: 'Saint Odd', genre: 'Trap', bpm: 130, root: 58, minor: false, lead: 'square', bass: 'sine', drums: 'trap', pad: true, colors: ['#FFC93C', '#2B1400'] },
  { title: 'Static Bloom', artist: 'Lowlight', genre: 'Electronic', bpm: 118, root: 62, minor: false, lead: 'tri', bass: 'square', drums: 'four', pad: true, colors: ['#B8FF3C', '#0B1A12'] },
];

function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function osc(wave: Wave, cycles: number): number {
  const p = cycles - Math.floor(cycles);
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'square':
      return p < 0.5 ? 0.6 : -0.6;
    case 'saw':
      return (2 * p - 1) * 0.6;
    case 'tri':
      return 1 - 4 * Math.abs(p - 0.5);
  }
}

function tone(buf: Float32Array, start: number, dur: number, freq: number, wave: Wave, gain: number, attack = 0.01, release = 0.06) {
  const s0 = Math.floor(start * DEMO_RATE);
  const n = Math.min(Math.floor(dur * DEMO_RATE), buf.length - s0);
  for (let i = 0; i < n; i++) {
    const t = i / DEMO_RATE;
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    buf[s0 + i] += osc(wave, freq * t) * gain * env;
  }
}

function kick(buf: Float32Array, start: number, gain: number) {
  const s0 = Math.floor(start * DEMO_RATE);
  const n = Math.min(Math.floor(0.32 * DEMO_RATE), buf.length - s0);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / DEMO_RATE;
    phase += (45 + 90 * Math.exp(-t * 28)) / DEMO_RATE;
    buf[s0 + i] += Math.sin(2 * Math.PI * phase) * Math.exp(-t * 8) * gain;
  }
}

function noiseHit(buf: Float32Array, start: number, gain: number, decay: number, body: number, random: () => number) {
  const s0 = Math.floor(start * DEMO_RATE);
  const n = Math.min(Math.floor((6 / decay) * DEMO_RATE), buf.length - s0);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / DEMO_RATE;
    const white = random() * 2 - 1;
    const bright = white - prev;
    prev = white;
    const tonal = body ? Math.sin(2 * Math.PI * body * t) * 0.5 : 0;
    buf[s0 + i] += ((body ? white : bright) + tonal) * Math.exp(-t * decay) * gain;
  }
}

/** Synthesizes one demo track as mono samples in [-1, 1]. Deterministic per index. */
export function renderDemo(index: number, seconds = DURATION): Float32Array {
  const spec = SPECS[index % SPECS.length];
  const random = rng(index * 9973 + 17);
  const buf = new Float32Array(Math.floor(seconds * DEMO_RATE));
  const beat = 60 / spec.bpm;
  const bar = beat * 4;
  const scale = spec.minor ? MINOR : MAJOR;
  const note = (degree: number, octave: number) => {
    const o = Math.floor(degree / scale.length);
    const d = ((degree % scale.length) + scale.length) % scale.length;
    return spec.root + 12 * (o + octave) + scale[d];
  };
  const pool = [3, 4, 5, 2, 6];
  const progression = [0, pool[Math.floor(random() * 5)], pool[Math.floor(random() * 5)], pool[Math.floor(random() * 5)]];
  const motifA = Array.from({ length: 16 }, () => (random() < 0.25 ? null : Math.floor(random() * 8)));
  const motifB = motifA.map((d) => (d === null ? (random() < 0.5 ? Math.floor(random() * 8) : null) : random() < 0.3 ? d + (random() < 0.5 ? 1 : -1) : d));

  const bars = Math.ceil(seconds / bar);
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const chord = progression[b % 4];

    for (let k = 0; k < 4; k++) {
      const off = spec.drums === 'trap' && k % 2 === 1 ? beat * 0.5 : 0;
      tone(buf, t0 + k * beat + off, beat * 0.85, hz(note(chord, -2)), spec.bass, 0.26, 0.005, 0.05);
    }
    if (spec.pad) {
      for (const i of [0, 2, 4]) tone(buf, t0, bar, hz(note(chord + i, -1)), 'sine', 0.05, 0.25, 0.3);
    }
    if (b >= 2) {
      const motif = Math.floor(b / 2) % 2 ? motifB : motifA;
      const half = (b % 2) * 8;
      for (let s = 0; s < 8; s++) {
        const d = motif[half + s];
        if (d !== null) tone(buf, t0 + (s * beat) / 2, (beat / 2) * 0.9, hz(note(d + chord, 1)), spec.lead, 0.16);
      }
    }

    const hit = (beats: number[], fn: (t: number) => void) => beats.forEach((x) => fn(t0 + x * beat));
    switch (spec.drums) {
      case 'four':
        hit([0, 1, 2, 3], (t) => kick(buf, t, 0.7));
        hit([1, 3], (t) => noiseHit(buf, t, 0.22, 20, 180, random));
        hit([0.5, 1.5, 2.5, 3.5], (t) => noiseHit(buf, t, 0.18, 70, 0, random));
        break;
      case 'boom':
        hit([0, 1.75, 2.5], (t) => kick(buf, t, 0.75));
        hit([1, 3], (t) => noiseHit(buf, t, 0.3, 18, 190, random));
        hit([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], (t) => noiseHit(buf, t, 0.1, 80, 0, random));
        break;
      case 'trap':
        hit([0, 2.75], (t) => kick(buf, t, 0.8));
        hit([2], (t) => noiseHit(buf, t, 0.32, 16, 200, random));
        for (let s = 0; s < 16; s++) hit([s / 4], (t) => noiseHit(buf, t, s % 4 === 3 ? 0.14 : 0.08, 90, 0, random));
        break;
      case 'break':
        hit([0, 1.5, 2.25], (t) => kick(buf, t, 0.7));
        hit([1, 2.75, 3], (t) => noiseHit(buf, t, 0.28, 20, 210, random));
        for (let s = 0; s < 8; s++) hit([s / 2], (t) => noiseHit(buf, t, 0.09, 85, 0, random));
        break;
      case 'soft':
        hit([0, 2.5], (t) => kick(buf, t, 0.45));
        hit([1, 3], (t) => noiseHit(buf, t, 0.12, 14, 170, random));
        break;
    }
  }

  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * 1.2) * 0.85;
  return buf;
}

/** 16-bit mono PCM WAV. */
export function encodeWav(samples: Float32Array, rate = DEMO_RATE): ArrayBuffer {
  const out = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(out);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return out;
}

function artwork(spec: Spec, index: number): string {
  const [a, b] = spec.colors;
  const random = rng(index + 101);
  const rings = Array.from({ length: 3 }, (_, i) => {
    const r = 60 + i * 55 + Math.floor(random() * 20);
    return `<circle cx="240" cy="240" r="${r}" fill="none" stroke="#fff" stroke-opacity="${0.12 + i * 0.08}" stroke-width="${6 + i * 4}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="480" height="480" fill="url(#g)"/>${rings}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEMO_TRACKS: Track[] = SPECS.map((s, i) => ({
  id: `demo-${i}`,
  title: s.title,
  artist: s.artist,
  artistId: `demo-artist-${s.artist}`,
  artistHandle: s.artist.toLowerCase().replace(/[^a-z0-9]/g, ''),
  followers: 180 + ((i * 7919) % 9000),
  artwork: artwork(s, i),
  duration: DURATION,
  genre: s.genre,
  permalink: '',
  plays: 0,
}));

const urls = new Map<string, string>();

/** Renders a demo track on first use and returns a blob URL the audio player can load. */
export function demoStreamUrl(trackId: string): string {
  const cached = urls.get(trackId);
  if (cached) return cached;
  const index = Number(trackId.replace('demo-', ''));
  const blob = new Blob([encodeWav(renderDemo(index))], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  urls.set(trackId, url);
  return url;
}
