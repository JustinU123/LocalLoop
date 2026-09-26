import { useEffect, useRef, useState } from 'react';

type UseTypewriterRevealOptions = {
  fullText: string;
  active: boolean;
  charDelayMs?: number;
  startDelayMs?: number;
  reduceMotion?: boolean;
  replayEpoch?: number;
};

export function useTypewriterReveal({
  fullText,
  active,
  charDelayMs = 28,
  startDelayMs = 450,
  reduceMotion = false,
  replayEpoch = 0,
}: UseTypewriterRevealOptions): string {
  const [visibleText, setVisibleText] = useState('');
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!active || reduceMotion) {
      return;
    }

    const runId = ++runIdRef.current;
    let index = 0;
    let charTimer: ReturnType<typeof setTimeout> | null = null;
    let startTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (runIdRef.current !== runId) {
        return;
      }
      index += 1;
      setVisibleText(fullText.slice(0, index));
      if (index < fullText.length) {
        charTimer = setTimeout(tick, charDelayMs);
      }
    };

    startTimer = setTimeout(() => {
      if (runIdRef.current !== runId) {
        return;
      }
      setVisibleText('');
      tick();
    }, startDelayMs);

    return () => {
      runIdRef.current += 1;
      if (startTimer) {
        clearTimeout(startTimer);
      }
      if (charTimer) {
        clearTimeout(charTimer);
      }
    };
  }, [fullText, active, charDelayMs, startDelayMs, reduceMotion, replayEpoch]);

  if (!active) {
    return '';
  }
  if (reduceMotion) {
    return fullText;
  }
  return visibleText;
}
