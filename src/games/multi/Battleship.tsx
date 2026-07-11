"use client";

import { useEffect, useRef } from "react";
import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface S {
  phase: "setup" | "playing" | "finished";
  ready: [boolean, boolean];
  ships: [number[], number[]]; // cell indices for player 0 and player 1
  boards: (null | "hit" | "miss")[][]; // boards[p] is player p's board containing opponent's shots
  turn: 0 | 1;
  winner: Winner;
}

function randomPlaceShips(): number[] {
  const grid = Array(100).fill(false);
  const sizes = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  const ships: number[] = [];

  const isValid = (r: number, c: number) => r >= 0 && r < 10 && c >= 0 && c < 10;
  const isBlocked = (r: number, c: number) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (isValid(nr, nc) && grid[nr * 10 + nc]) return true;
      }
    }
    return false;
  };

  for (const size of sizes) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 1000) {
      attempts++;
      const isVert = Math.random() < 0.5;
      const r = Math.floor(Math.random() * (isVert ? 11 - size : 10));
      const c = Math.floor(Math.random() * (isVert ? 10 : 11 - size));

      let fits = true;
      const cells: number[] = [];
      for (let i = 0; i < size; i++) {
        const nr = isVert ? r + i : r;
        const nc = isVert ? c : c + i;
        if (isBlocked(nr, nc)) {
          fits = false;
          break;
        }
        cells.push(nr * 10 + nc);
      }

      if (fits) {
        for (const idx of cells) {
          grid[idx] = true;
          ships.push(idx);
        }
        placed = true;
      }
    }
    if (!placed) {
      return randomPlaceShips();
    }
  }
  return ships;
}

const init = (): S => ({
  phase: "setup",
  ready: [false, false],
  ships: [randomPlaceShips(), randomPlaceShips()],
  boards: [Array(100).fill(null), Array(100).fill(null)],
  turn: 0,
  winner: null,
});

