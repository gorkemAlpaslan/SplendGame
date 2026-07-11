"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

const COLS = 7;
const ROWS = 6;

interface S {
  board: (0 | 1 | null)[]; // r*COLS+c, r=0 üst
  turn: 0 | 1;
  winner: Winner;
  line: number[] | null;
}

const init = (): S => ({
  board: Array(COLS * ROWS).fill(null),
  turn: 0,
  winner: null,
  line: null,
});

function checkWin(board: (0 | 1 | null)[], p: 0 | 1): number[] | null {
  const dirs = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r * COLS + c] !== p) continue;
      for (const [dr, dc] of dirs) {
        const cells = [r * COLS + c];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (board[nr * COLS + nc] !== p) break;
          cells.push(nr * COLS + nc);
        }
        if (cells.length === 4) return cells;
      }
    }
  }
  return null;
}

function drop(s: S, col: number): S {
  if (s.winner !== null) return s;
  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (s.board[r * COLS + col] === null) {
      row = r;
      break;
    }
  }
  if (row < 0) return s;
  const board = [...s.board];
  board[row * COLS + col] = s.turn;
  const line = checkWin(board, s.turn);
  const winner: Winner = line
    ? s.turn
    : board.every((c) => c !== null)
      ? "draw"
      : null;
  return { board, turn: s.turn === 0 ? 1 : 0, winner, line };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);
  return (
    <div className="max-w-md mx-auto">
      <div className="card p-2 sm:p-3 bg-gradient-to-b from-surface to-surface-2">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {s.board.map((cell, i) => {
            const col = i % COLS;
            return (
              <button
                key={i}
                onClick={() => canPlay && m.update((cur) => drop(cur, col))}
                disabled={!canPlay}
                className={cls(
                  "aspect-square rounded-full transition-all",
                  cell === 0
                    ? "bg-violet-500 animate-pop"
                    : cell === 1
                      ? "bg-pink-500 animate-pop"
                      : cls("bg-bg/70", canPlay && "hover:bg-bg cursor-pointer"),
                  s.line?.includes(i) && "ring-4 ring-good"
                )}
                aria-label={`Sütun ${col + 1}`}
              />
            );
          })}
        </div>
      </div>
      <p className="text-center text-muted text-sm mt-3">Bir sütuna dokun — pul en alta düşer</p>
    </div>
  );
}

export default function ConnectFour() {
  return (
    <MatchShell<S>
      slug="dortlu-dizi"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
