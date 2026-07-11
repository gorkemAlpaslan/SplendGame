"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { randInt } from "@/lib/utils";

type Grid = number[]; // 16 hücre, 0 = boş

function addTile(g: Grid): Grid {
  const empty = g.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (!empty.length) return g;
  const next = [...g];
  next[empty[randInt(0, empty.length - 1)]] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function newGrid(): Grid {
  return addTile(addTile(new Array(16).fill(0)));
}

/** Bir satırı sola kaydırıp birleştirir; kazanılan puanı döndürür. */
function slideRow(row: number[]): { row: number[]; gained: number } {
  const vals = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      i++;
    } else {
      out.push(vals[i]);
    }
  }
  while (out.length < 4) out.push(0);
  return { row: out, gained };
}

function move(g: Grid, dir: "left" | "right" | "up" | "down"): { grid: Grid; gained: number; moved: boolean } {
  const next = new Array(16).fill(0);
  let gained = 0;
  for (let i = 0; i < 4; i++) {
    // satır/sütunu yön normalize ederek al
    const line: number[] = [];
    for (let j = 0; j < 4; j++) {
      const idx =
        dir === "left" ? i * 4 + j :
        dir === "right" ? i * 4 + (3 - j) :
        dir === "up" ? j * 4 + i :
        (3 - j) * 4 + i;
      line.push(g[idx]);
    }
    const { row, gained: gn } = slideRow(line);
    gained += gn;
    for (let j = 0; j < 4; j++) {
      const idx =
        dir === "left" ? i * 4 + j :
        dir === "right" ? i * 4 + (3 - j) :
        dir === "up" ? j * 4 + i :
        (3 - j) * 4 + i;
      next[idx] = row[j];
    }
  }
  const moved = next.some((v, i) => v !== g[i]);
  return { grid: next, gained, moved };
}

function hasMoves(g: Grid): boolean {
  if (g.includes(0)) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = g[r * 4 + c];
      if (c < 3 && g[r * 4 + c + 1] === v) return true;
      if (r < 3 && g[(r + 1) * 4 + c] === v) return true;
    }
  }
  return false;
}

const TILE_STYLE: Record<number, string> = {
  2: "bg-surface-2 text-ink",
  4: "bg-edge text-ink",
  8: "bg-amber-600 text-white",
  16: "bg-orange-600 text-white",
  32: "bg-red-500 text-white",
  64: "bg-rose-600 text-white",
  128: "bg-yellow-500 text-white",
  256: "bg-yellow-400 text-black",
  512: "bg-lime-500 text-black",
  1024: "bg-emerald-500 text-white",
  2048: "bg-violet-500 text-white",
};

export default function G2048() {
  const [grid, setGrid] = useState<Grid>(() => newGrid());
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [reached2048, setReached2048] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useRef({ grid, score, result, reached2048 });
  useEffect(() => {
    stateRef.current = { grid, score, result, reached2048 };
  }, [grid, score, result, reached2048]);

  const doMove = useCallback((dir: "left" | "right" | "up" | "down") => {
    const { grid: g, score: sc, result: res, reached2048: r2048 } = stateRef.current;
    if (res) return;
    const { grid: movedGrid, gained, moved } = move(g, dir);
    if (!moved) return;
    const withTile = addTile(movedGrid);
    const newScore = sc + gained;
    setGrid(withTile);
    setScore(newScore);
    if (!r2048 && withTile.includes(2048)) {
      setReached2048(true);
      setResult({ won: true, score: newScore, message: "2048'e ulaştın! 🎊" });
    } else if (!hasMoves(withTile)) {
      setResult({ won: false, score: newScore, message: "Hamle kalmadı." });
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      if (map[e.key]) {
        e.preventDefault();
        doMove(map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  function restart() {
    setGrid(newGrid());
    setScore(0);
    setResult(null);
    setReached2048(false);
  }

  return (
    <GameShell
      slug="2048"
      onRestart={restart}
      result={result}
      stats={[{ label: "Puan", value: score.toLocaleString("tr") }]}
    >
      <div
        className="max-w-sm mx-auto card p-2 sm:p-3"
        style={{ touchAction: "none" }}
        onTouchStart={(e) => {
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStart.current) return;
          const dx = e.changedTouches[0].clientX - touchStart.current.x;
          const dy = e.changedTouches[0].clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
          else doMove(dy > 0 ? "down" : "up");
        }}
      >
        <div className="grid grid-cols-4 gap-2">
          {grid.map((v, i) => (
            <div
              key={i}
              className={`aspect-square rounded-xl flex items-center justify-center font-extrabold transition-all ${
                v === 0 ? "bg-bg/60" : `${TILE_STYLE[v] ?? "bg-fuchsia-600 text-white"} animate-pop`
              } ${v >= 1024 ? "text-lg sm:text-2xl" : v >= 128 ? "text-xl sm:text-3xl" : "text-2xl sm:text-3xl"}`}
            >
              {v || ""}
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-muted text-sm mt-4">
        ⌨️ Ok tuşları veya 👆 kaydırma ile oyna
      </p>
    </GameShell>
  );
}
