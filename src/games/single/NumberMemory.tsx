"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { randInt } from "@/lib/utils";

function makeNumber(digits: number): string {
  let s = String(randInt(1, 9));
  for (let i = 1; i < digits; i++) s += String(randInt(0, 9));
  return s;
}

export default function NumberMemory() {
  const [phase, setPhase] = useState<"idle" | "show" | "input">("idle");
  const [level, setLevel] = useState(1);
  const [number, setNumber] = useState("");
  const [input, setInput] = useState("");
  const [progress, setProgress] = useState(100);
  const [result, setResult] = useState<GameResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showNumber = useCallback((digits: number) => {
    const num = makeNumber(digits);
    setNumber(num);
    setInput("");
    setPhase("show");
    setProgress(100);
    const duration = 1200 + digits * 550;
    const start = Date.now();
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct > 0) timerRef.current = setTimeout(tick, 50);
      else setPhase("input");
    };
    tick();
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
  }, [phase]);

  const restart = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
    setLevel(1);
    setResult(null);
    setInput("");
  }, []);

  function submit() {
    if (phase !== "input") return;
    if (input === number) {
      const next = level + 1;
      setLevel(next);
      showNumber(next);
    } else {
      const digits = level - 1;
      setPhase("idle");
      setResult({
        won: digits >= 5,
        score: digits * 100,
        message: `${digits} basamağa kadar hatırladın! (Sayı: ${number})`,
      });
    }
  }

  return (
    <GameShell
      slug="sayi-hafizasi"
      onRestart={restart}
      result={result}
      stats={[{ label: "Basamak", value: level }]}
    >
      <div className="max-w-sm mx-auto text-center">
        {phase === "idle" && (
          <div className="card p-8">
            <div className="text-5xl mb-4">🧠</div>
            <p className="text-muted mb-6">
              Sayı ekranda kısa süre kalacak. Kaybolunca hatırladığını yaz. Her
              turda bir basamak uzar!
            </p>
            <button
              onClick={() => {
                setLevel(1);
                setResult(null);
                showNumber(1);
              }}
              className="btn-primary w-full text-lg"
            >
              ▶️ Başla
            </button>
          </div>
        )}

        {phase === "show" && (
          <div className="card p-10">
            <div className="text-4xl sm:text-5xl font-extrabold tracking-[0.2em] tabular-nums mb-6 select-none">
              {number}
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full bg-primary transition-none" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {phase === "input" && (
          <div className="card p-8">
            <p className="text-muted mb-4">Sayı neydi?</p>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              inputMode="numeric"
              className="input text-center text-2xl font-extrabold tracking-widest tabular-nums"
              placeholder="…"
            />
            <button onClick={submit} disabled={!input} className="btn-primary w-full mt-4">
              Onayla
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
