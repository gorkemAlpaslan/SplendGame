"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { ANAGRAM_WORDS } from "@/lib/words";
import { useInterval } from "@/lib/hooks";
import { cls, pick, shuffle } from "@/lib/utils";

interface Round {
  word: string;
  letters: { ch: string; used: boolean }[];
}

function newRound(): Round {
  const word = pick(ANAGRAM_WORDS);
  let scrambled = shuffle([...word]);
  let guard = 0;
  while (scrambled.join("") === word && guard++ < 10) scrambled = shuffle([...word]);
  return { word, letters: scrambled.map((ch) => ({ ch, used: false })) };
}

export default function Anagram() {
  const [phase, setPhase] = useState<"idle" | "play">("idle");
  const [round, setRound] = useState<Round>(() => newRound());
  const [picked, setPicked] = useState<number[]>([]);
  const [time, setTime] = useState(90);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  useInterval(
    () => {
      setTime((t) => {
        if (t <= 1) {
          setPhase("idle");
          setResult((r) =>
            r ?? {
              won: solved > 0,
              score,
              message: `${solved} kelime çözdün!`,
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
    setTime(90);
    setScore(0);
    setSolved(0);
    setPicked([]);
    setRound(newRound());
  }, []);

  function start() {
    restart();
    setPhase("play");
  }

  function nextWord() {
    setRound(newRound());
    setPicked([]);
  }

  function pickLetter(i: number) {
    if (round.letters[i].used || result) return;
    const nextPicked = [...picked, i];
    const letters = round.letters.map((l, j) => (j === i ? { ...l, used: true } : l));
    setRound({ ...round, letters });
    setPicked(nextPicked);

    if (nextPicked.length === round.word.length) {
      const guess = nextPicked.map((j) => round.letters[j].ch).join("");
      if (guess === round.word) {
        setScore((s) => s + round.word.length * 15);
        setSolved((s) => s + 1);
        setTime((t) => Math.min(90, t + 5));
        setFlash("good");
        setTimeout(() => {
          setFlash(null);
          nextWord();
        }, 400);
      } else {
        setFlash("bad");
        setTimeout(() => {
          setFlash(null);
          // harfleri geri aç
          setRound((r) => ({ ...r, letters: r.letters.map((l) => ({ ...l, used: false })) }));
          setPicked([]);
        }, 450);
      }
    }
  }

  function backspace() {
    if (!picked.length) return;
    const last = picked[picked.length - 1];
    setRound((r) => ({
      ...r,
      letters: r.letters.map((l, j) => (j === last ? { ...l, used: false } : l)),
    }));
    setPicked(picked.slice(0, -1));
  }

  function skip() {
    setScore((s) => Math.max(0, s - 5));
    nextWord();
  }

  return (
    <GameShell
      slug="anagram"
      onRestart={restart}
      result={result}
      stats={[
        { label: "Süre", value: `${time}s` },
        { label: "Puan", value: score },
        { label: "Çözülen", value: solved },
      ]}
    >
      <div className="max-w-sm mx-auto text-center">
        {phase === "idle" ? (
          <div className="card p-8">
            <div className="text-5xl mb-4">🔤</div>
            <p className="text-muted mb-6">
              Karışık harflerden kelimeyi bul. Her kelime +5 saniye kazandırır!
            </p>
            <button onClick={start} className="btn-primary w-full text-lg">
              ▶️ Başla
            </button>
          </div>
        ) : (
          <>
            {/* cevap kutuları */}
            <div
              className={cls(
                "flex gap-1.5 justify-center mb-6 min-h-12",
                flash === "bad" && "animate-shake"
              )}
            >
              {[...round.word].map((_, i) => {
                const li = picked[i];
                return (
                  <div
                    key={i}
                    className={cls(
                      "w-10 h-12 sm:w-11 sm:h-13 rounded-lg flex items-center justify-center text-xl font-extrabold border-2",
                      flash === "good"
                        ? "bg-good/30 border-good"
                        : li !== undefined
                          ? "bg-surface-2 border-primary/60 animate-pop"
                          : "bg-surface border-edge/60"
                    )}
                  >
                    {li !== undefined ? round.letters[li].ch : ""}
                  </div>
                );
              })}
            </div>

            {/* harf havuzu */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {round.letters.map((l, i) => (
                <button
                  key={i}
                  onClick={() => pickLetter(i)}
                  disabled={l.used}
                  className={cls(
                    "w-11 h-12 rounded-xl text-xl font-extrabold transition-all active:scale-90",
                    l.used
                      ? "bg-bg text-transparent"
                      : "bg-gradient-to-br from-primary/60 to-secondary/60 hover:scale-105 cursor-pointer"
                  )}
                >
                  {l.ch}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-center">
              <button onClick={backspace} className="btn-ghost flex-1">
                ⌫ Geri
              </button>
              <button onClick={skip} className="btn-ghost flex-1">
                ⏭️ Pas (−5)
              </button>
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
