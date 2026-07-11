"use client";

import React from "react";
import { 
  Hash, Calculator, Bomb, Brain, Type, HelpCircle, 
  Zap, Compass, Grid, MoreHorizontal, Ship, Disc, 
  Crown, Swords, Coins, Gamepad2 
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "sudoku": Hash,
  "2048": Calculator,
  "mayin-tarlasi": Bomb,
  "hafiza-kartlari": Brain,
  "kelime-bulmaca": Type,
  "hangman": HelpCircle,
  "math-sprint": Zap,
  "snake": Compass,
  "tetris": Grid,
  "xox": Grid,
  "dots-and-boxes": MoreHorizontal,
  "battleship": Ship,
  "reversi": Disc,
  "checkers": Crown,
  "word-duel": Swords,
  "memory-duel": Swords,
  "gomoku": Coins,
  "kayan-bulmaca": Grid,
  "kelime-avi": Type,
  "adam-asmaca": HelpCircle,
  "kelimle": Type,
  "simon": Brain,
  "nonogram": Grid,
  "isiklari-kapat": Zap,
  "hanoi": MoreHorizontal,
  "matematik-kosusu": Zap,
  "anagram": Type,
  "sifre-kirici": HelpCircle,
  "yilan": Compass,
  "renk-tuzagi": Brain,
  "sayi-hafizasi": Brain,
  "tek-kal": Disc,
  "refleks-testi": Zap,
  "dortlu-dizi": MoreHorizontal,
  "nokta-kutu": Grid,
  "amiral-batti": Ship,
  "dama": Crown,
  "nim": Disc,
  "bes-tas": Coins
};

export default function GameIcon({ slug, className, style }: { slug: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = ICON_MAP[slug] || Gamepad2;
  return <IconComponent className={className} style={style} />;
}
