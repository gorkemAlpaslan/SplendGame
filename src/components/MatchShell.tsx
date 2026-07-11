"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { GAME_MAP } from "@/games/registry";
import { db, isFirebaseEnabled } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { recordWin } from "@/lib/scores";
import { cls, roomCode, trUpper } from "@/lib/utils";
import Modal from "./Modal";
import GameIcon from "./GameIcon";
import { ArrowLeft, Key, HelpCircle, LogOut, Smartphone, Globe, ShieldAlert, Clock, AlertTriangle, RefreshCw, Trophy, Swords } from "lucide-react";

export type Winner = 0 | 1 | "draw" | null;

export interface MatchCtx<S> {
  state: S;
  /** Bir hamle uygula (online modda rakibe de senkronize edilir). */
  update: (updater: (s: S) => S) => void;
  /** Bu istemcinin koltuğu (online). Yerel modda her iki koltuk da oynanabilir. */
  seat: 0 | 1;
  isLocal: boolean;
  names: [string, string];
  /** Bu oyuncu adına bu cihazdan hamle yapılabilir mi? */
  canAct: (player: 0 | 1) => boolean;
}

export interface PlayerObj {
  uid: string | null;
  name: string;
  isHost: boolean;
}

export interface RoomDoc {
  slug: string;
  state: string;
  hostName: string;
  guestName: string;
  hostUid: string | null;
  guestUid: string | null;
  participantUids: string[];
  playerObjects: PlayerObj[];
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  status: "waiting" | "playing" | "paused" | "finished" | "abandoned" | "expired";
  winnerUid: string | null;
  gameType: string;
  roomVisibility: "public" | "private";
  roomCode: string;
  moveCount: number;
}

export interface RecentRoom {
  code: string;
  slug: string;
  name: string;
  at: number;
}

export function saveRecentRoom(code: string, slug: string, name: string) {
  if (typeof window === "undefined") return;
  try {
    const list: RecentRoom[] = JSON.parse(localStorage.getItem("splend:recent-rooms") || "[]");
    const filtered = list.filter((r) => r.code !== code);
    filtered.unshift({ code, slug, name, at: Date.now() });
    localStorage.setItem("splend:recent-rooms", JSON.stringify(filtered.slice(0, 10)));
  } catch {}
}

export function getRecentRooms(): RecentRoom[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("splend:recent-rooms") || "[]");
  } catch {
    return [];
  }
}

