"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { cls } from "@/lib/utils";

const DISK_COLORS = [
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
];

export default function Hanoi() {
  const [count, setCount] = useState(4);
  const [rods, setRods] = useState<number[][]>(() => [[4, 3, 2, 1], [], []]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  const newGame = useCallback((n: number) => {
    setCount(n);
    setRods([Array.from({ length: n }, (_, i) => n - i), [], []]);
    setSelected(null);
    setMoves(0);
    setResult(null);
  }, []);

  function tapRod(r: number) {
    if (result) return;
    if (selected === null) {
      if (rods[r].length) setSelected(r);
      return;
    }
    if (selected === r) {
      setSelected(null);
      return;
    }
    const disk = rods[selected][rods[selected].length - 1];
    const top = rods[r][rods[r].length - 1];
    if (top !== undefined && top < disk) {
      setSelected(null);
      return;
    }
    const next = rods.map((rod) => [...rod]);
    next[selected].pop();
    next[r].push(disk);
    setRods(next);
    setSelected(null);
    const m = moves + 1;
    setMoves(m);
    if (next[2].length === count) {
      const min = 2 ** count - 1;
      const score = Math.round(400 * count * (min / m));
      setResult({
        won: true,
        score,
        message: `${m} hamle (minimum: ${min})`,
      });
    }
  }

  const min = 2 ** count - 1;

  return (
    <GameShell
      slug="hanoi"
      onRestart={() => newGame(count)}
      result={result}
      stats={[
        { label: "Hamle", value: moves },
        { label: "Minimum", value: min },
      ]}
    >
      <div className="flex gap-2 mb-6 justify-center">
        {[3, 4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => newGame(n)}
            className={cls(
              "chip",
              count === n ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {n} disk
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
        {rods.map((rod, r) => (
          <button
            key={r}
            onClick={() => tapRod(r)}
            className={cls(
              "relative h-48 rounded-xl flex flex-col-reverse items-center pb-2 gap-1 transition-colors cursor-pointer",
              selected === r ? "bg-primary/15 ring-2 ring-primary" : "bg-surface hover:bg-surface-2"
            )}
          >
            <div className="absolute bottom-2 w-[85%] h-1.5 rounded bg-edge" />
            <div className="absolute bottom-2 top-6 w-1.5 rounded bg-edge" />
            {rod.map((disk, i) => {
              const isTop = i === rod.length - 1;
              const lifted = selected === r && isTop;
              return (
                <div
                  key={disk}
                  className={cls(
                    "h-6 rounded-full z-10 transition-all",
                    DISK_COLORS[disk - 1],
                    lifted && "-translate-y-3 shadow-xl"
                  )}
                  style={{ width: `${28 + disk * 11}%` }}
                />
              );
            })}
            <span className="absolute top-1 text-xs text-muted font-bold">{r + 1}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-muted text-sm mt-4">
        Önce kaynak çubuğa, sonra hedef çubuğa dokun · Tüm diskleri 3. çubuğa taşı
      </p>
    </GameShell>
  );
}
