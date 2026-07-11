"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useInterval } from "@/lib/hooks";
import { cls, randInt, shuffle } from "@/lib/utils";

interface Question {
  text: string;
  answer: number;
  options: number[];
}

function makeQuestion(level: number): Question {
  const hard = Math.min(level, 10);
  const op = randInt(0, 3);
  let a: number, b: number, answer: number, text: string;
  switch (op) {
    case 0:
      a = randInt(5, 20 + hard * 8);
      b = randInt(5, 20 + hard * 8);
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    case 1:
      a = randInt(10, 30 + hard * 8);
      b = randInt(1, a - 1);
      answer = a - b;
      text = `${a} − ${b}`;
      break;
    case 2:
      a = randInt(2, 6 + hard);
      b = randInt(2, 9);
      answer = a * b;
      text = `${a} × ${b}`;
      break;
    default:
      b = randInt(2, 9);
      answer = randInt(2, 8 + hard);
      a = b * answer;
      text = `${a} ÷ ${b}`;
  }
  const opts = new Set([answer]);
  while (opts.size < 4) {
    const delta = randInt(1, Math.max(3, Math.floor(answer * 0.3)));
    opts.add(Math.max(0, answer + (Math.random() < 0.5 ? -delta : delta)));
  }
  return { text, answer, options: shuffle([...opts]) };
}

export default function MathSprint() {
  const [phase, setPhase] = useState<"idle" | "play">("idle");
  const [q, setQ] = useState<Question>(() => makeQuestion(0));
  const [time, setTime] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  useInterval(
    () => {
      setTime((t) => {
        if (t <= 1) {
          finish();
          return 0;
        }
        return t - 1;
      });
    },
    phase === "play" && !result ? 1000 : null
  );

  const finish = useCallback(() => {
    setPhase("idle");
    setResult((r) => {
      if (r) return r;
      return {
        won: true,
        score: correct * 10 + maxCombo * 5,
        message: `${correct} doğru, en iyi seri ${maxCombo}!`,
      };
    });
  }, [correct, maxCombo]);

  const restart = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setTime(60);
    setCorrect(0);
    setCombo(0);
    setMaxCombo(0);
    setQ(makeQuestion(0));
  }, []);

  function start() {
    restart();
    setPhase("play");
  }

  function answer(v: number) {
    if (phase !== "play" || result) return;
    if (v === q.answer) {
      const c = correct + 1;
      const cb = combo + 1;
      setCorrect(c);
      setCombo(cb);
      setMaxCombo((m) => Math.max(m, cb));
      setTime((t) => Math.min(60, t + 2));
      setFlash("good");
    } else {
      setCombo(0);
      setTime((t) => Math.max(1, t - 4));
      setFlash("bad");
    }
    setTimeout(() => setFlash(null), 250);
    setQ(makeQuestion(correct));
  }

  return (
    <GameShell
      slug="matematik-kosusu"
      onRestart={restart}
      result={result}
      stats={[
        { label: "Süre", value: `${time}s` },
        { label: "Doğru", value: correct },
        { label: "Seri", value: `${combo} 🔥` },
      ]}
    >
      <div className="max-w-sm mx-auto text-center">
        {phase === "idle" ? (
          <div className="card p-8">
            <div className="text-5xl mb-4">➕➖✖️➗</div>
            <p className="text-muted mb-6">
              60 saniyede olabildiğince çok işlem çöz. Doğru +2s, yanlış −4s!
            </p>
            <button onClick={start} className="btn-primary w-full text-lg">
              ▶️ Başla
            </button>
          </div>
        ) : (
          <>
            <div className="h-2 rounded-full bg-surface-2 mb-6 overflow-hidden">
              <div
                className={cls(
                  "h-full transition-all duration-1000",
                  time > 20 ? "bg-good" : time > 10 ? "bg-accent" : "bg-bad"
                )}
                style={{ width: `${(time / 60) * 100}%` }}
              />
            </div>
            <div
              className={cls(
                "card p-8 mb-4 transition-colors",
                flash === "good" && "!bg-good/20",
                flash === "bad" && "!bg-bad/20 animate-shake"
              )}
            >
              <div className="text-4xl sm:text-5xl font-extrabold tabular-nums">{q.text} = ?</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => answer(o)}
                  className="btn-ghost !py-4 text-2xl font-extrabold tabular-nums"
                >
                  {o}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
