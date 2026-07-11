"use client";

import { useEffect, useRef, useState } from "react";

/** Runs callback every `delay` ms; pass null to pause. */
export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/** Elapsed seconds counter. */
export function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useInterval(() => setSeconds((s) => s + 1), running ? 1000 : null);
  return { seconds, reset: () => setSeconds(0) };
}

/** True after first client render (safe to read localStorage). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return mounted;
}
