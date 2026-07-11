"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import GameCard from "@/components/GameCard";
import {
  CATEGORY_LABELS,
  GAMES,
  type GameCategory,
  type GameMode,
} from "@/games/registry";
import { cls } from "@/lib/utils";
import { Gamepad2, User, Swords, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function GamesBrowser() {
  const params = useSearchParams();
  const [mode, setMode] = useState<GameMode | "all">(
    params.get("mod") === "multi" ? "multi" : "all"
  );
  const [cat, setCat] = useState<GameCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      GAMES.filter(
        (g) =>
          (mode === "all" || g.mode === mode) &&
          (cat === "all" || g.category === cat) &&
          (search === "" ||
            g.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")))
      ),
    [mode, cat, search]
  );

  const MODES = [
    { key: "all" as const, label: "Tümü", icon: Gamepad2 },
    { key: "single" as const, label: "Tek Kişilik", icon: User },
    { key: "multi" as const, label: "Çok Oyunculu", icon: Swords },
  ];

  return (
    <div className="animate-rise space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight text-ink">Oyunlar</h1>
        <p className="text-muted text-sm">
          {GAMES.length} zeka bulmacası seni bekliyor — hemen oyna ve zihnini zorla!
        </p>
      </div>

      {/* Mode selectors and search input */}
      <div className="card p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cls(
                  "chip flex items-center gap-1.5 transition-all duration-200",
                  isSelected
                    ? "bg-primary text-white border-primary-soft/10 shadow shadow-primary/20"
                    : "bg-surface-2/40 text-muted hover:text-ink hover:bg-surface-2/65"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Styled search bar with inline icon */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Oyun ara…"
            className="input !pl-10 !py-2 text-sm !rounded-xl"
          />
        </div>
      </div>

      {/* Category selection */}
      <div className="flex flex-wrap gap-1.5 py-1 border-b border-edge/10">
        <button
          onClick={() => setCat("all")}
          className={cls(
            "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 cursor-pointer",
            cat === "all"
              ? "bg-secondary/10 border-secondary/25 text-secondary"
              : "border-transparent text-muted hover:text-ink hover:bg-surface-2/30"
          )}
        >
          Hepsi
        </button>
        {(Object.keys(CATEGORY_LABELS) as GameCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cls(
              "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 cursor-pointer",
              cat === c
                ? "bg-secondary/10 border-secondary/25 text-secondary"
                : "border-transparent text-muted hover:text-ink hover:bg-surface-2/30"
            )}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-muted max-w-md mx-auto">
          <Search className="w-10 h-10 text-muted/30 mx-auto mb-3" />
          <h3 className="font-bold text-ink mb-1 text-sm">Oyun Bulunamadı</h3>
          <p className="text-xs">Aradığın kriterlere uygun oyun bulunamadı. Filtreleri temizlemeyi veya aramayı değiştirmeyi dene.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((g) => (
            <motion.div
              key={g.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GameCard game={g} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
