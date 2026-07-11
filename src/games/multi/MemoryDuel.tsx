"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls, shuffle } from "@/lib/utils";

const EMOJIS = ["🐱", "🐶", "🦊", "🐸", "🐵", "🦄", "🐼", "🐨", "🦁", "🐷", "🐯", "🤖"];

interface Card {
  value: string;
  matched: boolean;
}

interface S {
  cards: Card[]; // size 24
  flipped: number[]; // indices of flipped cards (max 2)
  scores: [number, number];
  turn: 0 | 1;
  winner: Winner;
}

function init(): S {
  // Create 12 pairs of cards
  const values = [...EMOJIS, ...EMOJIS];
  const shuffled = shuffle(values);
  const cards = shuffled.map((val) => ({ value: val, matched: false }));

  return {
    cards,
    flipped: [],
    scores: [0, 0],
    turn: 0,
    winner: null,
  };
}

function clickCard(s: S, idx: number): S {
  if (s.winner !== null || s.cards[idx].matched || s.flipped.includes(idx)) return s;

  let flipped = [...s.flipped];
  const cards = s.cards.map((c) => ({ ...c }));
  const scores = [...s.scores] as [number, number];
  let turn = s.turn;

  // If two cards are currently flipped mismatching, reset them first and switch turn, then flip the clicked one
  if (flipped.length === 2) {
    flipped = [idx];
    turn = s.turn === 0 ? 1 : 0;
  } else if (flipped.length === 0) {
    flipped = [idx];
  } else if (flipped.length === 1) {
    flipped.push(idx);
    
    // Check match
    const firstIdx = flipped[0];
    const secondIdx = flipped[1];
    if (cards[firstIdx].value === cards[secondIdx].value) {
      cards[firstIdx].matched = true;
      cards[secondIdx].matched = true;
      scores[turn] += 1;
      flipped = []; // Match remains open, clear flip list
      // Turn stays with same player
    }
  }

  // Check if all matched
  const allMatched = cards.every((c) => c.matched);
  let winner: Winner = null;
  if (allMatched) {
    winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : "draw";
  }

  return {
    cards,
    flipped,
    scores,
    turn,
    winner,
  };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* 4x6 grid */}
      <div className="card p-4 bg-surface-2/30 select-none">
        <div className="grid grid-cols-6 gap-2">
          {s.cards.map((card, i) => {
            const isFlipped = s.flipped.includes(i);
            const isMatched = card.matched;
            const isOpen = isFlipped || isMatched;

            return (
              <button
                key={i}
                disabled={!canPlay || isMatched || isFlipped}
                onClick={() => m.update((cur) => clickCard(cur, i))}
                className={cls(
                  "aspect-[3/4] rounded-xl text-2xl font-bold flex items-center justify-center transition-all duration-300 relative border",
                  isOpen
                    ? "bg-primary/20 border-primary-soft/50 text-ink rotate-y-180"
                    : cls(
                        "bg-surface-2 border-edge/60 text-transparent",
                        canPlay && "hover:-translate-y-0.5 hover:border-primary-soft cursor-pointer active:scale-95"
                      )
                )}
                aria-label={`Kart ${i + 1}`}
              >
                {isOpen ? (
                  <span className="animate-pop">{card.value}</span>
                ) : (
                  <span className="text-muted/40 font-extrabold text-sm sm:text-base">?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between items-center px-2 text-sm text-muted">
        <span>🟣 {m.names[0]}: <b>{s.scores[0]}</b> çift</span>
        <span>Eşleşen: <b>{s.cards.filter((c) => c.matched).length / 2} / 12</b></span>
        <span>🩷 {m.names[1]}: <b>{s.scores[1]}</b> çift</span>
      </div>
    </div>
  );
}

export default function MemoryDuel() {
  return (
    <MatchShell<S>
      slug="hafiza-duellosu"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
      getScores={(s) => s.scores}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
