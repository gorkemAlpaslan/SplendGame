"use client";

import { useCallback, useEffect, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { WORDS_5 } from "@/lib/words";
import { cls, pick, trUpper } from "@/lib/utils";

const ROWS = 6;
const LEN = 5;
const KB = [
  [..."ERTYUIOPĞÜ"],
  [..."ASDFGHJKLŞİ"],
  ["ENTER", ..."ZCVBNMÖÇ", "SİL"],
];

type Mark = "hit" | "near" | "miss";

function evaluate(guess: string, target: string): Mark[] {
  const g = [...guess];
  const t = [...target];
  const marks: Mark[] = new Array(LEN).fill("miss");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < LEN; i++) {
    if (g[i] === t[i]) marks[i] = "hit";
    else remaining[t[i]] = (remaining[t[i]] ?? 0) + 1;
  }
  for (let i = 0; i < LEN; i++) {
    if (marks[i] !== "hit" && remaining[g[i]] > 0) {
      marks[i] = "near";
      remaining[g[i]]--;
    }
  }
  return marks;
}

const MARK_CLASS: Record<Mark, string> = {
  hit: "bg-good/80 text-white border-good",
  near: "bg-accent/80 text-black border-accent",
  miss: "bg-surface-2 text-muted border-edge",
};

export default function Wordle() {
  const [target, setTarget] = useState(() => pick(WORDS_5));
  const [rows, setRows] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [result, setResult] = useState<GameResult | null>(null);
  const [shaking, setShaking] = useState(false);

  const restart = useCallback(() => {
    setTarget(pick(WORDS_5));
    setRows([]);
    setCurrent("");
    setResult(null);
  }, []);

  const key = useCallback(
    (k: string) => {
      if (result) return;
      if (k === "ENTER") {
        if (current.length !== LEN) {
          setShaking(true);
          setTimeout(() => setShaking(false), 300);
          return;
        }
        const newRows = [...rows, current];
        setRows(newRows);
        setCurrent("");
        if (current === target) {
          const score = (ROWS + 1 - newRows.length) * 150 + 50;
          setResult({ won: true, score, message: `${newRows.length}. denemede buldun!` });
        } else if (newRows.length >= ROWS) {
          setResult({ won: false, score: 0, message: `Kelime "${target}" idi.` });
        }
        return;
      }
      if (k === "SİL") {
        setCurrent((c) => c.slice(0, -1));
        return;
      }
      if (current.length < LEN) setCurrent((c) => c + k);
    },
    [current, rows, target, result]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") key("ENTER");
      else if (e.key === "Backspace") key("SİL");
      else {
        const ch = trUpper(e.key);
        if (ch.length === 1 && "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".includes(ch)) key(ch);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);

  // klavye tuş renkleri
  const keyMarks: Record<string, Mark> = {};
  for (const row of rows) {
    const marks = evaluate(row, target);
    [...row].forEach((ch, i) => {
      const m = marks[i];
      const prev = keyMarks[ch];
      if (m === "hit" || (m === "near" && prev !== "hit") || (m === "miss" && !prev)) {
        keyMarks[ch] = m;
      }
    });
  }

  return (
    <GameShell
      slug="kelimle"
      onRestart={restart}
      result={result}
      stats={[{ label: "Deneme", value: `${rows.length}/${ROWS}` }]}
    >
      <div className="max-w-sm mx-auto">
        <div className="grid gap-1.5 mb-6">
          {Array.from({ length: ROWS }, (_, r) => {
            const isCurrent = r === rows.length;
            const word = isCurrent ? current : rows[r] ?? "";
            const marks = r < rows.length ? evaluate(rows[r], target) : null;
            return (
              <div
                key={r}
                className={cls("grid grid-cols-5 gap-1.5", isCurrent && shaking && "animate-shake")}
              >
                {Array.from({ length: LEN }, (_, c) => (
                  <div
                    key={c}
                    className={cls(
                      "aspect-square rounded-lg border-2 flex items-center justify-center text-2xl font-extrabold transition-all",
                      marks
                        ? `${MARK_CLASS[marks[c]]} animate-pop`
                        : word[c]
                          ? "border-primary/60 bg-surface"
                          : "border-edge/60 bg-surface"
                    )}
                    style={marks ? { animationDelay: `${c * 60}ms` } : undefined}
                  >
                    {word[c] ?? ""}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5">
          {KB.map((row, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {row.map((k) => (
                <button
                  key={k}
                  onClick={() => key(k)}
                  className={cls(
                    "h-11 rounded-lg font-bold text-sm transition-all active:scale-90 cursor-pointer",
                    k.length > 1 ? "px-2 text-xs bg-primary/30" : "flex-1 max-w-9",
                    k.length === 1 &&
                      (keyMarks[k] === "hit"
                        ? "bg-good/70 text-white"
                        : keyMarks[k] === "near"
                          ? "bg-accent/70 text-black"
                          : keyMarks[k] === "miss"
                            ? "bg-bg text-muted/50"
                            : "bg-surface-2 hover:bg-edge")
                  )}
                >
                  {k === "SİL" ? "⌫" : k === "ENTER" ? "↵" : k}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
