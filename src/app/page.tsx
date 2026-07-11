"use client";

import Link from "next/link";
import GameCard from "@/components/GameCard";
import { SINGLE_GAMES, MULTI_GAMES } from "@/games/registry";
import { motion } from "framer-motion";
import { Gamepad2, Trophy, Sparkles, Swords, Laptop, Gift, ArrowRight } from "lucide-react";

export default function HomePage() {
  const featured = [...SINGLE_GAMES.slice(0, 4), ...MULTI_GAMES.slice(0, 4)];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center pt-10 pb-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-edge/30 bg-surface/40 backdrop-blur-md mb-6 text-xs text-muted shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Yeni nesil zeka oyunları portalı</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight"
        >
          <span className="title-gradient">Splend Game</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed"
        >
          30&apos;dan fazla bulmaca ve gerçek zamanlı düello oyunu. Kayıt ol, oyna, skorunu dünyayla yarıştır.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3.5 mt-8"
        >
          <Link href="/oyunlar" className="btn-primary text-base !px-6 !py-3 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Hemen Oyna
          </Link>
          <Link href="/skor-tablosu" className="btn-ghost text-base !px-6 !py-3 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Skor Tablosu
          </Link>
        </motion.div>

        {/* Dynamic platform stats tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mt-10 text-xs"
        >
          <span className="chip bg-surface/30 text-muted flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-primary-soft" /> 20 Tek Kişilik
          </span>
          <span className="chip bg-surface/30 text-muted flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-secondary" /> 10 Çok Oyunculu
          </span>
          <span className="chip bg-surface/30 text-muted flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-accent" /> Tüm Cihazlarda
          </span>
          <span className="chip bg-surface/30 text-muted flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-good" /> Tamamen Ücretsiz
          </span>
        </motion.div>
      </section>

      {/* Featured Games */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-edge/10 pb-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-soft">Öne Çıkanlar</div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-ink">Popüler Oyunlar</h2>
          </div>
          <Link href="/oyunlar" className="text-primary-soft font-bold text-xs hover:text-primary transition-colors flex items-center gap-1 shrink-0">
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      {/* Multiplayer Duel Arena */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-edge/10 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-secondary">
              <Swords className="w-3.5 h-3.5" /> Çok Oyunculu
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-ink">Düello Arenası</h2>
          </div>
          <Link href="/oyunlar?mod=multi" className="text-secondary font-bold text-xs hover:text-secondary/80 transition-colors flex items-center gap-1 shrink-0">
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MULTI_GAMES.slice(0, 8).map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      {/* CTA Registration Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/40 p-8 sm:p-12">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, rgba(124,58,237,0.22) 0%, rgba(219,39,119,0.18) 55%, rgba(217,119,6,0.12) 100%), var(--color-surface)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">Skorun dünyaya duyulsun!</h2>
            <p className="text-muted mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
              Ücretsiz hesabını oluştur; skorların kaydedilsin, sıralamada yüksel, arkadaşlarınla düello yap.
            </p>
          </div>
          <Link href="/profil" className="btn-primary shrink-0 !px-8 !py-4 text-base flex items-center gap-2">
            Ücretsiz Kayıt Ol <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
