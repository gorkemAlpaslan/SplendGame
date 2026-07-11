"use client";

import { useCallback, useMemo, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useTimer } from "@/lib/hooks";
import { cls, formatTime, pick } from "@/lib/utils";

// 8x8 gizli resimler: '#' dolu, '.' boş
const PATTERNS: { name: string; rows: string[] }[] = [
  {
    name: "Kalp",
    rows: [
      ".##..##.",
      "########",
      "########",
      "########",
      ".######.",
      "..####..",
      "...##...",
      "........",
    ],
  },
  {
    name: "Ev",
    rows: [
      "...##...",
      "..####..",
      ".######.",
      "########",
      ".######.",
      ".##..##.",
      ".##..##.",
      ".######.",
    ],
  },
  {
    name: "Gülücük",
    rows: [
      "..####..",
      ".#....#.",
      "#.#..#.#",
      "#......#",
      "#.#..#.#",
      "#..##..#",
      ".#....#.",
      "..####..",
    ],
  },
  {
    name: "Ok",
    rows: [
      "...#....",
      "..###...",
      ".#####..",
      "#######.",
      "..###...",
      "..###...",
      "..###...",
      "..###...",
    ],
  },
  {
    name: "Kupa",
    rows: [
      ".######.",
      ".######.",
      ".######.",
      "..####..",
      "...##...",
      "...##...",
      "..####..",
      ".######.",
    ],
  },
  {
    name: "Yıldız",
    rows: [
      "...##...",
      "...##...",
      "########",
      ".######.",
      "..####..",
      ".######.",
      ".##..##.",
      "#......#",
    ],
  },
];

const N = 8;
type Mark = 0 | 1 | 2; // 0 boş, 1 dolu, 2 X

function clues(line: boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v) run++;
    else if (run) {
      out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}

export default function Nonogram() {
  const [pattern, setPattern] = useState(() => pick(PATTERNS));
  const [marks, setMarks] = useState<Mark[]>(() => new Array(N * N).fill(0));
  const [tool, setTool] = useState<1 | 2>(1);
  const [result, setResult] = useState<GameResult | null>(null);
  const { seconds, reset: resetTimer } = useTimer(result === null);

  const solution = useMemo(
    () => pattern.rows.flatMap((r) => [...r].map((ch) => ch === "#")),
    [pattern]
  );

  const rowClues = useMemo(
    () =>
      Array.from({ length: N }, (_, r) =>
        clues(solution.slice(r * N, r * N + N))
      ),
    [solution]
  );
  const colClues = useMemo(
    () =>
      Array.from({ length: N }, (_, c) =>
        clues(Array.from({ length: N }, (_, r) => solution[r * N + c]))
      ),
    [solution]
  );

  const newGame = useCallback(() => {
    setPattern(pick(PATTERNS));
    setMarks(new Array(N * N).fill(0));
    setResult(null);
    resetTimer();
  }, [resetTimer]);

  function tap(i: number) {
    if (result) return;
    const next = [...marks];
    next[i] = next[i] === tool ? 0 : tool;
    setMarks(next);
    const done = solution.every((filled, j) => (next[j] === 1) === filled);
    if (done) {
      const score = Math.max(100, 1200 - seconds * 3);
      setResult({ won: true, score, message: `Resim: ${pattern.name}!` });
    }
  }

  const maxRowClue = Math.max(...rowClues.map((c) => c.length));
  const maxColClue = Math.max(...colClues.map((c) => c.length));

  return (
    <GameShell
      slug="nonogram"
      onRestart={newGame}
      result={result}
      stats={[{ label: "Süre", value: formatTime(seconds) }]}
    >
      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={() => setTool(1)}
          className={cls("chip", tool === 1 ? "bg-primary text-white" : "bg-surface-2 text-muted")}
        >
          🟪 Boya
        </button>
        <button
          onClick={() => setTool(2)}
          className={cls("chip", tool === 2 ? "bg-primary text-white" : "bg-surface-2 text-muted")}
        >
          ✖️ İşaretle
        </button>
      </div>

      <div className="w-fit mx-auto card p-3 overflow-x-auto max-w-full">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `${maxRowClue * 14 + 8}px repeat(${N}, minmax(0, 1fr))`,
          }}
        >
          {/* sütun ipuçları satırı */}
          <div style={{ height: maxColClue * 16 + 4 }} />
          {colClues.map((c, i) => (
            <div key={i} className="flex flex-col items-center justify-end text-[11px] font-bold text-muted leading-4 pb-1">
              {c.map((n, j) => (
                <span key={j}>{n}</span>
              ))}
            </div>
          ))}
          {/* satırlar */}
          {Array.from({ length: N }, (_, r) => (
            <RowCells
              key={r}
              r={r}
              rowClue={rowClues[r]}
              marks={marks}
              tap={tap}
            />
          ))}
        </div>
      </div>
      <p className="text-center text-muted text-sm mt-3">
        Sayılar; o satır/sütundaki dolu blokların uzunluklarıdır
      </p>
    </GameShell>
  );
}

function RowCells({
  r,
  rowClue,
  marks,
  tap,
}: {
  r: number;
  rowClue: number[];
  marks: Mark[];
  tap: (i: number) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-end gap-1 pr-1.5 text-[11px] font-bold text-muted">
        {rowClue.map((n, j) => (
          <span key={j}>{n}</span>
        ))}
      </div>
      {Array.from({ length: N }, (_, c) => {
        const i = r * N + c;
        return (
          <button
            key={c}
            onClick={() => tap(i)}
            className={cls(
              "w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center text-sm font-bold transition-colors",
              marks[i] === 1
                ? "bg-primary"
                : "bg-surface-2 hover:bg-edge",
              (c === 3) && "mr-1",
              (r === 3) && "mb-1"
            )}
          >
            {marks[i] === 2 ? <span className="text-muted">✕</span> : ""}
          </button>
        );
      })}
    </>
  );
}
