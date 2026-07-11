"use client";

import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { cls } from "@/lib/utils";

interface S {
  hLines: boolean[]; // size 5 * 4 = 20
  vLines: boolean[]; // size 4 * 5 = 20
  boxes: (0 | 1 | null)[]; // size 4 * 4 = 16
  turn: 0 | 1;
  winner: Winner;
}

const init = (): S => ({
  hLines: Array(20).fill(false),
  vLines: Array(20).fill(false),
  boxes: Array(16).fill(null),
  turn: 0,
  winner: null,
});

// Helper to check if a specific box has all 4 lines drawn
function isBoxCompleted(y: number, x: number, h: boolean[], v: boolean[]): boolean {
  if (y < 0 || y >= 4 || x < 0 || x >= 4) return false;
  const top = h[y * 4 + x];
  const bottom = h[(y + 1) * 4 + x];
  const left = v[y * 5 + x];
  const right = v[y * 5 + x + 1];
  return top && bottom && left && right;
}

function playHorizontal(s: S, y: number, x: number): S {
  const idx = y * 4 + x;
  if (s.winner !== null || s.hLines[idx]) return s;

  const hLines = [...s.hLines];
  hLines[idx] = true;

  const boxes = [...s.boxes];
  let completedBox = false;

  // Check box above
  if (y > 0) {
    const boxY = y - 1;
    const boxIdx = boxY * 4 + x;
    if (boxes[boxIdx] === null && isBoxCompleted(boxY, x, hLines, s.vLines)) {
      boxes[boxIdx] = s.turn;
      completedBox = true;
    }
  }

  // Check box below
  if (y < 4) {
    const boxY = y;
    const boxIdx = boxY * 4 + x;
    if (boxes[boxIdx] === null && isBoxCompleted(boxY, x, hLines, s.vLines)) {
      boxes[boxIdx] = s.turn;
      completedBox = true;
    }
  }

  const allDone = boxes.every((b) => b !== null);
  let winner: Winner = null;
  if (allDone) {
    const p0 = boxes.filter((b) => b === 0).length;
    const p1 = boxes.filter((b) => b === 1).length;
    winner = p0 > p1 ? 0 : p1 > p0 ? 1 : "draw";
  }

  return {
    hLines,
    vLines: s.vLines,
    boxes,
    turn: completedBox ? s.turn : s.turn === 0 ? 1 : 0,
    winner,
  };
}

function playVertical(s: S, y: number, x: number): S {
  const idx = y * 5 + x;
  if (s.winner !== null || s.vLines[idx]) return s;

  const vLines = [...s.vLines];
  vLines[idx] = true;

  const boxes = [...s.boxes];
  let completedBox = false;

  // Check box left
  if (x > 0) {
    const boxX = x - 1;
    const boxIdx = y * 4 + boxX;
    if (boxes[boxIdx] === null && isBoxCompleted(y, boxX, s.hLines, vLines)) {
      boxes[boxIdx] = s.turn;
      completedBox = true;
    }
  }

  // Check box right
  if (x < 4) {
    const boxX = x;
    const boxIdx = y * 4 + boxX;
    if (boxes[boxIdx] === null && isBoxCompleted(y, boxX, s.hLines, vLines)) {
      boxes[boxIdx] = s.turn;
      completedBox = true;
    }
  }

  const allDone = boxes.every((b) => b !== null);
  let winner: Winner = null;
  if (allDone) {
    const p0 = boxes.filter((b) => b === 0).length;
    const p1 = boxes.filter((b) => b === 1).length;
    winner = p0 > p1 ? 0 : p1 > p0 ? 1 : "draw";
  }

  return {
    hLines: s.hLines,
    vLines,
    boxes,
    turn: completedBox ? s.turn : s.turn === 0 ? 1 : 0,
    winner,
  };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);

  // Score count
  const p0Score = s.boxes.filter((b) => b === 0).length;
  const p1Score = s.boxes.filter((b) => b === 1).length;

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6 bg-surface-2/30 select-none">
        <div 
          className="grid gap-0 justify-center items-stretch"
          style={{
            gridTemplateRows: "8px 1fr 8px 1fr 8px 1fr 8px 1fr 8px",
            gridTemplateColumns: "8px 1fr 8px 1fr 8px 1fr 8px 1fr 8px",
            aspectRatio: "1/1",
          }}
        >
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const rEven = r % 2 === 0;
              const cEven = c % 2 === 0;

              // 1. Dot (Even row, Even col)
              if (rEven && cEven) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-2 h-2 rounded-full bg-edge"
                  />
                );
              }

              // 2. Horizontal Line (Even row, Odd col)
              if (rEven && !cEven) {
                const y = r / 2;
                const x = (c - 1) / 2;
                const idx = y * 4 + x;
                const isDrawn = s.hLines[idx];
                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={!canPlay || isDrawn}
                    onClick={() => m.update((cur) => playHorizontal(cur, y, x))}
                    className={cls(
                      "h-2 transition-all relative",
                      isDrawn
                        ? "bg-primary-soft shadow shadow-primary-soft/50"
                        : cls(
                            "bg-edge/20",
                            canPlay && "hover:bg-primary-soft/40 cursor-pointer"
                          )
                    )}
                  />
                );
              }

              // 3. Vertical Line (Odd row, Even col)
              if (!rEven && cEven) {
                const y = (r - 1) / 2;
                const x = c / 2;
                const idx = y * 5 + x;
                const isDrawn = s.vLines[idx];
                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={!canPlay || isDrawn}
                    onClick={() => m.update((cur) => playVertical(cur, y, x))}
                    className={cls(
                      "w-2 transition-all relative",
                      isDrawn
                        ? "bg-primary-soft shadow shadow-primary-soft/50"
                        : cls(
                            "bg-edge/20",
                            canPlay && "hover:bg-primary-soft/40 cursor-pointer"
                          )
                    )}
                  />
                );
              }

              // 4. Box (Odd row, Odd col)
              const y = (r - 1) / 2;
              const x = (c - 1) / 2;
              const boxIdx = y * 4 + x;
              const owner = s.boxes[boxIdx];

              return (
                <div
                  key={`${r}-${c}`}
                  className={cls(
                    "flex items-center justify-center text-xl font-bold transition-all aspect-square m-[2px] rounded-lg",
                    owner === 0
                      ? "bg-primary/20 text-primary-soft animate-pop"
                      : owner === 1
                        ? "bg-secondary/20 text-secondary animate-pop"
                        : "bg-surface-2/10"
                  )}
                >
                  {owner === 0 && "🟣"}
                  {owner === 1 && "🩷"}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 px-2 text-sm text-muted">
        <span>🟣 {m.names[0]}: <b>{p0Score}</b></span>
        <span>Kalan Kutu: <b>{16 - (p0Score + p1Score)}</b></span>
        <span>🩷 {m.names[1]}: <b>{p1Score}</b></span>
      </div>
    </div>
  );
}

export default function DotsAndBoxes() {
  return (
    <MatchShell<S>
      slug="nokta-kutu"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
      getScores={(s) => [
        s.boxes.filter((b) => b === 0).length,
        s.boxes.filter((b) => b === 1).length,
      ]}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
