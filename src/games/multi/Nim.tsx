"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface S {
  piles: number[];
  turn: 0 | 1;
  winner: Winner;
}

const init = (): S => ({ piles: [1, 3, 5, 7], turn: 0, winner: null });

/** p yığınını k taşa indirir (k < mevcut) */
function take(s: S, p: number, k: number): S {
  if (s.winner !== null || k >= s.piles[p]) return s;
  const piles = [...s.piles];
  piles[p] = k;
  const winner: Winner = piles.every((x) => x === 0) ? s.turn : null;
  return { piles, turn: s.turn === 0 ? 1 : 0, winner };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);
  return (
    <div className="max-w-md mx-auto space-y-3">
      {s.piles.map((count, p) => (
        <div key={p} className="card p-3 flex items-center gap-2 min-h-16">
          <span className="text-xs text-muted font-bold w-4">{p + 1}</span>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                onClick={() => canPlay && m.update((cur) => take(cur, p, i))}
                disabled={!canPlay}
                title={`${count - i} taş al`}
                className={cls(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-lg flex items-center justify-center transition-all",
                  canPlay && "hover:scale-110 hover:brightness-125 active:scale-90 cursor-pointer"
                )}
              >
                🪨
              </button>
            ))}
            {count === 0 && <span className="text-muted text-sm italic py-2">boş</span>}
          </div>
        </div>
      ))}
      <p className="text-center text-muted text-sm">
        Bir taşa dokun: o taş ve sağındakiler alınır · Son taşı alan kazanır!
      </p>
    </div>
  );
}

export default function Nim() {
  return (
    <MatchShell<S>
      slug="nim"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
