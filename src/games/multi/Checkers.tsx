"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface Piece {
  player: 0 | 1;
  isKing: boolean;
}

interface S {
  board: (Piece | null)[]; // size 64
  turn: 0 | 1;
  selectedCell: number | null; // index of selected piece
  activeJumper: number | null; // index of piece locked in a multi-jump
  winner: Winner;
}

const init = (): S => {
  const board = Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) {
          board[r * 8 + c] = { player: 1, isKing: false }; // Pink starts at top
        } else if (r > 4) {
          board[r * 8 + c] = { player: 0, isKing: false }; // Violet starts at bottom
        }
      }
    }
  }
  return {
    board,
    turn: 0,
    selectedCell: null,
    activeJumper: null,
    winner: null,
  };
};

interface Jump {
  mid: number;
  target: number;
}

function getValidJumps(board: (Piece | null)[], idx: number): Jump[] {
  const piece = board[idx];
  if (!piece) return [];
  const r = Math.floor(idx / 8);
  const c = idx % 8;
  const jumps: Jump[] = [];

  const directions: [number, number][] = [];
  if (piece.isKing) {
    directions.push([-2, -2], [-2, 2], [2, -2], [2, 2]);
  } else {
    // Player 0 moves up (negative r), Player 1 moves down (positive r)
    const dr = piece.player === 0 ? -2 : 2;
    directions.push([dr, -2], [dr, 2]);
  }

  for (const [dr, dc] of directions) {
    const tr = r + dr;
    const tc = c + dc;
    const mr = r + dr / 2;
    const mc = c + dc / 2;

    if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
      const targetIdx = tr * 8 + tc;
      const midIdx = mr * 8 + mc;
      const targetCell = board[targetIdx];
      const midCell = board[midIdx];

      if (targetCell === null && midCell !== null && midCell.player !== piece.player) {
        jumps.push({ mid: midIdx, target: targetIdx });
      }
    }
  }
  return jumps;
}

function getValidMoves(board: (Piece | null)[], idx: number): number[] {
  const piece = board[idx];
  if (!piece) return [];
  const r = Math.floor(idx / 8);
  const c = idx % 8;
  const moves: number[] = [];

  const directions: [number, number][] = [];
  if (piece.isKing) {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  } else {
    const dr = piece.player === 0 ? -1 : 1;
    directions.push([dr, -1], [dr, 1]);
  }

  for (const [dr, dc] of directions) {
    const tr = r + dr;
    const tc = c + dc;
    if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
      const targetIdx = tr * 8 + tc;
      if (board[targetIdx] === null) {
        moves.push(targetIdx);
      }
    }
  }
  return moves;
}

function hasAnyJumps(board: (Piece | null)[], player: 0 | 1): boolean {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.player === player && getValidJumps(board, i).length > 0) {
      return true;
    }
  }
  return false;
}

