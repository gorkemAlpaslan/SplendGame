"use client";

import { useCallback, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { SEARCH_WORDS } from "@/lib/words";
import { useTimer } from "@/lib/hooks";
import { cls, formatTime, pick, shuffle } from "@/lib/utils";

const N = 10;
const WORD_COUNT = 8;
const ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const DIRS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
];
const HUES = [262, 340, 160, 35, 200, 300, 120, 20];

interface Placed {
  word: string;
  cells: number[];
  found: boolean;
}

interface Puzzle {
  grid: string[];
  words: Placed[];
}

function buildPuzzle(): Puzzle {
  const grid: string[] = new Array(N * N).fill("");
  const words: Placed[] = [];
  const pool = shuffle(SEARCH_WORDS.filter((w) => w.length >= 4 && w.length <= 9));

  for (const word of pool) {
    if (words.length >= WORD_COUNT) break;
    let placed = false;
    for (let attempt = 0; attempt < 120 && !placed; attempt++) {
      const [dr, dc] = pick(DIRS);
      const len = word.length;
      const r0 = Math.floor(Math.random() * N);
      const c0 = Math.floor(Math.random() * N);
      const r1 = r0 + dr * (len - 1);
      const c1 = c0 + dc * (len - 1);
      if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
      const cells: number[] = [];
      let ok = true;
      for (let k = 0; k < len; k++) {
        const idx = (r0 + dr * k) * N + (c0 + dc * k);
        if (grid[idx] !== "" && grid[idx] !== word[k]) {
          ok = false;
          break;
        }
        cells.push(idx);
      }
      if (!ok) continue;
      cells.forEach((idx, k) => (grid[idx] = word[k]));
      words.push({ word, cells, found: false });
      placed = true;
    }
  }
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === "") grid[i] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return { grid, words };
}

export default function WordSearch() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => buildPuzzle());
  const [selection, setSelection] = useState<number[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const dragStart = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { seconds, reset: resetTimer } = useTimer(result === null);

  const newGame = useCallback(() => {
    setPuzzle(buildPuzzle());
    setSelection([]);
    setResult(null);
    resetTimer();
  }, [resetTimer]);

  function cellFromPoint(clientX: number, clientY: number): number | null {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const size = rect.width / N;
    const c = Math.floor((clientX - rect.left) / size);
    const r = Math.floor((clientY - rect.top) / size);
    if (r < 0 || r >= N || c < 0 || c >= N) return null;
    return r * N + c;
  }

  function lineBetween(a: number, b: number): number[] {
    const r0 = Math.floor(a / N), c0 = a % N;
    const r1 = Math.floor(b / N), c1 = b % N;
    // en yakın düz doğrultuyu seç
    let best: number[] = [a];
    let bestDist = Infinity;
    for (const [dr, dc] of DIRS) {
      const cells: number[] = [];
      let r = r0, c = c0;
      while (r >= 0 && r < N && c >= 0 && c < N) {
        cells.push(r * N + c);
        if (r === r1 && c === c1) break;
        r += dr;
        c += dc;
      }
      const last = cells[cells.length - 1];
      const lr = Math.floor(last / N), lc = last % N;
      const dist = Math.abs(lr - r1) + Math.abs(lc - c1);
      if (dist < bestDist || (dist === bestDist && cells.length < best.length)) {
        bestDist = dist;
        best = cells;
      }
    }
    return best;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (result) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null) return;
    dragStart.current = cell;
    setSelection([cell]);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStart.current === null) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null) return;
    setSelection(lineBetween(dragStart.current, cell));
  }

  function onPointerUp() {
    if (dragStart.current === null) return;
    dragStart.current = null;
    const text = selection.map((i) => puzzle.grid[i]).join("");
    const reversed = [...text].reverse().join("");
    const hit = puzzle.words.find(
      (w) => !w.found && (w.word === text || w.word === reversed)
    );
    if (hit) {
      const words = puzzle.words.map((w) => (w === hit ? { ...w, found: true } : w));
      setPuzzle({ ...puzzle, words });
      if (words.every((w) => w.found)) {
        const score = words.length * 100 + Math.max(0, 600 - seconds * 3);
        setResult({ won: true, score, message: `Hepsini ${formatTime(seconds)} sürede buldun!` });
      }
    }
    setSelection([]);
  }

  const foundHue = new Map<number, number>();
  puzzle.words.forEach((w, wi) => {
    if (w.found) w.cells.forEach((c) => foundHue.set(c, HUES[wi % HUES.length]));
  });
  const selSet = new Set(selection);
  const foundCount = puzzle.words.filter((w) => w.found).length;

  return (
    <GameShell
      slug="kelime-avi"
      onRestart={newGame}
      result={result}
      stats={[
        { label: "Bulunan", value: `${foundCount}/${puzzle.words.length}` },
        { label: "Süre", value: formatTime(seconds) },
      ]}
    >
      <div
        ref={boardRef}
        className="grid grid-cols-10 gap-0 max-w-md mx-auto card overflow-hidden !rounded-xl select-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {puzzle.grid.map((ch, i) => {
          const hue = foundHue.get(i);
          return (
            <div
              key={i}
              className={cls(
                "aspect-square flex items-center justify-center text-sm sm:text-base font-bold transition-colors",
                selSet.has(i) && "bg-primary/50"
              )}
              style={
                hue !== undefined && !selSet.has(i)
                  ? { backgroundColor: `hsla(${hue}, 75%, 60%, 0.35)` }
                  : undefined
              }
            >
              {ch}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md mx-auto">
        {puzzle.words.map((w, wi) => (
          <span
            key={w.word}
            className={cls(
              "chip text-xs !cursor-default",
              w.found ? "line-through opacity-50" : "bg-surface-2"
            )}
            style={
              w.found
                ? { backgroundColor: `hsla(${HUES[wi % HUES.length]}, 75%, 60%, 0.3)` }
                : undefined
            }
          >
            {w.word}
          </span>
        ))}
      </div>
    </GameShell>
  );
}
