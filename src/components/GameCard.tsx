"use client";

import Link from "next/link";
import type { GameMeta } from "@/games/registry";
import { CATEGORY_LABELS } from "@/games/registry";
import GameIcon from "./GameIcon";
import { Star, ArrowRight } from "lucide-react";
import { cls } from "@/lib/utils";

export default function GameCard({ game }: { game: GameMeta }) {
  return (
    <Link
      href={`/oyunlar/${game.slug}`}
      className="card group p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
      style={{
        boxShadow: `inset 0 1px 0 hsla(${game.hue},80%,70%,0.05)`,
      }}
    >
      {/* Background glow accent */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-2xl pointer-events-none"
        style={{ background: `hsl(${game.hue}, 85%, 60%)` }}
      />

      <div className="flex items-start justify-between">
        <span
          className="text-3xl w-14 h-14 flex items-center justify-center rounded-2xl border border-edge/20 group-hover:border-primary/20 transition-colors"
          style={{ background: `hsla(${game.hue}, 85%, 60%, 0.08)` }}
        >
          <GameIcon slug={game.slug} className="w-6 h-6" style={{ color: `hsl(${game.hue}, 80%, 65%)` }} />
        </span>
        
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
            style={{
              background: `hsla(${game.hue}, 85%, 60%, 0.1)`,
              color: `hsl(${game.hue}, 85%, 72%)`,
              borderColor: `hsla(${game.hue}, 85%, 60%, 0.15)`,
            }}
          >
            {game.mode === "multi" ? "2 Kişilik" : CATEGORY_LABELS[game.category]}
          </span>

          {/* Clean stars */}
          <div className="flex gap-0.5" title={`Zorluk: ${game.difficulty}/3`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={cls(
                  "w-3 h-3 transition-colors",
                  i < game.difficulty
                    ? "fill-accent stroke-accent"
                    : "stroke-muted/30 fill-none"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-base tracking-tight text-ink group-hover:text-primary-soft transition-colors leading-tight">
          {game.name}
        </h3>
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{game.short}</p>
      </div>

      <span className="mt-auto text-xs font-bold text-primary-soft group-hover:text-primary transition-colors inline-flex items-center gap-1">
        Oyna <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
      </span>
    </Link>
  );
}
