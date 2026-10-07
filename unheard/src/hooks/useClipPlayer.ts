import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

let audioModeSet = false;
const TICK_MS = 25;

/**
 * Plays a fixed-length clip of a streamed track, always from the same start point.
 * It stops by polling the player's own clock, so time spent buffering never eats into the clip.
 */
export function useClipPlayer(source: string | null, startSec: number) {
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [clipLength, setClipLength] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const runId = useRef(0);
  const [loadedSource, setLoadedSource] = useState(source);

  if (source !== loadedSource) {
    setLoadedSource(source);
    setClipLength(null);
    setElapsed(0);
  }

  useEffect(() => {
    if (!audioModeSet) {
      audioModeSet = true;
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
  }, []);

  const clearTicker = () => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };

  const stop = useCallback(() => {
    runId.current += 1;
    clearTicker();
    player.pause();
    setClipLength(null);
    setElapsed(0);
    player.seekTo(startSec).catch(() => {});
  }, [player, startSec]);

  useEffect(() => {
    runId.current += 1;
    clearTicker();
    player.pause();
    if (source) player.replace({ uri: source });
  }, [player, source]);

  // Park the playhead at the clip start once the track loads, so the first tap starts instantly.
  useEffect(() => {
    if (status.isLoaded && ticker.current === null) player.seekTo(startSec).catch(() => {});
  }, [player, status.isLoaded, startSec]);

  useEffect(() => clearTicker, []);

  const play = useCallback(
    async (lengthSec: number) => {
      if (!source) return;
      const id = ++runId.current;
      clearTicker();
      setClipLength(lengthSec);
      setElapsed(0);
      await player.seekTo(startSec).catch(() => {});
      if (id !== runId.current) return;
      // Measure from wherever the playhead actually landed. Some streams can't seek; then the clip
      // plays from that spot instead, but never runs longer than it should.
      const base = player.currentTime;
      player.play();
      // Backstop in case the stream stalls and the clock never reaches the end of the clip.
      const deadline = Date.now() + (lengthSec + 12) * 1000;
      ticker.current = setInterval(() => {
        const position = player.currentTime - base;
        setElapsed(Math.min(Math.max(position, 0), lengthSec));
        if (position >= lengthSec || Date.now() > deadline) stop();
      }, TICK_MS);
    },
    [player, source, startSec, stop],
  );

  const isPlaying = clipLength !== null;

  return {
    play,
    stop,
    isLoaded: status.isLoaded,
    isPlaying,
    isWaiting: isPlaying && elapsed === 0 && (status.isBuffering || !status.playing),
    elapsed,
    error: status.error,
  };
}
