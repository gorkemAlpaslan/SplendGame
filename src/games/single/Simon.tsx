"use client";

import { useCallback, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { randInt } from "@/lib/utils";

const PADS = [
  { color: "bg-red-500", active: "bg-red-300", emoji: "🔴" },
  { color: "bg-emerald-500", active: "bg-emerald-300", emoji: "🟢" },
  { color: "bg-sky-500", active: "bg-sky-300", emoji: "🔵" },
  { color: "bg-amber-500", active: "bg-amber-300", emoji: "🟡" },
];

export default function Simon() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "show" | "input">("idle");
  const [lit, setLit] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };

  const playSequence = useCallback((seq: number[]) => {
    setPhase("show");
    setProgress(0);
    const speed = Math.max(280, 620 - seq.length * 25);
    seq.forEach((pad, i) => {
      timeouts.current.push(
        setTimeout(() => setLit(pad), i * speed + 400),
        setTimeout(() => setLit(null), i * speed + 400 + speed * 0.6)
      );
    });
    timeouts.current.push(
      setTimeout(() => setPhase("input"), seq.length * speed + 500)
    );
  }, []);

  const startRound = useCallback(
    (prev: number[]) => {
      const seq = [...prev, randInt(0, 3)];
      setSequence(seq);
      playSequence(seq);
    },
    [playSequence]
  );

  const restart = useCallback(() => {
    clearTimers();
    setSequence([]);
    setPhase("idle");
    setLit(null);
    setProgress(0);
    setResult(null);
  }, []);

  function tap(pad: number) {
    if (phase !== "input" || result) return;
    setLit(pad);
    setTimeout(() => setLit(null), 200);

    if (sequence[progress] !== pad) {
      const level = sequence.length - 1;
      setResult({
        won: level > 0,
        score: level * 100,
        message: `${level} seviyeye ulaştın!`,
      });
      setPhase("idle");
      return;
    }
    const p = progress + 1;
    if (p >= sequence.length) {
      setPhase("show");
      timeouts.current.push(setTimeout(() => startRound(sequence), 700));
    } else {
      setProgress(p);
    }
  }

  const level = sequence.length;

  return (
    <GameShell
      slug="simon"
      onRestart={restart}
      result={result}
      stats={[{ label: "Seviye", value: level }]}
    >
      <div className="max-w-xs mx-auto text-center">
        <p className="mb-4 h-6 font-semibold text-muted">
          {phase === "idle" && "Başlamak için butona bas"}
          {phase === "show" && "👀 İzle…"}
          {phase === "input" && `✋ Sıra sende! (${progress}/${sequence.length})`}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {PADS.map((p, i) => (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={phase !== "input"}
              className={`aspect-square rounded-3xl transition-all duration-150 ${
                lit === i ? `${p.active} scale-95 shadow-2xl` : `${p.color} opacity-80`
              } ${phase === "input" ? "hover:opacity-100 active:scale-90 cursor-pointer" : ""}`}
              aria-label={p.emoji}
            />
          ))}
        </div>

        {phase === "idle" && (
          <button onClick={() => startRound([])} className="btn-primary mt-6 w-full text-lg">
            ▶️ Başla
          </button>
        )}
      </div>
    </GameShell>
  );
}
