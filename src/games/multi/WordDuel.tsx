"use client";

import { useState } from "react";
import MatchShell, { type MatchCtx, type Winner } from "@/components/MatchShell";
import { isValidWord } from "@/lib/words";
import { cls, pick, trUpper, shuffle } from "@/lib/utils";

const VOWELS = ["A", "E", "I", "İ", "O", "Ö", "U", "Ü"];
const CONSONANTS = [
  "B", "C", "Ç", "D", "F", "G", "Ğ", "H", "J", "K", "L", "M", "N", "P", "R", "S", "Ş", "T", "V", "Y", "Z"
];

const LETTER_POINTS: Record<string, number> = {
  A: 1, E: 1, İ: 1, K: 1, L: 1, M: 1, N: 1, R: 1, T: 1, Y: 1,
  I: 2, O: 2, S: 2, U: 2,
  B: 3, C: 3, D: 3, G: 3, H: 3, P: 3,
  Ş: 4, V: 4, Z: 4,
  Ç: 5, Ö: 5, Ü: 5,
  Ğ: 6, F: 6,
  J: 10, // Rare letter
};

interface S {
  letters: string[]; // pool of 12 letters
  usedWords: string[];
  scores: [number, number];
  consecutivePasses: number;
  turn: 0 | 1;
  winner: Winner;
}

function getLetterType(l: string): "vowel" | "consonant" {
  return VOWELS.includes(l) ? "vowel" : "consonant";
}

function replenishLetters(currentLetters: string[]): string[] {
  const vowels = currentLetters.filter((l) => getLetterType(l) === "vowel");
  const consonants = currentLetters.filter((l) => getLetterType(l) === "consonant");

  const neededVowels = Math.max(0, 4 - vowels.length);
  const neededConsonants = Math.max(0, 8 - consonants.length);

  const newLetters = [...currentLetters];
  for (let i = 0; i < neededVowels; i++) {
    newLetters.push(pick(VOWELS));
  }
  for (let i = 0; i < neededConsonants; i++) {
    newLetters.push(pick(CONSONANTS));
  }

  // Shuffle replenished pool so letters aren't ordered by type
  return shuffle(newLetters);
}

function init(): S {
  return {
    letters: replenishLetters([]),
    usedWords: [],
    scores: [0, 0],
    consecutivePasses: 0,
    turn: 0,
    winner: null,
  };
}

function calculateScore(word: string): number {
  return word.split("").reduce((sum, char) => sum + (LETTER_POINTS[char] ?? 1), 0);
}

function playWord(s: S, word: string): S {
  if (s.winner !== null) return s;

  const w = trUpper(word.trim());
  if (w.length < 3) return s;
  if (s.usedWords.includes(w)) return s;
  if (!isValidWord(w)) return s;

  // Verify letter composition
  const poolFreq: Record<string, number> = {};
  for (const l of s.letters) poolFreq[l] = (poolFreq[l] || 0) + 1;

  const wordFreq: Record<string, number> = {};
  for (const c of w.split("")) wordFreq[c] = (wordFreq[c] || 0) + 1;

  for (const char in wordFreq) {
    if ((wordFreq[char] || 0) > (poolFreq[char] || 0)) {
      return s; // Invalid letters used
    }
  }

  // Calculate points
  const points = calculateScore(w);
  const nextScores = [...s.scores] as [number, number];
  nextScores[s.turn] += points;

  // Remove used letters from pool
  const remainingLetters = [...s.letters];
  for (const char of w.split("")) {
    const idx = remainingLetters.indexOf(char);
    if (idx !== -1) {
      remainingLetters.splice(idx, 1);
    }
  }

  const nextLetters = replenishLetters(remainingLetters);
  const nextUsed = [...s.usedWords, w];

  return {
    letters: nextLetters,
    usedWords: nextUsed,
    scores: nextScores,
    consecutivePasses: 0,
    turn: s.turn === 0 ? 1 : 0,
    winner: null,
  };
}

function passTurn(s: S): S {
  if (s.winner !== null) return s;

  const nextPasses = s.consecutivePasses + 1;
  const nextOpp = s.turn === 0 ? 1 : 0;

  let winner: Winner = null;
  if (nextPasses >= 2) {
    // End game on back-to-back passes
    const p0 = s.scores[0];
    const p1 = s.scores[1];
    winner = p0 > p1 ? 0 : p1 > p0 ? 1 : "draw";
  }

  return {
    ...s,
    consecutivePasses: nextPasses,
    turn: nextOpp,
    winner,
  };
}

