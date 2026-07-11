"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { cls } from "@/lib/utils";

const N = 7;
// İngiliz haç tahtası: köşe 2x2'ler geçersiz
function isValid(r: number, c: number): boolean {
  return !((r < 2 || r > 4) && (c < 2 || c > 4));
}

type Cell = "peg" | "empty" | "off";

function initialBoard(): Cell[] {
  return Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N);
    const c = i % N;
    if (!isValid(r, c)) return "off";
    return r === 3 && c === 3 ? "empty" : "peg";
  });
}

function jumps(board: Cell[], i: number): { over: number; to: number }[] {
  const r = Math.floor(i / N);
  const c = i % N;
  const out: { over: number; to: number }[] = [];
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const or_ = r + dr, oc = c + dc;
    const tr = r + dr * 2, tc = c + dc * 2;
    if (tr < 0 || tr >= N || tc < 0 || tc >= N) continue;
    const over = or_ * N + oc;
    const to = tr * N + tc;
    if (board[over] === "peg" && board[to] === "empty") out.push({ over, to });
  }
  return out;
}

function anyMove(board: Cell[]): boolean {
  return board.some((cell, i) => cell === "peg" && jumps(board, i).length > 0);
}

export default function PegSolitaire() {
  const [board, setBoard] = useState<Cell[]>(initialBoard);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<Cell[][]>([]);
  const [result, setResult] = useState<GameResult | null>(null);

  const restart = useCallback(() => {
    setBoard(initialBoard());
    setSelected(null);
    setHistory([]);
    setResult(null);
  }, []);

  const pegCount = board.filter((c) => c === "peg").length;

  function finish(b: Cell[]) {
    const pegs = b.filter((c) => c === "peg").length;
    const centerPeg = b[3 * N + 3] === "peg";
    const score =
      pegs === 1 ? (centerPeg ? 1500 : 1000) : Math.max(50, 600 - pegs * 50);
    setResult({
      won: pegs === 1,
      score,
      message:
        pegs === 1
          ? centerPeg
            ? "Mükemmel! Tek taş, tam merkezde! 👑"
            : "Tek taş kaldı, harikasın!"
          : `${pegs} taş kaldı. Daha azını dene!`,
    });
  }

  function tap(i: number) {
    if (result) return;
    if (board[i] === "peg") {
      setSelected(selected === i ? null : i);
      return;
    }
    if (board[i] === "empty" && selected !== null) {
      const jump = jumps(board, selected).find((j) => j.to === i);
      if (!jump) return;
      const next = [...board];
      next[selected] = "empty";
      next[jump.over] = "empty";
      next[i] = "peg";
      setHistory([...history, board]);
      setBoard(next);
      setSelected(null);
      if (!anyMove(next)) finish(next);
    }
  }

  function undo() {
    if (!history.length || result) return;
    setBoard(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setSelected(null);
  }

  const validTargets = selected !== null ? new Set(jumps(board, selected).map((j) => j.to)) : new Set<number>();

  return (
    <GameShell
      slug="tek-kal"
      onRestart={restart}
      result={result}
      stats={[{ label: "Kalan Taş", value: pegCount }]}
    >
      <div className="max-w-sm mx-auto">
        <div className="grid grid-cols-7 gap-1 card p-3">
          {board.map((cell, i) => {
            if (cell === "off") return <div key={i} className="aspect-square" />;
            return (
              <button
                key={i}
                onClick={() => tap(i)}
                className={cls(
                  "aspect-square rounded-full transition-all cursor-pointer",
                  cell === "peg"
                    ? selected === i
                      ? "bg-accent scale-110 shadow-lg shadow-accent/40"
                      : "bg-gradient-to-br from-primary to-secondary hover:scale-105"
                    : validTargets.has(i)
                      ? "bg-good/30 ring-2 ring-good animate-pulse"
                      : "bg-surface-2"
                )}
              />
            );
          })}
        </div>
        <button onClick={undo} disabled={!history.length} className="btn-ghost w-full mt-4">
          ↩️ Geri Al
        </button>
        <p className="text-center text-muted text-sm mt-3">
          Taşı seç, komşu taşın üzerinden boş kareye atla
        </p>
      </div>
    </GameShell>
  );
}
