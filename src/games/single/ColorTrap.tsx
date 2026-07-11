"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { useInterval } from "@/lib/hooks";
import { cls, randInt } from "@/lib/utils";

const COLORS = [
  { name: "KIRMIZI", class: "text-red-400", btn: "bg-red-500" },
  { name: "MAVİ", class: "text-sky-400", btn: "bg-sky-500" },
  { name: "YEŞİL", class: "text-emerald-400", btn: "bg-emerald-500" },
  { name: "SARI", class: "text-amber-300", btn: "bg-amber-400" },
];

interface Q {
  word: number; // yazılan kelime (renk adı)
  ink: number; // yazının gerçek rengi — doğru cevap bu!
}

function makeQ(): Q {
  const word = randInt(0, 3);
  // %60 tuzak: kelime ile renk farklı
  let ink = randInt(0, 3);
  if (Math.random() < 0.35) ink = word;
  return { word, ink };
}

export default function ColorTrap() {
  const [phase, setPhase] = useState<"idle" | "play">("idle");
  const [q, setQ] = useState<Q>(() => makeQ());
  const [time, setTime] = useState(45);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  useInterval(
    () => {
      setTime((t) => {
        if (t <= 1) {
          setPhase("idle");
          setResult((r) =>
            r ?? {
              won: correct > wrong,
              score: Math.max(0, correct * 12 - wrong * 6 + maxCombo * 5),
              message: `${correct} doğru, ${wrong} yanlış`,
            }
          );
          return 0;
        }
        return t - 1;
      });
    },
    phase === "play" && !result ? 1000 : null
  );

  const restart = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setTime(45);
    setCorrect(0);
    setWrong(0);
    setCombo(0);
    setMaxCombo(0);
    setQ(makeQ());
  }, []);

  function start() {
    restart();
    setPhase("play");
  }

  function answer(i: number) {
    if (phase !== "play" || result) return;
    if (i === q.ink) {
      setCorrect((c) => c + 1);
      setCombo((c) => {
        setMaxCombo((m) => Math.max(m, c + 1));
        return c + 1;
      });
      setFlash("good");
    } else {
      setWrong((w) => w + 1);
      setCombo(0);
      setFlash("bad");
    }
    setTimeout(() => setFlash(null), 200);
    setQ(makeQ());
  }

  return (
    <GameShell
      slug="renk-tuzagi"
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
            <div className="text-5xl mb-4">🎨</div>
            <p className="text-muted mb-2">
              Kelimenin <b className="text-ink">anlamına değil</b>,{" "}
              <b className="text-ink">yazı rengine</b> göre butona bas!
            </p>
            <p className="mb-6">
              Örnek: <span className="text-emerald-400 font-extrabold">KIRMIZI</span> →
              doğru cevap <b>YEŞİL</b>
            </p>
            <button onClick={start} className="btn-primary w-full text-lg">
              ▶️ Başla
            </button>
          </div>
        ) : (
          <>
            <div
              className={cls(
                "card p-10 mb-5 transition-colors",
                flash === "good" && "!bg-good/15",
                flash === "bad" && "!bg-bad/15 animate-shake"
              )}
            >
              <div className={cls("text-4xl sm:text-5xl font-extrabold", COLORS[q.ink].class)}>
                {COLORS[q.word].name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  className={cls(
                    "rounded-xl py-4 font-extrabold text-white text-lg active:scale-95 transition-transform cursor-pointer",
                    c.btn
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