function Board({ m }: { m: MatchCtx<S> }) {
  const s = m.state;
  const canPlay = s.winner === null && m.canAct(s.turn);

  const [inputVal, setInputVal] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Click letter to add to workspace
  const handleLetterClick = (letter: string) => {
    if (!canPlay) return;
    setInputVal((prev) => [...prev, letter]);
  };

  // Backspace
  const handleUndo = () => {
    setInputVal((prev) => prev.slice(0, -1));
    setFeedback(null);
  };

  const handleClear = () => {
    setInputVal([]);
    setFeedback(null);
  };

  // Calculate current unused letters index list
  const getUnusedIndexes = () => {
    const wordArr = [...inputVal];
    const indexes: number[] = [];
    s.letters.forEach((char, idx) => {
      const matchIdx = wordArr.indexOf(char);
      if (matchIdx !== -1) {
        wordArr.splice(matchIdx, 1); // consumed
      } else {
        indexes.push(idx);
      }
    });
    return indexes;
  };

  const unusedIndexes = getUnusedIndexes();

  const handleSubmit = () => {
    const word = inputVal.join("");
    const w = trUpper(word);

    if (w.length < 3) {
      setFeedback("⚠️ Kelime en az 3 harfli olmalı.");
      return;
    }

    if (s.usedWords.includes(w)) {
      setFeedback("⚠️ Bu kelime zaten kullanıldı.");
      return;
    }

    if (!isValidWord(w)) {
      setFeedback("❌ Sözlükte bulunamadı.");
      return;
    }

    // Submit
    m.update((cur) => playWord(cur, word));
    setInputVal([]);
    setFeedback(null);
  };

  const handlePass = () => {
    m.update(passTurn);
    setInputVal([]);
    setFeedback(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Word Workspace */}
      <div className="card p-5 bg-surface-2/20 text-center min-h-[92px] flex flex-col justify-center relative">
        {inputVal.length === 0 ? (
          <span className="text-muted text-sm italic">Aşağıdaki harflerle kelime oluştur…</span>
        ) : (
          <div className="flex flex-wrap justify-center gap-1">
            {inputVal.map((char, i) => (
              <span
                key={i}
                onClick={handleUndo}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-white text-lg font-bold flex items-center justify-center cursor-pointer hover:bg-primary-soft hover:scale-105 active:scale-95 transition-all select-none"
              >
                {char}
              </span>
            ))}
          </div>
        )}
        {inputVal.length > 0 && (
          <div className="absolute right-4 text-xs font-semibold text-primary-soft tabular-nums">
            Score: +{calculateScore(inputVal.join(""))}
          </div>
        )}
      </div>

      {feedback && (
        <p className="text-center text-sm font-semibold text-bad animate-shake">{feedback}</p>
      )}

      {/* Letters Pool */}
      <div className="card p-4 bg-surface-2/40">
        <h4 className="text-center font-bold text-xs text-muted mb-3 uppercase tracking-wider">
          Harf Havuzu
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {s.letters.map((char, i) => {
            const isUsed = !unusedIndexes.includes(i);
            const pts = LETTER_POINTS[char] ?? 1;

            return (
              <button
                key={i}
                disabled={!canPlay || isUsed}
                onClick={() => handleLetterClick(char)}
                className={cls(
                  "h-12 rounded-xl text-lg font-extrabold flex items-center justify-center relative transition-all border",
                  isUsed
                    ? "bg-surface-2/20 border-transparent text-muted/30"
                    : cls(
                        "bg-surface border-edge/60 text-ink shadow-sm shadow-black/20",
                        canPlay && "hover:-translate-y-0.5 hover:border-primary-soft cursor-pointer active:scale-95"
                      )
                )}
              >
                {char}
                <span className="absolute bottom-1 right-1.5 text-[8px] text-muted font-normal tabular-nums">
                  {pts}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          disabled={!canPlay || inputVal.length === 0}
          onClick={handleClear}
          className="btn-ghost flex-1 !py-2.5"
          title="Temizle"
        >
          🗑️ Temizle
        </button>
        <button
          disabled={!canPlay}
          onClick={handlePass}
          className="btn-ghost flex-1 !py-2.5 !border-bad/30 !text-bad hover:!bg-bad/10"
        >
          🏳️ Pas Geç
        </button>
        <button
          disabled={!canPlay || inputVal.length < 3}
          onClick={handleSubmit}
          className="btn-primary flex-1 !py-2.5"
        >
          🚀 Gönder
        </button>
      </div>

      {/* Used words list */}
      {s.usedWords.length > 0 && (
        <div className="card p-4 text-xs">
          <span className="font-bold text-muted block mb-1">Oynanan Kelimeler:</span>
          <div className="flex flex-wrap gap-1.5">
            {s.usedWords.map((w, i) => (
              <span key={i} className="chip bg-surface-2 text-ink/80 cursor-default">
                {w} ({calculateScore(w)}p)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WordDuel() {
  return (
    <MatchShell<S>
      slug="kelime-duellosu"
      createInitial={init}
      getWinner={(s) => s.winner}
      getTurn={(s) => s.turn}
      getScores={(s) => s.scores}
    >
      {(m) => <Board m={m} />}
    </MatchShell>
  );
}
