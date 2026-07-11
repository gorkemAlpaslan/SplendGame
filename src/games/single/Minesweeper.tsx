"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useTimer } from "@/lib/hooks";
import { cls, formatTime, shuffle } from "@/lib/utils";

type Diff = "kolay" | "orta" | "zor";
const DIFFS: { key: Diff; label: string; w: number; h: number; mines: number; base: number }[] = [
  { key: "kolay", label: "Kolay", w: 9, h: 9, mines: 10, base: 700 },
  { key: "orta", label: "Orta", w: 12, h: 12, mines: 24, base: 1400 },
  { key: "zor", label: "Zor", w: 14, h: 14, mines: 36, base: 2200 },
];

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adj: number;
}

const NUM_COLORS = [
  "",
  "text-sky-400",
  "text-emerald-400",
  "text-rose-400",
  "text-violet-400",
  "text-amber-400",
  "text-cyan-400",
  "text-pink-400",
  "text-white",
];

export default function Minesweeper() {
  const [diff, setDiff] = useState<Diff>("kolay");
  const cfg = DIFFS.find((d) => d.key === diff)!;
  const [cells, setCells] = useState<Cell[]>(() => emptyBoard(9 * 9));
  const [started, setStarted] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const { seconds, reset: resetTimer } = useTimer(started && result === null);

  function emptyBoard(n: number): Cell[] {
    return Array.from({ length: n }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adj: 0,
    }));
  }

  const newGame = useCallback(
    (d: Diff) => {
      const c = DIFFS.find((x) => x.key === d)!;
      setDiff(d);
      setCells(emptyBoard(c.w * c.h));
      setStarted(false);
      setResult(null);
      setFlagMode(false);
      resetTimer();
    },
    [resetTimer]
  );

  function neighbors(i: number, w: number, h: number): number[] {
    const r = Math.floor(i / w);
    const c = i % w;
    const out: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < h && nc >= 0 && nc < w) out.push(nr * w + nc);
      }
    }
    return out;
  }

  function placeMines(safe: number): Cell[] {
    const { w, h, mines } = cfg;
    const forbidden = new Set([safe, ...neighbors(safe, w, h)]);
    const candidates = [...Array(w * h).keys()].filter((i) => !forbidden.has(i));
    const mineSet = new Set(shuffle(candidates).slice(0, mines));
    const board = emptyBoard(w * h).map((c, i) => ({ ...c, mine: mineSet.has(i) }));
    board.forEach((c, i) => {
      c.adj = neighbors(i, w, h).filter((n) => board[n].mine).length;
    });
    return board;
  }

  function reveal(i: number) {
    if (result) return;
    let board = cells;
    if (!started) {
      board = placeMines(i);
      setStarted(true);
    }
    const cell = board[i];
    if (cell.revealed || cell.flagged) return;

    if (cell.mine) {
      setCells(board.map((c) => (c.mine ? { ...c, revealed: true } : c)));
      setResult({ won: false, score: 0, message: "Mayına bastın! 💥" });
      return;
    }

    // flood fill
    const next = board.map((c) => ({ ...c }));
    const stack = [i];
    while (stack.length) {
      const j = stack.pop()!;
      const cj = next[j];
      if (cj.revealed || cj.flagged || cj.mine) continue;
      cj.revealed = true;
      if (cj.adj === 0) {
        neighbors(j, cfg.w, cfg.h).forEach((n) => {
          if (!next[n].revealed) stack.push(n);
        });
      }
    }
    setCells(next);

    if (next.every((c) => c.mine || c.revealed)) {
      const score = Math.max(50, cfg.base - seconds * 3);
      setResult({ won: true, score, message: `${formatTime(seconds)} — temiz iş!` });
    }
  }

  function toggleFlag(i: number) {
    if (result || cells[i].revealed) return;
    setCells(cells.map((c, j) => (j === i ? { ...c, flagged: !c.flagged } : c)));
  }

  function onCellClick(i: number) {
    if (flagMode && started) toggleFlag(i);
    else reveal(i);
  }

  const flags = cells.filter((c) => c.flagged).length;

  return (
    <GameShell
      slug="mayin-tarlasi"
      onRestart={() => newGame(diff)}
      result={result}
      stats={[
        { label: "Süre", value: formatTime(seconds) },
        { label: "💣", value: `${Math.max(0, cfg.mines - flags)}` },
      ]}
    >
      <div className="flex gap-2 mb-4 justify-center flex-wrap">
        {DIFFS.map((d) => (
          <button
            key={d.key}
            onClick={() => newGame(d.key)}
            className={cls(
              "chip",
              diff === d.key ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {d.label}
          </button>
        ))}
        <button
          onClick={() => setFlagMode(!flagMode)}
          className={cls("chip", flagMode ? "bg-accent text-black" : "bg-surface-2 text-muted hover:text-ink")}
          title="Bayrak modu (mobil için)"
        >
          🚩 Bayrak {flagMode ? "AÇIK" : "modu"}
        </button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-0.5 mx-auto w-fit"
          style={{ gridTemplateColumns: `repeat(${cfg.w}, minmax(0, 1fr))` }}
        >
          {cells.map((c, i) => (
            <button
              key={i}
              onClick={() => onCellClick(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (started) toggleFlag(i);
              }}
              className={cls(
                "w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center text-sm font-bold transition-colors",
                c.revealed
                  ? c.mine
                    ? "bg-bad/40"
                    : "bg-surface"
                  : "bg-surface-2 hover:bg-edge active:scale-95",
                c.revealed && c.adj > 0 && NUM_COLORS[c.adj]
              )}
            >
              {c.revealed ? (c.mine ? "💣" : c.adj || "") : c.flagged ? "🚩" : ""}
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-muted text-sm mt-3">
        🖱️ Sağ tık veya 🚩 bayrak moduyla işaretle
      </p>
    </GameShell>
  );
}
