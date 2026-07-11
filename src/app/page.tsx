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
          Zekanı zorlayan bulmacalar, arkadaşlarınla kapışabileceğin çok oyunculu düellolar ve global skor tabloları hepsi tek bir adreste.
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
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-soft" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Öne Çıkan Oyunlar</h2>
          </div>
          <Link href="/oyunlar" className="text-primary-soft font-bold text-xs hover:text-primary transition-colors flex items-center gap-1">
            Tümünü gör <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-secondary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Arkadaşınla Düello Yap</h2>
          </div>
          <Link href="/oyunlar?mod=multi" className="text-primary-soft font-bold text-xs hover:text-primary transition-colors flex items-center gap-1">
            Çok Oyunculu Oyunlar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MULTI_GAMES.slice(0, 8).map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      {/* CTA Registration Banner */}
      <section className="card p-8 sm:p-12 text-center relative overflow-hidden border border-edge/30">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-primary via-secondary to-accent pointer-events-none" />
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink relative tracking-tight">Skorun dünyaya duyulsun!</h2>
        <p className="text-muted/80 mt-3 relative max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Kayıt olmadan hemen tarayıcından oynayabilirsin. Ücretsiz üye olarak online maçlara katıl, skorlarını bulutta eşleştir ve sıralamada zirveye oyna!
        </p>
        
        <div className="mt-8 relative">
          <Link href="/profil" className="btn-primary !px-8 !py-3 text-sm flex-inline">
            Ücretsiz Hesap Aç
          </Link>
        </div>
      </section>
    </div>
  );
}
