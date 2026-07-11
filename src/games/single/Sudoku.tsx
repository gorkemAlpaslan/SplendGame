"use client";

import { useCallback, useEffect, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useTimer } from "@/lib/hooks";
import { cls, formatTime, shuffle } from "@/lib/utils";

type Diff = "kolay" | "orta" | "zor";
const DIFFS: { key: Diff; label: string; removals: number; base: number }[] = [
  { key: "kolay", label: "Kolay", removals: 35, base: 700 },
  { key: "orta", label: "Orta", removals: 45, base: 1100 },
  { key: "zor", label: "Zor", removals: 52, base: 1600 },
];

function generateSolved(): number[] {
  const grid: number[] = new Array(81).fill(0);
  const ok = (i: number, v: number) => {
    const r = Math.floor(i / 9);
    const c = i % 9;
    for (let k = 0; k < 9; k++) {
      if (grid[r * 9 + k] === v || grid[k * 9 + c] === v) return false;
    }
    const br = r - (r % 3);
    const bc = c - (c % 3);
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        if (grid[(br + dr) * 9 + (bc + dc)] === v) return false;
      }
    }
    return true;
  };
  const fill = (i: number): boolean => {
    if (i === 81) return true;
    for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (ok(i, v)) {
        grid[i] = v;
        if (fill(i + 1)) return true;
        grid[i] = 0;
      }
    }
    return false;
  };
  fill(0);
  return grid;
}

interface Cell {
  v: number; // 0 = boş
  given: boolean;
}

export default function Sudoku() {
  const [diff, setDiff] = useState<Diff>("kolay");
  const [solution, setSolution] = useState<number[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const { seconds, reset: resetTimer } = useTimer(result === null && cells.length > 0);

  const newGame = useCallback(
    (d: Diff) => {
      const sol = generateSolved();
      const removals = DIFFS.find((x) => x.key === d)!.removals;
      const removed = new Set(shuffle([...Array(81).keys()]).slice(0, removals));
      setSolution(sol);
      setCells(sol.map((v, i) => (removed.has(i) ? { v: 0, given: false } : { v, given: true })));
      setSelected(null);
      setMistakes(0);
      setResult(null);
      resetTimer();
    },
    [resetTimer]
  );

  useEffect(() => {
    const t = setTimeout(() => newGame("kolay"), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function place(v: number) {
    if (selected === null || result) return;
    const cell = cells[selected];
    if (cell.given || cell.v === v) return;
    const next = cells.map((c, i) => (i === selected ? { ...c, v } : c));
    setCells(next);
    if (v !== 0 && v !== solution[selected]) {
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= 3) {
        setResult({ won: false, score: 0, message: "3 hata yaptın — bir dahaki sefere!" });
        return;
      }
    }
    if (next.every((c, i) => c.v === solution[i])) {
      const base = DIFFS.find((x) => x.key === diff)!.base;
      const score = Math.max(50, base - seconds * 2 - mistakes * 100);
      setResult({ won: true, score, message: `${formatTime(seconds)} sürede çözdün!` });
    }
  }

  const counts = new Array(10).fill(0);
  for (let d = 1; d <= 9; d++) {
    counts[d] = cells.filter((c, i) => c.v === d && c.v === solution[i]).length;
  }

  const selVal = selected !== null ? cells[selected]?.v : 0;

  return (
    <GameShell
      slug="sudoku"
      onRestart={() => newGame(diff)}
      result={result}
      stats={[
        { label: "Süre", value: formatTime(seconds) },
        { label: "Hata", value: `${mistakes}/3` },
      ]}
    >
      <div className="flex gap-2 mb-4 justify-center">
        {DIFFS.map((d) => (
          <button
            key={d.key}
            onClick={() => {
              setDiff(d.key);
              newGame(d.key);
            }}
            className={cls(
              "chip",
              diff === d.key ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-9 card overflow-hidden !rounded-xl">
          {cells.map((cell, i) => {
            const r = Math.floor(i / 9);
            const c = i % 9;
            const sameRowColBox =
              selected !== null &&
              (Math.floor(selected / 9) === r ||
                selected % 9 === c ||
                (Math.floor(Math.floor(selected / 9) / 3) === Math.floor(r / 3) &&
                  Math.floor((selected % 9) / 3) === Math.floor(c / 3)));
            const wrong = cell.v !== 0 && cell.v !== solution[i];
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cls(
                  "aspect-square flex items-center justify-center text-base sm:text-xl font-semibold transition-colors",
                  c % 3 === 2 && c !== 8 ? "border-r-2 border-r-edge" : "border-r border-r-edge/40",
                  r % 3 === 2 && r !== 8 ? "border-b-2 border-b-edge" : "border-b border-b-edge/40",
                  selected === i
                    ? "bg-primary/40"
                    : selVal !== 0 && cell.v === selVal
                      ? "bg-primary/25"
                      : sameRowColBox
                        ? "bg-surface-2"
                        : "bg-surface",
                  wrong ? "text-bad" : cell.given ? "text-ink" : "text-primary-soft"
                )}
              >
                {cell.v || ""}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-9 gap-1 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => place(d)}
              disabled={counts[d] >= 9}
              className="btn-ghost !px-0 !py-2.5 text-lg sm:text-xl font-bold"
            >
              {d}
            </button>
          ))}
        </div>
        <button onClick={() => place(0)} className="btn-ghost w-full mt-2 text-sm">
          🧹 Sil
        </button>
      </div>
    </GameShell>
  );
}
