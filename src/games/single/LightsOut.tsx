"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { cls, randInt } from "@/lib/utils";

const N = 5;

function press(board: boolean[], i: number): boolean[] {
  const next = [...board];
  const r = Math.floor(i / N);
  const c = i % N;
  const flip = (rr: number, cc: number) => {
    if (rr >= 0 && rr < N && cc >= 0 && cc < N) next[rr * N + cc] = !next[rr * N + cc];
  };
  flip(r, c);
  flip(r - 1, c);
  flip(r + 1, c);
  flip(r, c - 1);
  flip(r, c + 1);
  return next;
}

function scramble(steps: number): boolean[] {
  let b = new Array(N * N).fill(false);
  const used = new Set<number>();
  while (used.size < steps) used.add(randInt(0, N * N - 1));
  used.forEach((i) => (b = press(b, i)));
  return b.some(Boolean) ? b : press(b, randInt(0, N * N - 1));
}

export default function LightsOut() {
  const [board, setBoard] = useState<boolean[]>(() => scramble(8));
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  const newGame = useCallback(() => {
    setBoard(scramble(8));
    setMoves(0);
    setResult(null);
  }, []);

  function tap(i: number) {
    if (result) return;
    const next = press(board, i);
    setBoard(next);
    const m = moves + 1;
    setMoves(m);
    if (next.every((v) => !v)) {
      const score = Math.max(100, 1000 - m * 15);
      setResult({ won: true, score, message: `${m} hamlede söndürdün!` });
    }
  }

  const litCount = board.filter(Boolean).length;

  return (
    <GameShell
      slug="isiklari-kapat"
      onRestart={newGame}
      result={result}
      stats={[
        { label: "Hamle", value: moves },
        { label: "Yanan", value: litCount },
      ]}
    >
      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
        {board.map((lit, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            className={cls(
              "aspect-square rounded-2xl text-2xl transition-all duration-200 active:scale-90 cursor-pointer",
              lit
                ? "bg-amber-400 shadow-lg shadow-amber-400/50 hover:bg-amber-300"
                : "bg-surface-2 hover:bg-edge"
            )}
          >
            {lit ? "💡" : ""}
          </button>
        ))}
      </div>
      <p className="text-center text-muted text-sm mt-4">
        Dokunduğun kare ve komşuları tersine döner
      </p>
    </GameShell>
  );
}