function shoot(s: S, idx: number): S {
  if (s.phase !== "playing" || s.winner !== null) return s;
  
  const opp = s.turn === 0 ? 1 : 0;
  // If already shot at, do nothing
  if (s.boards[opp][idx] !== null) return s;

  const newBoards = s.boards.map((b, i) => (i === opp ? [...b] : b));
  const isHit = s.ships[opp].includes(idx);
  newBoards[opp][idx] = isHit ? "hit" : "miss";

  // Check if all opponent ships are hit (20 total tiles)
  const hits = newBoards[opp].filter((cell) => cell === "hit").length;
  const allSunk = hits === 20;

  let winner: Winner = null;
  let nextPhase: "setup" | "playing" | "finished" = s.phase;
  if (allSunk) {
    winner = s.turn;
    nextPhase = "finished";
  }

  return {
    ...s,
    boards: newBoards,
    phase: nextPhase,
    // Hit gets another turn, otherwise alternate
    turn: allSunk ? s.turn : isHit ? s.turn : opp,
    winner,
  };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const mySeat = m.seat;
  const isLocal = m.isLocal;
  const opponentSeat = mySeat === 0 ? 1 : 0;

  // Track if local game was auto-started
  const localStartedRef = useRef(false);

  // In local play, we auto-start to avoid screen peeking
  useEffect(() => {
    if (isLocal && !localStartedRef.current && s.phase === "setup") {
      localStartedRef.current = true;
      m.update((cur) => ({
        ...cur,
        ships: [randomPlaceShips(), randomPlaceShips()],
        ready: [true, true],
        phase: "playing",
      }));
    }
  }, [isLocal, s.phase, m]);

  const handleShuffle = () => {
    m.update((cur) => {
      const nextShips = [...cur.ships] as [number[], number[]];
      nextShips[mySeat] = randomPlaceShips();
      return { ...cur, ships: nextShips };
    });
  };

  const handleReady = () => {
    m.update((cur) => {
      const nextReady = [...cur.ready] as [boolean, boolean];
      nextReady[mySeat] = true;
      const allReady = nextReady[0] && nextReady[1];
      return {
        ...cur,
        ready: nextReady,
        phase: allReady ? "playing" : cur.phase,
      };
    });
  };

  if (s.phase === "setup") {
    const isReady = s.ready[mySeat];
    const otherReady = s.ready[opponentSeat];

    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="card p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">🚢 Donanmanı Konumlandır</h2>
          <p className="text-muted text-sm">
            Gemilerin otomatik olarak yerleştirildi. İstersen tekrar karıştırabilirsin.
          </p>

          {/* Grid Preview (Self) */}
          <div className="grid grid-cols-10 gap-1 w-64 h-64 mx-auto border border-edge/40 p-2 rounded-xl bg-bg/50">
            {Array.from({ length: 100 }).map((_, i) => {
              const hasShip = s.ships[mySeat].includes(i);
              return (
                <div
                  key={i}
                  className={cls(
                    "rounded-sm aspect-square transition-all",
                    hasShip ? "bg-primary-soft shadow-inner shadow-black/30" : "bg-surface-2/40"
                  )}
                />
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShuffle}
              disabled={isReady}
              className="btn-ghost flex-1 !py-2.5"
            >
              🔄 Karıştır
            </button>
            <button
              onClick={handleReady}
              disabled={isReady}
              className={cls("flex-1 !py-2.5", isReady ? "btn-ghost" : "btn-primary")}
            >
              {isReady ? "⏳ Bekleniyor..." : "👍 Hazır"}
            </button>
          </div>

          <p className="text-xs text-muted">
            {otherReady ? "👤 Rakibin hazır!" : "⏳ Rakibin gemilerini yerleştiriyor..."}
          </p>
        </div>
      </div>
    );
  }

  // Active playing phase UI
  const turnPlayer = s.turn;
  const canAct = m.canAct(turnPlayer);

  // Stats
  const targetBoard = turnPlayer === 0 ? 1 : 0;
  const remainingTiles = 20 - s.boards[targetBoard].filter((x) => x === "hit").length;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Opponent's Board (The Target Grid) */}
      <div className="card p-4 flex flex-col items-center">
        <h3 className="font-extrabold text-sm text-muted mb-2 uppercase tracking-wider">
          🎯 RAKİBİN DENİZİ (Atış Yap)
        </h3>
        <div className="grid grid-cols-10 gap-1 w-full max-w-[340px] aspect-square border border-edge/40 p-2 rounded-2xl bg-surface-2/20">
          {Array.from({ length: 100 }).map((_, i) => {
            // We shoot at the opponent's board (opponentSeat if online, or 1-turnPlayer if local)
            const target = isLocal ? (turnPlayer === 0 ? 1 : 0) : opponentSeat;
            const shot = s.boards[target][i];
            const isClickable = shot === null && canAct && (isLocal || turnPlayer === mySeat);

            return (
              <button
                key={i}
                disabled={!isClickable}
                onClick={() => m.update((cur) => shoot(cur, i))}
                className={cls(
                  "rounded-md aspect-square transition-all flex items-center justify-center text-[10px] sm:text-xs",
                  shot === "hit"
                    ? "bg-bad/20 text-bad border border-bad/30 font-bold animate-pop"
                    : shot === "miss"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold"
                      : cls(
                          "bg-surface-2/40",
                          isClickable && "hover:bg-primary/30 cursor-pointer active:scale-90"
                        )
                )}
                aria-label={`Kare ${Math.floor(i / 10) + 1}-${(i % 10) + 1}`}
              >
                {shot === "hit" && "🔥"}
                {shot === "miss" && "💧"}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-3">
          Kalan Gemi Bölmesi: <b className="text-ink">{remainingTiles}</b>
        </p>
      </div>

      {/* 2. My Board (Self Grid showing opponent's hits/misses) */}
      <div className="card p-4 flex flex-col items-center">
        <h3 className="font-extrabold text-sm text-muted mb-2 uppercase tracking-wider">
          ⚓ KENDİ DENİZİN (Savunma)
        </h3>
        <div className="grid grid-cols-10 gap-1 w-full max-w-[340px] aspect-square border border-edge/40 p-2 rounded-2xl bg-surface-2/10 opacity-80">
          {Array.from({ length: 100 }).map((_, i) => {
            const self = isLocal ? turnPlayer : mySeat;
            const hasShip = s.ships[self].includes(i);
            const shot = s.boards[self][i];

            return (
              <div
                key={i}
                className={cls(
                  "rounded-md aspect-square flex items-center justify-center text-[10px] sm:text-xs border",
                  shot === "hit"
                    ? "bg-bad/30 text-bad border-bad/50 font-bold"
                    : shot === "miss"
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                      : hasShip
                        ? "bg-primary/20 border-primary-soft/30 text-primary-soft"
                        : "bg-surface-2/20 border-transparent"
                )}
              >
                {shot === "hit" && "🔥"}
                {shot === "miss" && "💧"}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-3">
          Gemilerin yerlerini ve rakibin atışlarını görüyorsun.
        </p>
      </div>
    </div>
  );
}

export default function Battleship() {
  return (
    <MatchShell<S>
      slug="amiral-batti"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
