"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { cls, randInt } from "@/lib/utils";

const ROUNDS = 5;

export default function ReactionTest() {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "early">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goAt = useRef(0);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const restart = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
    setTimes([]);
    setResult(null);
  }, []);

  function startRound() {
    setPhase("wait");
    timerRef.current = setTimeout(() => {
      goAt.current = performance.now();
      setPhase("go");
    }, randInt(1200, 3500));
  }

  function tap() {
    if (phase === "wait") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("early");
      return;
    }
    if (phase === "go") {
      const ms = Math.round(performance.now() - goAt.current);
      const next = [...times, ms];
      setTimes(next);
      if (next.length >= ROUNDS) {
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        const score = Math.max(50, 1500 - avg * 2);
        setPhase("idle");
        setResult({
          won: avg < 400,
          score,
          message: `Ortalama tepki süren: ${avg} ms`,
        });
      } else {
        setPhase("idle");
        setTimeout(startRound, 600);
      }
    }
  }

  return (
    <GameShell
      slug="refleks-testi"
      onRestart={restart}
      result={result}
      stats={[{ label: "Tur", value: `${times.length}/${ROUNDS}` }]}
    >
      <div className="max-w-sm mx-auto">
        <button
          onPointerDown={phase === "wait" || phase === "go" ? tap : undefined}
          onClick={() => {
            if (phase === "idle" && !result && times.length === 0) startRound();
            else if (phase === "early") startRound();
          }}
          className={cls(
            "w-full h-72 rounded-3xl flex flex-col items-center justify-center gap-3 text-2xl font-extrabold transition-colors select-none cursor-pointer",
            phase === "go"
              ? "bg-emerald-500 text-white"
              : phase === "wait"
                ? "bg-red-500/80 text-white"
                : phase === "early"
                  ? "bg-amber-500 text-black"
                  : "bg-surface-2 text-muted"
          )}
        >
          {phase === "idle" && times.length === 0 && !result && (
            <>
              <span className="text-5xl">⚡</span>
              <span>Başlamak için dokun</span>
            </>
          )}
          {phase === "idle" && times.length > 0 && (
            <>
              <span className="text-5xl">✅</span>
              <span className="tabular-nums">{times[times.length - 1]} ms</span>
              <span className="text-sm font-normal text-muted">Sıradaki tur geliyor…</span>
            </>
          )}
          {phase === "wait" && (
            <>
              <span className="text-5xl">✋</span>
              <span>Bekle…</span>
            </>
          )}
          {phase === "go" && (
            <>
              <span className="text-5xl">🟢</span>
              <span>DOKUN!</span>
            </>
          )}
          {phase === "early" && (
            <>
              <span className="text-5xl">😅</span>
              <span>Çok erken!</span>
              <span className="text-sm font-normal">Tekrar denemek için dokun</span>
            </>
          )}
        </button>

        {times.length > 0 && (
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {times.map((t, i) => (
              <span key={i} className="chip bg-surface-2 text-sm tabular-nums !cursor-default">
                {i + 1}. tur: <b>{t} ms</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </GameShell>
  );
}