export default function MatchShell<S>({
  slug,
  createInitial,
  getWinner,
  getTurn,
  getScores,
  children,
}: {
  slug: string;
  createInitial: () => S;
  getWinner: (s: S) => Winner;
  getTurn: (s: S) => 0 | 1;
  getScores?: (s: S) => [number, number] | null;
  children: (m: MatchCtx<S>) => ReactNode;
}) {
  const game = GAME_MAP[slug];
  const { profile } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  type Mode = "menu" | "local" | "host-wait" | "join" | "online";
  const [mode, setMode] = useState<Mode>("menu");
  const [state, setState] = useState<S>(createInitial);
  const [seat, setSeat] = useState<0 | 1>(0);
  const [names, setNames] = useState<[string, string]>(["Oyuncu 1", "Oyuncu 2"]);
  const [code, setCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [oppLeft, setOppLeft] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const winRecorded = useRef(false);

  // Keep track of host and guest UIDs to calculate winnerUid
  const hostUidRef = useRef<string | null>(null);
  const guestUidRef = useRef<string | null>(null);

  const isLocal = mode === "local";
  const playing = mode === "local" || mode === "online";
  const winner = playing ? getWinner(state) : null;
  const turn = getTurn(state);
  const scores = getScores ? getScores(state) : null;

  const cleanup = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // Handle auto-rejoining via url param ?code=CODE
  useEffect(() => {
    const database = db;
    if (typeof window === "undefined" || !database || !profile || !game) return;
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");
    if (!codeParam) return;

    const id = trUpper(codeParam.trim());
    if (id.length !== 4) return;

    const t = setTimeout(() => setError(null), 0);
    getDoc(doc(database, "rooms", id))
      .then((snap) => {
        if (!snap.exists()) {
          setError("Oda bulunamadı.");
          return;
        }
        const data = snap.data() as RoomDoc;
        if (data.slug !== slug) {
          setError(`Bu oda başka bir oyun için kurulmuş (${GAME_MAP[data.slug]?.name ?? data.slug}).`);
          return;
        }

        // Determine seat based on UIDs
        const isHost = data.hostUid === profile.uid || (!data.hostUid && data.hostName === profile.name);
        const isGuest = data.guestUid === profile.uid || (!data.guestUid && data.guestName === profile.name);

        if (isHost) {
          setCode(id);
          setMode("online");
          subscribe(id, 0);
          saveRecentRoom(id, slug, game.name);
        } else if (isGuest || data.status === "waiting") {
          // Join as guest
          const updates: Record<string, unknown> = {
            guestName: profile.name,
            guestUid: profile.uid || null,
            status: "playing",
            updatedAt: Date.now(),
            lastActivityAt: Date.now(),
          };
          if (profile.uid) {
            updates.participantUids = arrayUnion(profile.uid);
            updates.playerObjects = arrayUnion({ uid: profile.uid, name: profile.name, isHost: false });
          }
          updateDoc(doc(database, "rooms", id), updates)
            .then(() => {
              setCode(id);
              setMode("online");
              subscribe(id, 1);
              saveRecentRoom(id, slug, game.name);
            })
            .catch(() => {
              setError("Odaya bağlanılamadı.");
            });
        } else {
          setError("Bu oda dolu veya yetkiniz yok.");
        }
      })
      .catch(() => {
        setError("Oda bilgileri yüklenemedi.");
      });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, profile, slug]);

  // online galibiyet kaydı (yalnızca kazanan istemci kendi galibiyetini yazar)
  useEffect(() => {
    if (mode === "online" && winner === seat && !winRecorded.current) {
      winRecorded.current = true;
      recordWin(profile);
    }
    if (winner === null) winRecorded.current = false;
  }, [winner, mode, seat, profile]);

  function backToMenu() {
    cleanup();
    const database = db;
    if (mode !== "local" && code && database) {
      // In normalized structure, we do not auto-delete active rooms immediately,
      // but let's delete if the room is still waiting. Otherwise, keep it active on dashboard!
      getDoc(doc(database, "rooms", code)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as RoomDoc;
          if (data.status === "waiting") {
            deleteDoc(doc(database, "rooms", code)).catch(() => {});
          }
        }
      }).catch(() => {});
    }
    setMode("menu");
    setCode("");
    setError(null);
    setOppLeft(false);
    setState(createInitial());
  }

  function startLocal() {
    setState(createInitial());
    setNames(["Oyuncu 1", "Oyuncu 2"]);
    setMode("local");
  }

  function subscribe(roomId: string, mySeat: 0 | 1) {
    if (!db) return;
    cleanup();
    unsubRef.current = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (!snap.exists()) {
        setOppLeft(true);
        return;
      }
      const data = snap.data() as RoomDoc;
      hostUidRef.current = data.hostUid;
      guestUidRef.current = data.guestUid;
      setNames([data.hostName || "Oyuncu 1", data.guestName || "Oyuncu 2"]);
      if (data.status === "playing" || data.status === "finished") {
        setMode("online");
        try {
          setState(JSON.parse(data.state));
        } catch {
          /* bozuk durum — yok say */
        }
      }
    });
    setSeat(mySeat);
  }

  async function hostRoom() {
    if (!db || !game) return;
    setError(null);
    const id = roomCode();
    const room: RoomDoc = {
      slug,
      status: "waiting",
      hostName: profile.name,
      guestName: "",
      hostUid: profile.uid || null,
      guestUid: null,
      participantUids: profile.uid ? [profile.uid] : [],
      playerObjects: [
        { uid: profile.uid || null, name: profile.name, isHost: true }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
      winnerUid: null,
      gameType: slug,
      roomVisibility: "private",
      roomCode: id,
      moveCount: 0,
      state: JSON.stringify(createInitial()),
    };
    try {
      await setDoc(doc(db, "rooms", id), room);
      setCode(id);
      setMode("host-wait");
      subscribe(id, 0);
      saveRecentRoom(id, slug, game.name);
    } catch {
      setError("Oda kurulamadı. İnternet bağlantını ve Firebase kurulumunu kontrol et.");
    }
  }

  async function joinRoom() {
    if (!db || !game) return;
    setError(null);
    const id = trUpper(joinInput.trim());
    if (id.length !== 4) {
      setError("Oda kodu 4 karakter olmalı.");
      return;
    }
    try {
      const snap = await getDoc(doc(db, "rooms", id));
      if (!snap.exists()) {
        setError("Böyle bir oda bulunamadı.");
        return;
      }
      const data = snap.data() as RoomDoc;
      if (data.slug !== slug) {
        setError(`Bu oda başka bir oyun için kurulmuş (${GAME_MAP[data.slug]?.name ?? data.slug}).`);
        return;
      }
      if (data.status !== "waiting") {
        setError("Bu oda dolu.");
        return;
      }

      const updates: Record<string, unknown> = {
        guestName: profile.name,
        guestUid: profile.uid || null,
        status: "playing",
        updatedAt: Date.now(),
        lastActivityAt: Date.now(),
      };
      if (profile.uid) {
        updates.participantUids = arrayUnion(profile.uid);
        updates.playerObjects = arrayUnion({ uid: profile.uid, name: profile.name, isHost: false });
      }

      await updateDoc(doc(db, "rooms", id), updates);
      setCode(id);
      subscribe(id, 1);
      saveRecentRoom(id, slug, game.name);
    } catch {
      setError("Odaya katılınamadı. Tekrar dene.");
    }
  }

  const update = useCallback(
    (updater: (s: S) => S) => {
      setState((prev) => {
        const next = updater(prev);
        if (mode === "online" && db && code) {
          const nextWinner = getWinner(next);
          let status: RoomDoc["status"] = "playing";
          let winnerUid: string | null = null;

          if (nextWinner !== null) {
            status = "finished";
            if (nextWinner === 0) {
              winnerUid = hostUidRef.current;
            } else if (nextWinner === 1) {
              winnerUid = guestUidRef.current;
            } else {
              winnerUid = "draw";
            }
          }

          const updates: Record<string, unknown> = {
            state: JSON.stringify(next),
            updatedAt: Date.now(),
            lastActivityAt: Date.now(),
            status,
            winnerUid,
            moveCount: increment(1),
          };

          updateDoc(doc(db, "rooms", code), updates).catch(
            () => {}
          );
        }
        return next;
      });
    },
    [mode, code, getWinner]
  );

  function rematch() {
    update(() => createInitial());
  }

  const ctx: MatchCtx<S> = {
    state,
    update,
    seat,
    isLocal,
    names,
    canAct: (player) => (isLocal ? true : player === seat && !oppLeft),
  };

  if (!game) return null;

  return (
    <div className="animate-rise">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
        <Link href="/oyunlar" className="btn-ghost !px-3 !py-2 hover:bg-surface-2/60" aria-label="Oyunlara dön">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="w-8 h-8 rounded-lg border border-edge/20 flex items-center justify-center bg-surface-2/20">
          <GameIcon slug={slug} className="w-5 h-5 text-primary-soft" />
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">{game.name}</h1>
        <div className="flex-1" />
        {playing && mode === "online" && (
          <span className="chip bg-surface-2/40 text-muted text-xs flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-primary-soft" /> <span>{code}</span>
          </span>
        )}
        <button onClick={() => setShowHelp(true)} className="btn-ghost !px-3 !py-2" aria-label="Nasıl oynanır?">
          <HelpCircle className="w-4 h-4" />
        </button>
        {playing && (
          <button onClick={backToMenu} className="btn-ghost !px-3 !py-2 !border-bad/20 hover:!bg-bad/10 hover:!text-bad" title="Oyundan çık">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menü */}
      {mode === "menu" && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="card p-8 text-center border border-edge/30">
            <div className="w-16 h-16 rounded-2xl border border-edge/20 bg-surface-2/20 flex items-center justify-center mx-auto mb-4">
              <GameIcon slug={slug} className="w-8 h-8 text-primary-soft" />
            </div>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto leading-relaxed">{game.short}</p>
            <button onClick={startLocal} className="btn-primary w-full text-base !py-3 flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5" /> Aynı Cihazda Oyna
            </button>
            <div className="flex items-center gap-3 my-5 text-muted/60 text-xs">
              <div className="flex-1 h-px bg-edge/15" />
              Çevrimiçi
              <div className="flex-1 h-px bg-edge/15" />
            </div>
            {isFirebaseEnabled ? (
              <div className="space-y-3">
                <button onClick={hostRoom} className="btn-ghost w-full flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4 text-primary-soft" /> Oda Kur
                </button>
                <div className="flex gap-2">
                  <input
                    className="input uppercase tracking-widest text-center font-bold text-sm"
                    placeholder="KOD"
                    maxLength={4}
                    value={joinInput}
                    onChange={(e) => setJoinInput(trUpper(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  />
                  <button onClick={joinRoom} className="btn-ghost shrink-0 px-6">
                    Katıl
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted bg-surface-2/40 rounded-xl p-3.5 border border-edge/10 flex items-center gap-2 text-left leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
                <span>Online mod, Firebase API anahtarları yapılandırıldığında aktifleşecek.</span>
              </p>
            )}
            {error && <p className="text-bad text-xs font-semibold mt-4 flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
          </div>
        </div>
      )}

      {/* Oda bekleme */}
      {mode === "host-wait" && (
        <div className="max-w-md mx-auto card p-8 text-center border border-edge/30">
          <Clock className="w-10 h-10 text-primary-soft mx-auto mb-4 animate-spin" />
          <h2 className="font-extrabold text-lg tracking-tight text-ink">Rakip bekleniyor…</h2>
          <p className="text-muted text-xs mt-1.5 mb-5">Bu oda kodunu arkadaşınla paylaş:</p>
          <button
            className="text-4xl font-extrabold tracking-[0.3em] title-gradient cursor-pointer border-b border-dashed border-edge/40 pb-1"
            title="Kopyala"
            onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}
          >
            {code}
          </button>
          <p className="text-[10px] text-muted/70 mt-2.5">(Dokununca kopyalanır)</p>
          <button onClick={backToMenu} className="btn-ghost w-full mt-6 text-xs">
            Vazgeç
          </button>
        </div>
      )}

      {/* Oyun */}
      {playing && (
        <>
          {/* Sıra göstergesi */}
          <div className="flex items-center justify-center gap-3.5 mb-5 flex-wrap">
            {([0, 1] as const).map((p) => (
              <div
                key={p}
                className={cls(
                  "chip transition-all duration-300 flex items-center gap-2",
                  turn === p && winner === null
                    ? p === 0
                      ? "bg-primary text-white scale-105 shadow-md shadow-primary/25 border-primary-soft/20"
                      : "bg-secondary text-white scale-105 shadow-md shadow-secondary/25 border-secondary/20"
                    : "bg-surface-2/40 text-muted"
                )}
              >
                <span className={cls("w-2 h-2 rounded-full", p === 0 ? "bg-purple-300" : "bg-pink-300")} />
                <span className="max-w-28 truncate font-bold text-xs">
                  {names[p]}
                  {!isLocal && seat === p && " (sen)"}
                </span>
                {scores && <b className="tabular-nums font-extrabold ml-1">{scores[p]}</b>}
              </div>
            ))}
          </div>
          {!isLocal && winner === null && (
            <p className="text-center text-xs mb-4 font-bold text-muted/80 flex items-center justify-center gap-1.5">
              {oppLeft ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-bad" />
                  <span>Rakip odadan ayrıldı.</span>
                </>
              ) : turn === seat ? (
                <span>Sıra sende!</span>
              ) : (
                <span>Rakibin oynuyor…</span>
              )}
            </p>
          )}

          <div className="game-board">{children(ctx)}</div>
        </>
      )}

      {/* Nasıl oynanır */}
      <Modal open={showHelp} onClose={() => setShowHelp(false)} title={`${game.name} Nasıl Oynanır?`}>
        <ul className="space-y-3">
          {game.howTo.map((line, i) => (
            <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
              <span className="text-primary-soft font-black shrink-0">{i + 1}.</span>
              <span className="text-ink/85">{line}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => setShowHelp(false)} className="btn-primary w-full mt-6 text-xs">
          Anladım!
        </button>
      </Modal>

      {/* Kazanan */}
      <Modal open={playing && winner !== null}>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl border border-edge/20 bg-surface-2/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
            {winner === "draw" ? (
              <Swords className="w-8 h-8 text-muted" />
            ) : (
              <Trophy className="w-8 h-8 text-accent animate-pulse" />
            )}
          </div>
          <h2 className="text-xl font-black text-ink mb-2">
            {winner === "draw"
              ? "Berabere!"
              : winner !== null
                ? `${names[winner]} Kazandı!`
                : ""}
          </h2>
          {!isLocal && winner !== null && winner !== "draw" && (
            <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
              {winner === seat
                ? profile.isGuest
                  ? "Bulut hesabıyla giriş yapsaydın bu galibiyet global sıralamaya kaydedilirdi."
                  : "+50 puan ve galibiyet sıralamana işlendi!"
                : "Güzel mücadeleydi, tebrikler!"}
            </p>
          )}
          <div className="flex gap-2 justify-center mt-6">
            <button onClick={rematch} className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Rövanş
            </button>
            <button onClick={backToMenu} className="btn-ghost flex-1 text-xs py-2">
              Ana Menü
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
