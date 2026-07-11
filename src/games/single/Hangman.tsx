"use client";

import { useCallback, useState } from "react";
import GameShell, { type GameResult } from "@/components/GameShell";
import { HANGMAN_WORDS } from "@/lib/words";
import { cls, pick } from "@/lib/utils";

const KEYS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
const MAX_WRONG = 6;

function HangmanFigure({ wrong }: { wrong: number }) {
  return (
    <svg viewBox="0 0 120 140" className="w-36 h-44 mx-auto" strokeLinecap="round">
      {/* darağacı */}
      <g stroke="var(--color-edge)" strokeWidth="4" fill="none">
        <line x1="10" y1="132" x2="90" y2="132" />
        <line x1="30" y1="132" x2="30" y2="10" />
        <line x1="30" y1="10" x2="80" y2="10" />
        <line x1="80" y1="10" x2="80" y2="24" />
      </g>
      <g stroke="var(--color-primary-soft)" strokeWidth="3.5" fill="none">
        {wrong > 0 && <circle cx="80" cy="34" r="10" />}
        {wrong > 1 && <line x1="80" y1="44" x2="80" y2="82" />}
        {wrong > 2 && <line x1="80" y1="54" x2="62" y2="70" />}
        {wrong > 3 && <line x1="80" y1="54" x2="98" y2="70" />}
        {wrong > 4 && <line x1="80" y1="82" x2="64" y2="106" />}
        {wrong > 5 && <line x1="80" y1="82" x2="96" y2="106" />}
      </g>
      {wrong >= MAX_WRONG && (
        <g stroke="var(--color-bad)" strokeWidth="2">
          <line x1="75" y1="30" x2="79" y2="34" />
          <line x1="79" y1="30" x2="75" y2="34" />
          <line x1="81" y1="30" x2="85" y2="34" />
          <line x1="85" y1="30" x2="81" y2="34" />
        </g>
      )}
    </svg>
  );
}

export default function Hangman() {
  const [word, setWord] = useState(() => pick(HANGMAN_WORDS));
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [roundWon, setRoundWon] = useState(false);

  const letters = [...word];

  const nextWord = useCallback(() => {
    setWord(pick(HANGMAN_WORDS));
    setGuessed(new Set());
    setWrong(0);
    setRoundWon(false);
  }, []);

  const restart = useCallback(() => {
    setStreak(0);
    setTotalScore(0);
    setResult(null);
    nextWord();
  }, [nextWord]);

  function guess(ch: string) {
    if (result || roundWon || guessed.has(ch)) return;
    const next = new Set(guessed);
    next.add(ch);
    setGuessed(next);

    if (!letters.includes(ch)) {
      const w = wrong + 1;
      setWrong(w);
      if (w >= MAX_WRONG) {
        setResult({
          won: streak > 0,
          score: totalScore,
          message: `Kelime "${word}" idi. Seri: ${streak}`,
        });
      }
      return;
    }
    if (letters.every((l) => next.has(l))) {
      const gained = word.length * 20 + (MAX_WRONG - wrong) * 30;
      setTotalScore((s) => s + gained);
      setStreak((s) => s + 1);
      setRoundWon(true);
    }
  }

  return (
    <GameShell
      slug="adam-asmaca"
      onRestart={restart}
      result={result}
      stats={[
        { label: "Seri", value: `${streak} 🔥` },
        { label: "Puan", value: totalScore },
        { label: "Hak", value: `${MAX_WRONG - wrong}` },
      ]}
    >
      <div className="max-w-lg mx-auto text-center">
        <HangmanFigure wrong={wrong} />

        <div className="flex flex-wrap gap-1.5 justify-center my-5">
          {letters.map((ch, i) => (
            <span
              key={i}
              className={cls(
                "w-9 h-11 sm:w-10 sm:h-12 rounded-lg flex items-center justify-center text-xl font-extrabold border-b-4",
                guessed.has(ch)
                  ? "bg-surface-2 border-good text-ink animate-pop"
                  : "bg-surface-2 border-edge text-transparent"
              )}
            >
              {guessed.has(ch) ? ch : "·"}
            </span>
          ))}
        </div>

        {roundWon ? (
          <div className="card p-4 mb-4 animate-pop">
            <p className="font-bold text-good text-lg">🎉 Doğru: {word}</p>
            <button onClick={nextWord} className="btn-primary mt-3 w-full">
              Sıradaki Kelime →
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
            {KEYS.map((k) => {
              const used = guessed.has(k);
              const hit = used && letters.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => guess(k)}
                  disabled={used}
                  className={cls(
                    "w-9 h-10 sm:w-10 sm:h-11 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-90",
                    used
                      ? hit
                        ? "bg-good/30 text-good"
                        : "bg-bad/20 text-bad/60"
                      : "bg-surface-2 hover:bg-edge cursor-pointer"
                  )}
                >
                  {k}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </GameShell>
  );
}
