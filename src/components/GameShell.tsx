"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GAME_MAP } from "@/games/registry";
import { useAuth } from "@/lib/auth-context";
import { getLocalBest, submitScore } from "@/lib/scores";
import { useMounted } from "@/lib/hooks";
import Modal from "./Modal";

export interface GameResult {
  won: boolean;
  score: number;
  message?: string;
}

export default function GameShell({
  slug,
  stats,
  onRestart,
  result,
  children,
}: {
  slug: string;
  stats?: { label: string; value: string | number }[];
  onRestart?: () => void;
  /** Set when the game ends; set back to null on restart. */
  result?: GameResult | null;
  children: ReactNode;
}) {
  const game = GAME_MAP[slug];
  const { profile } = useAuth();
  const mounted = useMounted();
  const [showHelp, setShowHelp] = useState(false);
  const [saved, setSaved] = useState<"cloud" | "local" | null>(null);
  const [isRecord, setIsRecord] = useState(false);
  const submittedRef = useRef(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    if (mounted) {
      const t = setTimeout(() => setBest(getLocalBest(slug)), 0);
      return () => clearTimeout(t);
    }
  }, [mounted, slug, result]);

  useEffect(() => {
    if (!result) {
      submittedRef.current = false;
      const t = setTimeout(() => {
        setSaved(null);
        setIsRecord(false);
      }, 0);
      return () => clearTimeout(t);
    }
    if (submittedRef.current) return;
    submittedRef.current = true;
    const prevBest = getLocalBest(slug);
    const isNewRecord = result.score > 0 && (prevBest === null || result.score > prevBest);
    const t = setTimeout(() => {
      setIsRecord(isNewRecord);
    }, 0);
    if (result.score > 0) {
      submitScore(profile, slug, result.score).then((saveRes) => {
        setSaved(saveRes);
      });
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, slug]);

  if (!game) return null;

  return (
    <div className="animate-rise">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
        <Link href="/oyunlar" className="btn-ghost !px-3 !py-1.5" aria-label="Oyunlara dön">
          ←
        </Link>
        <span className="text-2xl">{game.icon}</span>
        <h1 className="text-xl sm:text-2xl font-extrabold">{game.name}</h1>
        <div className="flex-1" />
        {mounted && best !== null && (
          <span className="chip bg-surface-2 text-muted text-xs" title="Kişisel rekorun">
            🥇 Rekor: <b className="text-ink">{best.toLocaleString("tr")}</b>
          </span>
        )}
        <button
          onClick={() => setShowHelp(true)}
          className="btn-ghost !px-3 !py-1.5"
          aria-label="Nasıl oynanır?"
        >
          ?
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="btn-ghost !px-3 !py-1.5"
            aria-label="Yeniden başlat"
            title="Yeniden başlat"
          >
            ↻
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="card !rounded-xl px-3 py-1.5 text-sm">
              <span className="text-muted">{s.label}: </span>
              <span className="font-bold tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Board */}
      <div className="game-board">{children}</div>

      {/* How-to modal */}
      <Modal open={showHelp} onClose={() => setShowHelp(false)} title={`${game.icon} Nasıl Oynanır?`}>
        <ul className="space-y-2.5">
          {game.howTo.map((line, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="text-primary-soft font-bold shrink-0">{i + 1}.</span>
              <span className="text-ink/90">{line}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => setShowHelp(false)} className="btn-primary w-full mt-5">
          Anladım, oynayalım!
        </button>
      </Modal>

      {/* End-of-game overlay */}
      <Modal open={Boolean(result)} title={undefined}>
        {result && (
          <div className="text-center">
            <div className="text-6xl mb-3">{result.won ? "🎉" : "😵"}</div>
            <h2 className="text-2xl font-extrabold mb-1">
              {result.won ? "Tebrikler!" : "Oyun Bitti"}
            </h2>
            {result.message && <p className="text-muted mb-2">{result.message}</p>}
            <div className="card !bg-surface-2 p-4 my-4">
              <div className="text-sm text-muted">Skorun</div>
              <div className="text-4xl font-extrabold tabular-nums title-gradient">
                {result.score.toLocaleString("tr")}
              </div>
              {isRecord && (
                <div className="text-accent font-bold text-sm mt-1">🥇 Yeni kişisel rekor!</div>
              )}
            </div>
            {result.score > 0 && (
              <p className="text-xs text-muted mb-4">
                {saved === "cloud" ? (
                  <>✅ Skorun global tabloya kaydedildi.</>
                ) : saved === "local" && profile.isGuest ? (
                  <>
                    💾 Skorun bu cihaza kaydedildi.{" "}
                    <Link href="/profil" className="text-primary-soft underline">
                      Giriş yaparsan
                    </Link>{" "}
                    global tabloda yarışabilirsin!
                  </>
                ) : saved === "local" ? (
                  <>💾 Skorun cihazına kaydedildi.</>
                ) : (
                  <>Kaydediliyor…</>
                )}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              {onRestart && (
                <button onClick={onRestart} className="btn-primary flex-1">
                  🔄 Tekrar Oyna
                </button>
              )}
              <Link href="/oyunlar" className="btn-ghost flex-1">
                Tüm Oyunlar
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
