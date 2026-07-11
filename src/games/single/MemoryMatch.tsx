"use client";

import { useCallback, useRef, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useTimer } from "@/lib/hooks";
import { cls, formatTime, shuffle } from "@/lib/utils";

const EMOJIS = [
  "🐶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐙", "🦄",
  "🍕", "🍩", "🍓", "🥑", "🚀", "🎸", "⚽", "🎯",
  "🌈", "⭐", "🔥", "💎",
];

type Size = "4x4" | "4x5" | "6x6";
const SIZES: { key: Size; cols: number; pairs: number; base: number }[] = [
  { key: "4x4", cols: 4, pairs: 8, base: 600 },
  { key: "4x5", cols: 4, pairs: 10, base: 900 },
  { key: "6x6", cols: 6, pairs: 18, base: 1600 },
];

interface Card {
  emoji: string;
  open: boolean;
  matched: boolean;
}

export default function MemoryMatch() {
  const [size, setSize] = useState<Size>("4x4");
  const cfg = SIZES.find((s) => s.key === size)!;
  const [cards, setCards] = useState<Card[]>(() => deal(8));
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [started, setStarted] = useState(false);
  const lock = useRef(false);
  const firstPick = useRef<number | null>(null);
  const { seconds, reset: resetTimer } = useTimer(started && result === null);

  function deal(pairs: number): Card[] {
    const chosen = shuffle(EMOJIS).slice(0, pairs);
    return shuffle([...chosen, ...chosen]).map((emoji) => ({
      emoji,
      open: false,
      matched: false,
    }));
  }

  const newGame = useCallback(
    (s: Size) => {
      const c = SIZES.find((x) => x.key === s)!;
      setSize(s);
      setCards(deal(c.pairs));
      setMoves(0);
      setResult(null);
      setStarted(false);
      lock.current = false;
      firstPick.current = null;
      resetTimer();
    },
    [resetTimer]
  );

  function flip(i: number) {
    if (lock.current || result) return;
    const card = cards[i];
    if (card.open || card.matched) return;
    setStarted(true);

    const next = cards.map((c, j) => (j === i ? { ...c, open: true } : c));
    setCards(next);

    if (firstPick.current === null) {
      firstPick.current = i;
      return;
    }

    const a = firstPick.current;
    firstPick.current = null;
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (next[a].emoji === next[i].emoji) {
      const matched = next.map((c, j) =>
        j === a || j === i ? { ...c, matched: true } : c
      );
      setCards(matched);
      if (matched.every((c) => c.matched)) {
        const score = Math.max(
          50,
          cfg.base - Math.max(0, newMoves - cfg.pairs) * 25 - seconds * 3
        );
        setResult({
          won: true,
          score,
          message: `${newMoves} hamlede, ${formatTime(seconds)} sürede!`,
        });
      }
    } else {
      lock.current = true;
      setTimeout(() => {
        setCards((cur) =>
          cur.map((c, j) => (j === a || j === i ? { ...c, open: false } : c))
        );
        lock.current = false;
      }, 800);
    }
  }

  return (
    <GameShell
      slug="hafiza-kartlari"
      onRestart={() => newGame(size)}
      result={result}
      stats={[
        { label: "Hamle", value: moves },
        { label: "Süre", value: formatTime(seconds) },
      ]}
    >
      <div className="flex gap-2 mb-4 justify-center">
        {SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => newGame(s.key)}
            className={cls(
              "chip",
              size === s.key ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {s.key}
          </button>
        ))}
      </div>

      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))`,
          maxWidth: cfg.cols === 6 ? 420 : 340,
        }}
      >
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => flip(i)}
            className={cls(
              "aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200",
              c.matched
                ? "bg-good/20 scale-95"
                : c.open
                  ? "bg-surface-2 border border-primary/50"
                  : "bg-gradient-to-br from-primary/70 to-secondary/70 hover:scale-105 active:scale-95 cursor-pointer"
            )}
          >
            <span className={c.open || c.matched ? "animate-pop" : "opacity-0"}>
              {c.open || c.matched ? c.emoji : "?"}
            </span>
          </button>
        ))}
      </div>
    </GameShell>
  );
}
