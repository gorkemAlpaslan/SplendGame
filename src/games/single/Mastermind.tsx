"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { cls, randInt } from "@/lib/utils";

const COLORS = [
  { bg: "bg-red-500", name: "kırmızı" },
  { bg: "bg-amber-400", name: "sarı" },
  { bg: "bg-emerald-500", name: "yeşil" },
  { bg: "bg-sky-500", name: "mavi" },
  { bg: "bg-violet-500", name: "mor" },
  { bg: "bg-pink-400", name: "pembe" },
];
const CODE_LEN = 4;
const MAX_GUESS = 10;

interface GuessRow {
  colors: number[];
  black: number; // doğru renk + doğru yer
  white: number; // doğru renk, yanlış yer
}

function makeCode(): number[] {
  return Array.from({ length: CODE_LEN }, () => randInt(0, COLORS.length - 1));
}

function feedback(guess: number[], code: number[]): { black: number; white: number } {
  let black = 0;
  const codeRest: number[] = [];
  const guessRest: number[] = [];
  guess.forEach((g, i) => {
    if (g === code[i]) black++;
    else {
      guessRest.push(g);
      codeRest.push(code[i]);
    }
  });
  let white = 0;
  for (const g of guessRest) {
    const idx = codeRest.indexOf(g);
    if (idx >= 0) {
      white++;
      codeRest.splice(idx, 1);
    }
  }
  return { black, white };
}

export default function Mastermind() {
  const [code, setCode] = useState<number[]>(() => makeCode());
  const [rows, setRows] = useState<GuessRow[]>([]);
  const [current, setCurrent] = useState<number[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);

  const restart = useCallback(() => {
    setCode(makeCode());
    setRows([]);
    setCurrent([]);
    setResult(null);
  }, []);

  function submit() {
    if (current.length !== CODE_LEN || result) return;
    const fb = feedback(current, code);
    const newRows = [...rows, { colors: current, ...fb }];
    setRows(newRows);
    setCurrent([]);
    if (fb.black === CODE_LEN) {
      const score = (MAX_GUESS + 1 - newRows.length) * 120;
      setResult({ won: true, score, message: `${newRows.length} denemede kırdın!` });
    } else if (newRows.length >= MAX_GUESS) {
      setResult({ won: false, score: 0, message: "Deneme hakkın bitti!" });
    }
  }

  return (
    <GameShell
      slug="sifre-kirici"
      onRestart={restart}
      result={result}
      stats={[{ label: "Deneme", value: `${rows.length}/${MAX_GUESS}` }]}
    >
      <div className="max-w-sm mx-auto">
        {/* gizli kod */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: CODE_LEN }, (_, i) => (
            <div
              key={i}
              className={cls(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 border-edge",
                result ? COLORS[code[i]].bg : "bg-surface-2 text-muted"
              )}
            >
              {result ? "" : "?"}
            </div>
          ))}
        </div>

        {/* geçmiş tahminler */}
        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
          {rows.map((row, ri) => (
            <div key={ri} className="card !rounded-xl p-2 flex items-center gap-2">
              <span className="text-xs text-muted w-5">{ri + 1}.</span>
              <div className="flex gap-1.5 flex-1">
                {row.colors.map((c, i) => (
                  <div key={i} className={cls("w-8 h-8 rounded-full", COLORS[c].bg)} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: CODE_LEN }, (_, i) => (
                  <div
                    key={i}
                    className={cls(
                      "w-3 h-3 rounded-full",
                      i < row.black
                        ? "bg-good"
                        : i < row.black + row.white
                          ? "bg-amber-300"
                          : "bg-surface-2"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* mevcut tahmin */}
        {!result && (
          <>
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: CODE_LEN }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(current.filter((_, j) => j !== i))}
                  className={cls(
                    "w-11 h-11 rounded-full border-2 transition-all",
                    current[i] !== undefined
                      ? `${COLORS[current[i]].bg} border-white/30 animate-pop cursor-pointer`
                      : "bg-surface border-dashed border-edge"
                  )}
                />
              ))}
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => current.length < CODE_LEN && setCurrent([...current, i])}
                  className={cls(
                    "w-10 h-10 rounded-full hover:scale-110 active:scale-90 transition-transform cursor-pointer",
                    c.bg
                  )}
                  aria-label={c.name}
                />
              ))}
            </div>
            <button
              onClick={submit}
              disabled={current.length !== CODE_LEN}
              className="btn-primary w-full"
            >
              Tahmin Et
            </button>
            <p className="text-xs text-muted text-center mt-3">
              🟢 doğru yer · 🟡 yanlış yerde doğru renk · Dolu daireye dokununca siler
            </p>
          </>
        )}
      </div>
    </GameShell>
  );
}
