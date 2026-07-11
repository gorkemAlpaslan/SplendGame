"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { Loader2 } from "lucide-react";

const loading = () => (
  <div className="flex flex-col items-center justify-center py-24 text-muted gap-3">
    <Loader2 className="w-8 h-8 text-primary-soft animate-spin" />
    <p className="text-xs font-semibold tracking-wide">Oyun yükleniyor…</p>
  </div>
);

/* Her oyun yalnızca kendi sayfasında yüklenir (code-splitting). */
const LOADERS: Record<string, ComponentType> = {
  sudoku: dynamic(() => import("@/games/single/Sudoku"), { ssr: false, loading }),
  "2048": dynamic(() => import("@/games/single/G2048"), { ssr: false, loading }),
  "mayin-tarlasi": dynamic(() => import("@/games/single/Minesweeper"), { ssr: false, loading }),
  "hafiza-kartlari": dynamic(() => import("@/games/single/MemoryMatch"), { ssr: false, loading }),
  "kayan-bulmaca": dynamic(() => import("@/games/single/SlidingPuzzle"), { ssr: false, loading }),
  "kelime-avi": dynamic(() => import("@/games/single/WordSearch"), { ssr: false, loading }),
  "adam-asmaca": dynamic(() => import("@/games/single/Hangman"), { ssr: false, loading }),
  kelimle: dynamic(() => import("@/games/single/Wordle"), { ssr: false, loading }),
  simon: dynamic(() => import("@/games/single/Simon"), { ssr: false, loading }),
  nonogram: dynamic(() => import("@/games/single/Nonogram"), { ssr: false, loading }),
  "isiklari-kapat": dynamic(() => import("@/games/single/LightsOut"), { ssr: false, loading }),
  hanoi: dynamic(() => import("@/games/single/Hanoi"), { ssr: false, loading }),
  "matematik-kosusu": dynamic(() => import("@/games/single/MathSprint"), { ssr: false, loading }),
  anagram: dynamic(() => import("@/games/single/Anagram"), { ssr: false, loading }),
  "sifre-kirici": dynamic(() => import("@/games/single/Mastermind"), { ssr: false, loading }),
  yilan: dynamic(() => import("@/games/single/Snake"), { ssr: false, loading }),
  "renk-tuzagi": dynamic(() => import("@/games/single/ColorTrap"), { ssr: false, loading }),
  "sayi-hafizasi": dynamic(() => import("@/games/single/NumberMemory"), { ssr: false, loading }),
  "tek-kal": dynamic(() => import("@/games/single/PegSolitaire"), { ssr: false, loading }),
  "refleks-testi": dynamic(() => import("@/games/single/ReactionTest"), { ssr: false, loading }),
  xox: dynamic(() => import("@/games/multi/TicTacToe"), { ssr: false, loading }),
  "dortlu-dizi": dynamic(() => import("@/games/multi/ConnectFour"), { ssr: false, loading }),
  "nokta-kutu": dynamic(() => import("@/games/multi/DotsAndBoxes"), { ssr: false, loading }),
  "amiral-batti": dynamic(() => import("@/games/multi/Battleship"), { ssr: false, loading }),
  reversi: dynamic(() => import("@/games/multi/Reversi"), { ssr: false, loading }),
  dama: dynamic(() => import("@/games/multi/Checkers"), { ssr: false, loading }),
  "kelime-duellosu": dynamic(() => import("@/games/multi/WordDuel"), { ssr: false, loading }),
  "hafiza-duellosu": dynamic(() => import("@/games/multi/MemoryDuel"), { ssr: false, loading }),
  nim: dynamic(() => import("@/games/multi/Nim"), { ssr: false, loading }),
  "bes-tas": dynamic(() => import("@/games/multi/Gomoku"), { ssr: false, loading }),
};

export default function GameHost({ slug }: { slug: string }) {
  const Game = LOADERS[slug];
  if (!Game) return null;
  return <Game />;
}
