"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface S {
  board: (0 | 1 | null)[]; // size 64
  turn: 0 | 1;
  winner: Winner;
}

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function init(): S {
  const board = Array(64).fill(null);
  board[27] = 1; // White
  board[28] = 0; // Black
  board[35] = 0; // Black
  board[36] = 1; // White
  return { board, turn: 0, winner: null };
}

/** Returns the list of indices that would flip if player `p` places a disk at `idx` */
function getFlips(board: (0 | 1 | null)[], p: 0 | 1, idx: number): number[] {
  if (board[idx] !== null) return [];
  const flips: number[] = [];
  const r = Math.floor(idx / 8);
  const c = idx % 8;
  const opp = p === 0 ? 1 : 0;

  for (const [dr, dc] of DIRS) {
    let curR = r + dr;
    let curC = c + dc;
    const temp: number[] = [];

    while (curR >= 0 && curR < 8 && curC >= 0 && curC < 8) {
      const curIdx = curR * 8 + curC;
      const cell = board[curIdx];
      if (cell === opp) {
        temp.push(curIdx);
      } else if (cell === p) {
        if (temp.length > 0) {
          flips.push(...temp);
        }
        break;
      } else {
        break;
      }
      curR += dr;
      curC += dc;
    }
  }

  return flips;
}

function hasAnyValidMove(board: (0 | 1 | null)[], p: 0 | 1): boolean {
  for (let i = 0; i < 64; i++) {
    if (getFlips(board, p, i).length > 0) return true;
  }
  return false;
}

function makeMove(s: S, idx: number): S {
  if (s.winner !== null) return s;
  const flips = getFlips(s.board, s.turn, idx);
  if (flips.length === 0) return s;

  const board = [...s.board];
  board[idx] = s.turn;
  for (const f of flips) {
    board[f] = s.turn;
  }

  const nextOpp: 0 | 1 = s.turn === 0 ? 1 : 0;
  let nextTurn: 0 | 1 = nextOpp;
  let winner: Winner = null;

  // Check if next player has valid moves
  if (!hasAnyValidMove(board, nextOpp)) {
    // If not, turn passes back to current player
    if (hasAnyValidMove(board, s.turn)) {
      nextTurn = s.turn;
    } else {
      // If neither has moves, game ends
      const p0Count = board.filter((x) => x === 0).length;
      const p1Count = board.filter((x) => x === 1).length;
      winner = p0Count > p1Count ? 0 : p1Count > p0Count ? 1 : "draw";
    }
  }

  return { board, turn: nextTurn, winner };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);

  // Compute counts
  const p0Count = s.board.filter((x) => x === 0).length;
  const p1Count = s.board.filter((x) => x === 1).length;

  // Mark valid moves for visual aid
  const validMoves = Array.from({ length: 64 }, (_, i) =>
    canPlay ? getFlips(s.board, s.turn, i).length > 0 : false
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-3 bg-emerald-900/40 border-emerald-800/60 shadow-xl select-none">
        <div className="grid grid-cols-8 gap-1 aspect-square bg-emerald-950 p-2 rounded-xl">
          {s.board.map((cell, i) => {
            const isValid = validMoves[i];
            const isClickable = isValid && canPlay;

            return (
              <button
                key={i}
                disabled={!isClickable}
                onClick={() => m.update((cur) => makeMove(cur, i))}
                className={cls(
                  "aspect-square rounded-md flex items-center justify-center transition-all relative border border-emerald-900/30",
                  isClickable ? "bg-emerald-900/40 hover:bg-emerald-850 cursor-pointer" : "bg-emerald-900/20"
                )}
                aria-label={`Hücre ${Math.floor(i / 8) + 1}-${(i % 8) + 1}`}
              >
                {/* Visual indicator for valid moves */}
                {isValid && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/40 absolute" />
                )}

                {/* Disks */}
                {cell === 0 && (
                  <span className="w-[80%] h-[80%] rounded-full bg-violet-600 border border-violet-400 shadow-lg shadow-black/40 flex items-center justify-center animate-pop">
                    <span className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-violet-500 to-violet-700 block" />
                  </span>
                )}
                {cell === 1 && (
                  <span className="w-[80%] h-[80%] rounded-full bg-pink-500 border border-pink-300 shadow-lg shadow-black/40 flex items-center justify-center animate-pop">
                    <span className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-pink-400 to-pink-600 block" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 px-2 text-sm text-muted">
        <span>🟣 {m.names[0]}: <b>{p0Count}</b></span>
        <span>Tahta Payı: <b>{p0Count + p1Count}/64</b></span>
        <span>🩷 {m.names[1]}: <b>{p1Count}</b></span>
      </div>
    </div>
  );
}

export default function Reversi() {
  return (
    <MatchShell<S>
      slug="reversi"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
      getScores={(s) => [
        s.board.filter((x) => x === 0).length,
        s.board.filter((x) => x === 1).length,
      ]}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