function hasAnyMovesOrJumps(board: (Piece | null)[], player: 0 | 1): boolean {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.player === player) {
      if (getValidJumps(board, i).length > 0 || getValidMoves(board, i).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function clickCell(s: S, clickedIdx: number): S {
  if (s.winner !== null) return s;

  const cell = s.board[clickedIdx];
  const mustJump = hasAnyJumps(s.board, s.turn);

  // 1. Selecting a piece
  if (cell && cell.player === s.turn) {
    // If locked in a multi-jump, cannot select another piece
    if (s.activeJumper !== null && s.activeJumper !== clickedIdx) return s;

    // Check if this piece is allowed to move
    if (mustJump && getValidJumps(s.board, clickedIdx).length === 0) {
      // Must select a piece that can jump
      return s;
    }
    return { ...s, selectedCell: clickedIdx };
  }

  // 2. Making a move if selected
  if (s.selectedCell !== null && cell === null) {
    const selectedIdx = s.selectedCell;
    const piece = s.board[selectedIdx];
    if (!piece) return s;

    const jumps = getValidJumps(s.board, selectedIdx);
    const moves = getValidMoves(s.board, selectedIdx);

    const isJump = jumps.find((j) => j.target === clickedIdx);
    const isRegular = moves.includes(clickedIdx);

    if (mustJump && !isJump) return s; // Must jump!
    if (!mustJump && !isRegular && !isJump) return s; // Invalid target

    const nextBoard = [...s.board];
    nextBoard[clickedIdx] = piece;
    nextBoard[selectedIdx] = null;

    let jumpMade = false;
    if (isJump) {
      nextBoard[isJump.mid] = null; // Eat piece
      jumpMade = true;
    }

    // Handle Promotion
    let promoted = false;
    if (piece.player === 0 && Math.floor(clickedIdx / 8) === 0 && !piece.isKing) {
      nextBoard[clickedIdx] = { player: 0, isKing: true };
      promoted = true;
    } else if (piece.player === 1 && Math.floor(clickedIdx / 8) === 7 && !piece.isKing) {
      nextBoard[clickedIdx] = { player: 1, isKing: true };
      promoted = true;
    }

    // Check for multi-jump
    if (jumpMade && !promoted) {
      const extraJumps = getValidJumps(nextBoard, clickedIdx);
      if (extraJumps.length > 0) {
        // Must continue jumping
        return {
          ...s,
          board: nextBoard,
          selectedCell: clickedIdx,
          activeJumper: clickedIdx,
        };
      }
    }

    // Switch turn
    const nextPlayer = s.turn === 0 ? 1 : 0;

    // Check if next player has any moves/jumps left
    let winner: Winner = null;
    if (!hasAnyMovesOrJumps(nextBoard, nextPlayer)) {
      winner = s.turn; // Opponent has no moves, current player wins!
    }

    return {
      board: nextBoard,
      turn: nextPlayer,
      selectedCell: null,
      activeJumper: null,
      winner,
    };
  }

  return s;
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);

  const selectedIdx = s.selectedCell;
  const isJumping = s.activeJumper !== null;
  const mustJump = hasAnyJumps(s.board, s.turn);

  // Targets helper
  let targets: number[] = [];
  if (selectedIdx !== null) {
    if (mustJump) {
      targets = getValidJumps(s.board, selectedIdx).map((j) => j.target);
    } else {
      targets = getValidMoves(s.board, selectedIdx);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-3 bg-zinc-800/40 border-zinc-700/60 shadow-xl select-none">
        <div className="grid grid-cols-8 gap-0 aspect-square border-4 border-zinc-850 rounded-xl overflow-hidden">
          {s.board.map((cell, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const isDark = (r + c) % 2 === 1;

            const isSelected = selectedIdx === i;
            const isTarget = targets.includes(i);
            const isClickable = canPlay && (
              (cell && cell.player === s.turn && (!isJumping || s.activeJumper === i) && (!mustJump || getValidJumps(s.board, i).length > 0)) ||
              isTarget
            );

            return (
              <button
                key={i}
                disabled={!isClickable && !isSelected}
                onClick={() => canPlay && m.update((cur) => clickCell(cur, i))}
                className={cls(
                  "aspect-square flex items-center justify-center transition-all relative border border-black/10",
                  isDark ? "bg-zinc-900" : "bg-zinc-200",
                  isSelected && "ring-4 ring-primary-soft z-10",
                  isTarget && "bg-primary/20 cursor-pointer hover:bg-primary/30",
                  isClickable && cell && "cursor-pointer hover:brightness-110 active:scale-95"
                )}
                aria-label={`Kare ${r + 1}-${c + 1}`}
              >
                {/* Target Dot */}
                {isTarget && (
                  <span className="w-3.5 h-3.5 rounded-full bg-primary-soft/50 absolute" />
                )}

                {/* Piece */}
                {cell !== null && (
                  <div
                    className={cls(
                      "w-[75%] h-[75%] rounded-full shadow-lg shadow-black/50 border flex items-center justify-center relative transition-transform duration-100",
                      cell.player === 0
                        ? "bg-violet-600 border-violet-400"
                        : "bg-pink-500 border-pink-300",
                      cell.isKing && "animate-pulse"
                    )}
                  >
                    {/* Inner ridge for classic checkers look */}
                    <div className="w-[70%] h-[70%] rounded-full border border-black/10 flex items-center justify-center">
                      {cell.isKing && (
                        <span className="text-sm sm:text-lg drop-shadow" aria-label="Şah">👑</span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-center text-muted text-xs mt-3 space-y-1">
        <p>🟣 {m.names[0]} (mor) · 🩷 {m.names[1]} (pembe)</p>
        {mustJump && !s.winner && (
          <p className="text-accent font-bold">⚠️ Mecburi atlama hamlesi var!</p>
        )}
        {isJumping && !s.winner && (
          <p className="text-primary-soft font-bold animate-pulse">🔗 Zincirleme atlamaya devam et!</p>
        )}
      </div>
    </div>
  );
}

export default function Checkers() {
  return (
    <MatchShell<S>
      slug="dama"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
