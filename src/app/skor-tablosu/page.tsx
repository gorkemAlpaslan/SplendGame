"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GAMES, GAME_MAP, SINGLE_GAMES } from "@/games/registry";
import { useAuth } from "@/lib/auth-context";
import {
  fetchTopScores,
  fetchTopUsers,
  getLocalScores,
  type ScoreEntry,
  type UserRank,
} from "@/lib/scores";
import { isFirebaseEnabled } from "@/lib/firebase";
import { useMounted } from "@/lib/hooks";
import { cls } from "@/lib/utils";
import { Trophy, Globe, Gamepad2, User, Play, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import GameIcon from "@/components/GameIcon";

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const mounted = useMounted();
  const [tab, setTab] = useState<"global" | "game" | "local">("global");
  const [gameSlug, setGameSlug] = useState(SINGLE_GAMES[0].slug);
  const [users, setUsers] = useState<UserRank[] | null>(null);
  const [scores, setScores] = useState<ScoreEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isFirebaseEnabled || tab !== "global") return;
    const t = setTimeout(() => setUsers(null), 0);
    fetchTopUsers(20)
      .then(setUsers)
      .catch(() => setError(true));
    return () => clearTimeout(t);
  }, [tab]);

  useEffect(() => {
    if (!isFirebaseEnabled || tab !== "game") return;
    const t = setTimeout(() => setScores(null), 0);
    fetchTopScores(gameSlug, 20)
      .then(setScores)
      .catch(() => setError(true));
    return () => clearTimeout(t);
  }, [tab, gameSlug]);

  const localScores = useMemo(
    () => (mounted ? getLocalScores().sort((a, b) => b.score - a.score).slice(0, 30) : []),
    [mounted]
  );

  // Derive podium lists
  const podiumUsers = useMemo(() => {
    if (!users) return [];
    return users.slice(0, 3);
  }, [users]);

  const podiumScores = useMemo(() => {
    if (!scores) return [];
    return scores.slice(0, 3);
  }, [scores]);

  return (
    <div className="animate-rise max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight text-ink flex items-center gap-2">
          <Trophy className="w-7 h-7 text-accent" /> Skor Tablosu
        </h1>
        <p className="text-muted text-sm">En iyiler burada — sen de oyna, zirvedeki yerini al!</p>
      </div>

      {/* Tabs */}
      <div className="card p-1.5 flex gap-1">
        {(
          [
            ["global", "Global", Globe],
            ["game", "Oyuna Göre", Gamepad2],
            ["local", "Skorlarım", User],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cls(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              tab === key
                ? "bg-primary text-white shadow shadow-primary/20"
                : "text-muted hover:bg-surface-2/40 hover:text-ink"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {!isFirebaseEnabled && tab !== "local" && (
        <div className="card p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="w-12 h-12 text-accent mx-auto mb-3" />
          <h2 className="font-bold text-lg text-ink mb-1">Global Tablo Pasif</h2>
          <p className="text-muted text-xs leading-relaxed max-w-sm mx-auto mb-4">
            Firebase API anahtarları henüz yapılandırılmamış. Şimdilik skorların bu tarayıcıda saklanacak.
          </p>
          <button onClick={() => setTab("local")} className="btn-primary text-xs">
            Skorlarımı Görüntüle
          </button>
        </div>
      )}

      {isFirebaseEnabled && error && tab !== "local" && (
        <div className="card p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-bad mx-auto mb-3 animate-pulse" />
          <h3 className="font-bold text-ink mb-1 text-sm">Hata Oluştu</h3>
          <p className="text-xs text-muted mb-4">Skorlar yüklenirken bir bağlantı sorunu oluştu.</p>
          <button
            onClick={() => {
              setError(false);
              if (tab === "global") fetchTopUsers(20).then(setUsers).catch(() => setError(true));
              else fetchTopScores(gameSlug, 20).then(setScores).catch(() => setError(true));
            }}
            className="btn-ghost text-xs flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yeniden Dene
          </button>
        </div>
      )}

      {/* Global users list */}
      {isFirebaseEnabled && !error && tab === "global" && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {users && users.length > 0 && (
            <div className="grid grid-cols-3 gap-3.5 items-end max-w-md mx-auto pt-6 text-center">
              {/* 2nd place */}
              {podiumUsers[1] && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-400 bg-surface-2 flex items-center justify-center font-extrabold text-sm text-slate-300 shadow">
                    {podiumUsers[1].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 font-bold text-xs truncate max-w-[80px] text-ink">{podiumUsers[1].name}</div>
                  <div className="text-[10px] text-muted">{podiumUsers[1].totalPoints} XP</div>
                  <div className="h-14 w-full bg-slate-400/10 border border-slate-400/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-slate-400 text-xs">2.</div>
                </div>
              )}
              {/* 1st place */}
              {podiumUsers[0] && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-surface-2 flex items-center justify-center font-extrabold text-base text-amber-400 shadow-lg shadow-amber-500/10 relative">
                    <Trophy className="w-4 h-4 text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2" />
                    {podiumUsers[0].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 font-bold text-sm truncate max-w-[100px] text-ink">{podiumUsers[0].name}</div>
                  <div className="text-xs text-amber-400 font-extrabold">{podiumUsers[0].totalPoints} XP</div>
                  <div className="h-20 w-full bg-amber-500/10 border border-amber-500/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-amber-500 text-sm">1.</div>
                </div>
              )}
              {/* 3rd place */}
              {podiumUsers[2] && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-800 bg-surface-2 flex items-center justify-center font-extrabold text-sm text-amber-700 shadow">
                    {podiumUsers[2].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 font-bold text-xs truncate max-w-[80px] text-ink">{podiumUsers[2].name}</div>
                  <div className="text-[10px] text-muted">{podiumUsers[2].totalPoints} XP</div>
                  <div className="h-10 w-full bg-amber-800/10 border border-amber-800/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-amber-800 text-xs">3.</div>
                </div>
              )}
            </div>
          )}

          {/* List remaining */}
          <div className="card divide-y divide-edge/15">
            {users === null ? (
              <LoadingRows />
            ) : users.length === 0 ? (
              <EmptyState text="Henüz global skor kaydı yok." />
            ) : (
              users.map((u, i) => (
                <div key={u.uid} className="flex items-center gap-3 px-4.5 py-3.5 hover:bg-surface-2/10 transition-colors">
                  <span className="w-8 text-center font-bold text-xs">
                    {i === 0 && <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 inline-flex items-center justify-center">1</span>}
                    {i === 1 && <span className="w-5 h-5 rounded-full bg-slate-400/15 border border-slate-400/35 text-slate-300 inline-flex items-center justify-center">2</span>}
                    {i === 2 && <span className="w-5 h-5 rounded-full bg-amber-800/15 border border-amber-800/35 text-amber-700 inline-flex items-center justify-center">3</span>}
                    {i > 2 && <span className="text-muted/65">{i + 1}</span>}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className={cls("font-semibold text-sm truncate", u.uid === profile.uid ? "text-primary-soft" : "text-ink")}>
                      {u.name} {u.uid === profile.uid && <span className="text-[10px] text-muted/60 font-normal ml-0.5">(sen)</span>}
                    </div>
                    <div className="text-[10px] text-muted tracking-wide mt-0.5">
                      {u.gamesPlayed} oyun · {u.wins} galibiyet
                    </div>
                  </div>

                  <div className="font-bold text-sm text-ink tabular-nums">
                    {u.totalPoints.toLocaleString("tr")} <span className="text-muted/60 text-[10px] font-normal">XP</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Per-game list */}
      {isFirebaseEnabled && !error && tab === "game" && (
        <div className="space-y-4 animate-pop">
          <div className="card p-3.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80 block mb-1.5 ml-1">Oyun Seç</label>
            <select
              value={gameSlug}
              onChange={(e) => setGameSlug(e.target.value)}
              className="input !py-2 text-sm !rounded-xl cursor-pointer"
            >
              {GAMES.filter((g) => g.mode === "single").map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Podium for game */}
          {scores && scores.length > 0 && (
            <div className="grid grid-cols-3 gap-3.5 items-end max-w-md mx-auto pt-6 text-center">
              {/* 2nd place */}
              {podiumScores[1] && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-400 bg-surface-2 flex items-center justify-center font-extrabold text-sm text-slate-300 shadow">
                    {podiumScores[1].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 font-bold text-xs truncate max-w-[80px] text-ink">{podiumScores[1].name}</div>
                  <div className="text-[10px] text-muted">{podiumScores[1].score.toLocaleString("tr")}</div>
                  <div className="h-14 w-full bg-slate-400/10 border border-slate-400/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-slate-400 text-xs">2.</div>
                </div>
              )}
              {/* 1st place */}
              {podiumScores[0] && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-surface-2 flex items-center justify-center font-extrabold text-base text-amber-400 shadow-lg shadow-amber-500/10 relative">
                    <Trophy className="w-4 h-4 text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2" />
                    {podiumScores[0].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 font-bold text-sm truncate max-w-[100px] text-ink">{podiumScores[0].name}</div>
                  <div className="text-xs text-amber-400 font-extrabold">{podiumScores[0].score.toLocaleString("tr")}</div>
                  <div className="h-20 w-full bg-amber-500/10 border border-amber-500/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-amber-500 text-sm">1.</div>
                </div>
              )}
              {/* 3rd place */}
              {podiumScores[2] && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-800 bg-surface-2 flex items-center justify-center font-extrabold text-sm text-amber-700 shadow">
                    {podiumScores[2].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 font-bold text-xs truncate max-w-[80px] text-ink">{podiumScores[2].name}</div>
                  <div className="text-[10px] text-muted">{podiumScores[2].score.toLocaleString("tr")}</div>
                  <div className="h-10 w-full bg-amber-800/10 border border-amber-800/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-amber-800 text-xs">3.</div>
                </div>
              )}
            </div>
          )}

          <div className="card divide-y divide-edge/15">
            {scores === null ? (
              <LoadingRows />
            ) : scores.length === 0 ? (
              <EmptyState text="Bu oyunda henüz skor yok — ilk skoru sen gönder!" />
            ) : (
              scores.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4.5 py-3.5 hover:bg-surface-2/10 transition-colors">
                  <span className="w-8 text-center font-bold text-xs">
                    {i === 0 && <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-400 inline-flex items-center justify-center">1</span>}
                    {i === 1 && <span className="w-5 h-5 rounded-full bg-slate-400/15 border border-slate-400/35 text-slate-300 inline-flex items-center justify-center">2</span>}
                    {i === 2 && <span className="w-5 h-5 rounded-full bg-amber-800/15 border border-amber-800/35 text-amber-700 inline-flex items-center justify-center">3</span>}
                    {i > 2 && <span className="text-muted/65">{i + 1}</span>}
                  </span>
                  <div className="flex-1 font-semibold text-sm text-ink truncate">{s.name}</div>
                  <div className="font-extrabold text-sm text-ink tabular-nums">{s.score.toLocaleString("tr")}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Local scores list */}
      {tab === "local" && (
        <div className="card divide-y divide-edge/15 animate-pop">
          {localScores.length === 0 ? (
            <EmptyState
              text="Henüz cihazına kayıtlı skor bulunamadı."
              action={
                <Link href="/oyunlar" className="btn-primary mt-3 text-xs flex items-center gap-1.5 mx-auto">
                  <Play className="w-3.5 h-3.5" /> Hemen Oyna
                </Link>
              }
            />
          ) : (
            localScores.map((s, i) => {
              const g = GAME_MAP[s.gameSlug];
              return (
                <div key={i} className="flex items-center gap-3 px-4.5 py-3.5 hover:bg-surface-2/10 transition-colors">
                  <span className="w-8 h-8 rounded-xl border border-edge/20 flex items-center justify-center bg-surface-2/20">
                    <GameIcon slug={s.gameSlug} className="w-4 h-4 text-primary-soft" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-ink truncate">{g?.name ?? s.gameSlug}</div>
                    <div className="text-[10px] text-muted tracking-wide mt-0.5">
                      {new Date(s.at).toLocaleDateString("tr", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="font-extrabold text-sm text-ink tabular-nums">{s.score.toLocaleString("tr")}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {mounted && profile.isGuest && tab === "local" && localScores.length > 0 && (
        <p className="text-xs text-muted text-center leading-relaxed">
          💡 Bu skorlar sadece bu cihazda saklanıyor.{" "}
          <Link href="/profil" className="text-primary-soft underline font-semibold">
            Giriş yap
          </Link>
          , yeni skorların global tabloda yarışsın!
        </p>
      )}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="p-6 space-y-4.5 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-surface-2" />
          <div className="h-4 bg-surface-2 rounded-md flex-1" />
          <div className="w-12 h-4 bg-surface-2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center text-muted">
      <Trophy className="w-8 h-8 text-muted/30 mx-auto mb-3" />
      <p className="text-xs font-semibold">{text}</p>
      {action}
    </div>
  );
}
