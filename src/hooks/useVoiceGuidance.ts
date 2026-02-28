import { useCallback, useRef } from "react";

export const useVoiceGuidance = () => {
  const lastSpoken = useRef<string>("");
  const lastSpokeAt = useRef<number>(0);
  const DEBOUNCE_MS = 3000;

  const speak = useCallback((text: string) => {
    const now = Date.now();
    if (
      text === lastSpoken.current &&
      now - lastSpokeAt.current < DEBOUNCE_MS
    ) {
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      lastSpoken.current = text;
      lastSpokeAt.current = now;
    }
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
};
