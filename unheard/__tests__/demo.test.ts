import { describe, expect, it } from '@jest/globals';

import { DEMO_RATE, DEMO_TRACKS, encodeWav, renderDemo } from '../src/services/demo';

describe('demo tracks', () => {
  it('has unique ids and titles with artwork', () => {
    expect(new Set(DEMO_TRACKS.map((t) => t.id)).size).toBe(DEMO_TRACKS.length);
    expect(new Set(DEMO_TRACKS.map((t) => t.title)).size).toBe(DEMO_TRACKS.length);
    expect(DEMO_TRACKS.every((t) => t.artwork?.startsWith('data:image/svg+xml'))).toBe(true);
  });

  it('renders deterministic, audible, unclipped audio that differs per track', () => {
    const a = renderDemo(0, 4);
    expect(a).toHaveLength(4 * DEMO_RATE);
    expect(renderDemo(0, 4)).toEqual(a);
    const peak = a.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    expect(peak).toBeGreaterThan(0.2);
    expect(peak).toBeLessThanOrEqual(0.85);
    expect(renderDemo(1, 4)).not.toEqual(a);
  });

  it('encodes a 16-bit mono WAV', () => {
    const wav = new DataView(encodeWav(new Float32Array([0, 1, -1])));
    const tag = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => wav.getUint8(o + i)));
    expect([tag(0), tag(8), tag(36)]).toEqual(['RIFF', 'WAVE', 'data']);
    expect(wav.getUint32(24, true)).toBe(DEMO_RATE);
    expect(wav.getInt16(46, true)).toBe(0x7fff);
    expect(wav.getInt16(48, true)).toBe(-0x7fff);
  });
});
