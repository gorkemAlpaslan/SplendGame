"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface S {
  board: (0 | 1 | null)[]; // size 225 (15 * 15)
  turn: 0 | 1;
  line: number[] | null; // indices of the winning line
  winner: Winner;
}

const init = (): S => ({
  board: Array(225).fill(null),
  turn: 0,
  line: null,
  winner: null,
});

function getWinningLine(board: (0 | 1 | null)[], idx: number, p: 0 | 1): number[] | null {
  const r = Math.floor(idx / 15);
  const c = idx % 15;
  const dirs = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal up-right
  ];

  for (const [dr, dc] of dirs) {
    const line = [idx];

    // Forward
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= 15 || nc < 0 || nc >= 15) break;
      const nIdx = nr * 15 + nc;
      if (board[nIdx] !== p) break;
      line.push(nIdx);
      step++;
    }

    // Backward
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= 15 || nc < 0 || nc >= 15) break;
      const nIdx = nr * 15 + nc;
      if (board[nIdx] !== p) break;
      line.push(nIdx);
      step++;
    }

    if (line.length >= 5) {
      return line;
    }
  }

  return null;
}

function play(s: S, idx: number): S {
  if (s.winner !== null || s.board[idx] !== null) return s;

  const board = [...s.board];
  board[idx] = s.turn;

  const line = getWinningLine(board, idx, s.turn);
  let winner: Winner = null;
  if (line) {
    winner = s.turn;
  } else if (board.every((cell) => cell !== null)) {
    winner = "draw";
  }

  return {
    board,
    turn: s.turn === 0 ? 1 : 0,
    line,
    winner,
  };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-3 bg-surface-2/30 select-none overflow-x-auto">
        {/* 15x15 Board Grid */}
        <div className="grid grid-cols-15 gap-[2px] bg-edge/20 p-2 rounded-xl min-w-[320px]">
          {s.board.map((cell, i) => {
            const isWinningCell = s.line?.includes(i);
            const isClickable = cell === null && s.winner === null && m.canAct(s.turn);

            return (
              <button
                key={i}
                disabled={!isClickable}
                onClick={() => m.update((cur) => play(cur, i))}
                className={cls(
                  "aspect-square rounded-sm flex items-center justify-center transition-all relative",
                  isWinningCell
                    ? "bg-good/30 ring-1 ring-good animate-pulse"
                    : "bg-surface-2/60",
                  isClickable && "hover:bg-primary/20 cursor-pointer active:scale-90"
                )}
                aria-label={`Kesişim ${Math.floor(i / 15) + 1}-${(i % 15) + 1}`}
              >
                {/* Visual grid line intersection (a centered crosshair) */}
                {cell === null && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-full h-[1px] bg-muted/50 absolute" />
                    <div className="h-full w-[1px] bg-muted/50 absolute" />
                  </div>
                )}

                {/* Stones */}
                {cell === 0 && (
                  <span className="w-[85%] h-[85%] rounded-full bg-violet-500 border border-violet-300 shadow-md shadow-black/40 block animate-pop" />
                )}
                {cell === 1 && (
                  <span className="w-[85%] h-[85%] rounded-full bg-pink-500 border border-pink-300 shadow-md shadow-black/40 block animate-pop" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-muted text-xs mt-3">
        Kesişim noktalarına taş yerleştir · Yatay, dikey veya çapraz 5 taş dizen kazanır.
      </p>
    </div>
  );
}

export default function Gomoku() {
  return (
    <MatchShell<S>
      slug="bes-tas"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
