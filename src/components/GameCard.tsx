"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { GameMeta } from "@/games/registry";
import { CATEGORY_COLORS, CATEGORY_LABELS, DIFFICULTY_META } from "@/games/registry";
import GameIcon from "./GameIcon";
import { Play, Swords } from "lucide-react";

// Append an alpha byte to a 6-digit hex color (e.g. "#a78bfa" + 0.22).
function withAlpha(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export default function GameCard({ game }: { game: GameMeta }) {
  const accent = CATEGORY_COLORS[game.category];
  const diff = DIFFICULTY_META[game.difficulty];
  const isMulti = game.mode === "multi";

  return (
    <Link
      href={`/oyunlar/${game.slug}`}
      className="group card flex flex-col gap-3.5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]"
      style={
        {
          // half-opacity accent used only for the hover border color
          "--accent": withAlpha(accent, 0.5),
        } as CSSProperties
      }
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.22)}, ${withAlpha(accent, 0.08)})`,
            borderColor: withAlpha(accent, 0.4),
          }}
        >
          <GameIcon slug={game.slug} className="h-6 w-6" style={{ color: accent }} />
        </span>
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: accent }}
        >
          {CATEGORY_LABELS[game.category]}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary-soft">
          {game.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{game.short}</p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            background: isMulti ? "rgba(219,39,119,0.14)" : "rgba(124,58,237,0.14)",
            color: isMulti ? "#f472b6" : "#a78bfa",
          }}
        >
          {isMulti ? "Çok Oyunculu" : "Tek Kişilik"}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ background: withAlpha(diff.color, 0.13), color: diff.color }}
        >
          {diff.label}
        </span>
      </div>

      <span
        className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 group-hover:brightness-125"
        style={{
          background: isMulti ? "rgba(219,39,119,0.14)" : "rgba(124,58,237,0.14)",
          borderColor: isMulti ? "rgba(219,39,119,0.3)" : "rgba(124,58,237,0.3)",
          color: isMulti ? "#f472b6" : "#a78bfa",
        }}
      >
        {isMulti ? (
          <>
            Düello Başlat <Swords className="h-4 w-4" />
          </>
        ) : (
          <>
            Oyna <Play className="h-4 w-4" />
          </>
        )}
      </span>
    </Link>
  );
}
