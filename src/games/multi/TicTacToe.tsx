"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface S {
  board: (0 | 1 | null)[];
  turn: 0 | 1;
  winner: Winner;
  line: number[] | null;
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const init = (): S => ({ board: Array(9).fill(null), turn: 0, winner: null, line: null });

function play(s: S, i: number): S {
  if (s.winner !== null || s.board[i] !== null) return s;
  const board = [...s.board];
  board[i] = s.turn;
  let winner: Winner = null;
  let line: number[] | null = null;
  for (const l of LINES) {
    if (l.every((j) => board[j] === s.turn)) {
      winner = s.turn;
      line = l;
      break;
    }
  }
  if (winner === null && board.every((c) => c !== null)) winner = "draw";
  return { board, turn: s.turn === 0 ? 1 : 0, winner, line };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {s.board.map((cell, i) => (
        <button
          key={i}
          onClick={() => m.canAct(s.turn) && m.update((cur) => play(cur, i))}
          disabled={cell !== null || s.winner !== null || !m.canAct(s.turn)}
          className={cls(
            "aspect-square rounded-2xl text-5xl font-extrabold flex items-center justify-center transition-all",
            s.line?.includes(i)
              ? "bg-good/30 ring-2 ring-good"
              : "bg-surface-2",
            cell === null && s.winner === null && m.canAct(s.turn) && "hover:bg-edge cursor-pointer active:scale-95"
          )}
        >
          {cell === 0 && <span className="text-primary-soft animate-pop">✕</span>}
          {cell === 1 && <span className="text-secondary animate-pop">◯</span>}
        </button>
      ))}
    </div>
  );
}

export default function TicTacToe() {
  return (
    <MatchShell<S>
      slug="xox"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
