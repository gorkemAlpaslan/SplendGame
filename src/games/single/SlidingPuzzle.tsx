"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useTimer } from "@/lib/hooks";
import { cls, formatTime, pick } from "@/lib/utils";

const SIZES = [3, 4, 5];

function solvedBoard(n: number): number[] {
  // 0 = boş, en sonda
  return [...Array(n * n).keys()].map((i) => (i + 1) % (n * n));
}

function shuffleByMoves(board: number[], n: number, count: number): number[] {
  const b = [...board];
  let blank = b.indexOf(0);
  let prev = -1;
  for (let k = 0; k < count; k++) {
    const r = Math.floor(blank / n);
    const c = blank % n;
    const opts: number[] = [];
    if (r > 0) opts.push(blank - n);
    if (r < n - 1) opts.push(blank + n);
    if (c > 0) opts.push(blank - 1);
    if (c < n - 1) opts.push(blank + 1);
    const candidates = opts.filter((o) => o !== prev);
    const target = pick(candidates.length ? candidates : opts);
    [b[blank], b[target]] = [b[target], b[blank]];
    prev = blank;
    blank = target;
  }
  return b;
}

export default function SlidingPuzzle() {
  const [n, setN] = useState(4);
  const [board, setBoard] = useState<number[]>(() => shuffleByMoves(solvedBoard(4), 4, 400));
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const { seconds, reset: resetTimer } = useTimer(moves > 0 && result === null);

  const newGame = useCallback(
    (size: number) => {
      setN(size);
      setBoard(shuffleByMoves(solvedBoard(size), size, size * size * 30));
      setMoves(0);
      setResult(null);
      resetTimer();
    },
    [resetTimer]
  );

  function tap(i: number) {
    if (result) return;
    const blank = board.indexOf(0);
    const r = Math.floor(i / n);
    const c = i % n;
    const br = Math.floor(blank / n);
    const bc = blank % n;
    if (Math.abs(r - br) + Math.abs(c - bc) !== 1) return;
    const next = [...board];
    [next[i], next[blank]] = [next[blank], next[i]];
    setBoard(next);
    const m = moves + 1;
    setMoves(m);
    if (next.every((v, j) => v === (j + 1) % (n * n))) {
      const base = n * n * 60;
      const score = Math.max(50, base - m * 3 - seconds * 2);
      setResult({ won: true, score, message: `${m} hamlede çözdün!` });
    }
  }

  return (
    <GameShell
      slug="kayan-bulmaca"
      onRestart={() => newGame(n)}
      result={result}
      stats={[
        { label: "Hamle", value: moves },
        { label: "Süre", value: formatTime(seconds) },
      ]}
    >
      <div className="flex gap-2 mb-4 justify-center">
        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => newGame(s)}
            className={cls(
              "chip",
              n === s ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {s}×{s}
          </button>
        ))}
      </div>

      <div
        className="grid gap-1.5 mx-auto card p-2 sm:p-3"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, maxWidth: 90 * n }}
      >
        {board.map((v, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={v === 0}
            className={cls(
              "aspect-square rounded-xl flex items-center justify-center font-extrabold text-xl sm:text-2xl transition-all",
              v === 0
                ? "bg-transparent"
                : v === i + 1
                  ? "bg-good/30 text-good hover:scale-105 active:scale-95"
                  : "bg-surface-2 hover:bg-edge hover:scale-105 active:scale-95"
            )}
          >
            {v || ""}
          </button>
        ))}
      </div>
      <p className="text-center text-muted text-sm mt-3">Boşluğa komşu karolara dokun</p>
    </GameShell>
  );
}
