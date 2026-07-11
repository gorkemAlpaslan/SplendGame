"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchUserRank, getLocalTotals, type UserRank } from "@/lib/scores";
import { useMounted } from "@/lib/hooks";
import { db } from "@/lib/firebase";
import { cls } from "@/lib/utils";
import { getRecentRooms, type PlayerObj, type RoomDoc } from "@/components/MatchShell";
import { GAME_MAP } from "@/games/registry";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import Modal from "@/components/Modal";
import {
  User,
  Gamepad2,
  History,
  Trophy,
  Save,
  Clock,
  Swords,
  Pause,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Award,
  Search,
  Plus,
  Trash2,
  LogOut,
  Info,
  Share2,
  Lock,
  Mail,
  ShieldAlert,
  Play,
  Copy,
  Check,
} from "lucide-react";
import GameIcon from "@/components/GameIcon";

const TAB_ICONS = {
  profile: User,
  active: Gamepad2,
  history: History,
  achievements: Trophy,
  recent: Save,
};

const STATUS_DETAILS = {
  waiting: { label: "Oyuncu Bekliyor", color: "bg-amber-500/10 text-amber-400 border-amber-500/15", icon: Clock },
  playing: { label: "Devam Ediyor", color: "bg-good/10 text-good border-good/15", icon: Swords },
  paused: { label: "Duraklatıldı", color: "bg-blue-500/10 text-blue-400 border-blue-500/15", icon: Pause },
  finished: { label: "Bitti", color: "bg-zinc-500/15 text-muted border-zinc-500/15", icon: CheckCircle },
  abandoned: { label: "Yarıda Kaldı", color: "bg-bad/10 text-bad border-bad/15", icon: AlertTriangle },
  expired: { label: "Süresi Doldu", color: "bg-bad/10 text-bad border-bad/15", icon: Clock },
};

export default function ProfilePage() {
  const {
    user,
    profile,
    loading,
    firebaseReady,
    signInGoogle,
    signInEmail,
    registerEmail,
    signOut,
    setGuestName,
  } = useAuth();
  const mounted = useMounted();
  const [activeTab, setActiveTab] = useState<"profile" | "active" | "history" | "achievements" | "recent">("profile");

  // Auth states
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rank, setRank] = useState<UserRank | null>(null);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [editName, setEditName] = useState(false);

  // Firestore Rooms states
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated");
  const [selectedRoom, setSelectedRoom] = useState<RoomDoc | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Local storage backup
  const recentRooms = useMemo(() => (mounted ? getRecentRooms() : []), [mounted]);

  // Load User details
  useEffect(() => {
    if (user) {
      fetchUserRank(user.uid).then(setRank);
    } else {
      const t = setTimeout(() => setRank(null), 0);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Sync guest name inputs
  useEffect(() => {
    if (mounted) {
      const t = setTimeout(() => setGuestNameInput(profile.name), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, profile.isGuest]);

  // Realtime subscription to rooms where user is participant
  useEffect(() => {
    if (!db || !profile.uid || !mounted) return;

    const q = query(
      collection(db, "rooms"),
      where("participantUids", "array-contains", profile.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as RoomDoc);
        setRooms(list);
      },
      (err) => {
        console.error("Multiplayer rooms error:", err);
      }
    );

    return () => unsub();
  }, [profile.uid, mounted]);

  if (!mounted || loading) {
    return <div className="text-center text-muted py-20 animate-pulse">Yükleniyor…</div>;
  }

  const localTotals = getLocalTotals();

  // Auth execution helper
  async function handleAuth(action: () => Promise<void>) {
    setAuthError(null);
    setBusy(true);
    try {
      await action();
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : String(e);
      setAuthError(humanizeAuthError(code));
    } finally {
      setBusy(false);
    }
  }

  // Card Action Helpers
  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  const shareRoom = (room: RoomDoc) => {
    const link = `${window.location.origin}/oyunlar/${room.slug}?code=${room.roomCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setShareSuccess(room.roomCode);
      setTimeout(() => setShareSuccess(null), 2000);
    }).catch(() => {});
  };

  const deleteRoom = async (roomCode: string) => {
    const database = db;
    if (!database) return;
    if (confirm("Odayı silmek istediğine emin misin? Bu işlem geri alınamaz.")) {
      try {
        await deleteDoc(doc(database, "rooms", roomCode));
      } catch {
        alert("Oda silinirken bir hata oluştu.");
      }
    }
  };

  const leaveRoom = async (room: RoomDoc) => {
    const database = db;
    if (!database || !profile.uid) return;
    if (confirm("Odadan ayrılmak istediğine emin misin?")) {
      try {
        const nextParticipants = room.participantUids.filter((uid: string) => uid !== profile.uid);
        const nextPlayers = room.playerObjects.filter((p: PlayerObj) => p.uid !== profile.uid);

        await updateDoc(doc(database, "rooms", room.roomCode), {
          guestName: "",
          guestUid: null,
          status: "waiting",
          participantUids: nextParticipants,
          playerObjects: nextPlayers,
          updatedAt: Date.now(),
          lastActivityAt: Date.now(),
        });
      } catch {
        alert("Odadan ayrılınamadı.");
      }
    }
  };

  // Filter & Sort math
  const processedRooms = rooms.filter((r) => {
    const gameName = GAME_MAP[r.slug]?.name || r.slug;
    const matchSearch =
      r.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gameName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    // Filters
    const isHost = r.hostUid === profile.uid;
    if (filterStatus === "all") return true;
    if (filterStatus === "waiting") return r.status === "waiting";
    if (filterStatus === "playing") return r.status === "playing";
    if (filterStatus === "finished") return r.status === "finished";
    if (filterStatus === "hosted") return isHost;
    if (filterStatus === "joined") return !isHost;

    return true;
  });

  const sortedRooms = [...processedRooms].sort((a, b) => {
    if (sortBy === "newest") return b.createdAt - a.createdAt;
    if (sortBy === "oldest") return a.createdAt - b.createdAt;
    if (sortBy === "alphabetical") {
      const nameA = GAME_MAP[a.slug]?.name || a.slug;
      const nameB = GAME_MAP[b.slug]?.name || b.slug;
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return b.updatedAt - a.updatedAt;
  });

  const activeRoomsCount = sortedRooms.filter((r) => r.status !== "finished").length;
  const finishedRoomsCount = sortedRooms.filter((r) => r.status === "finished").length;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 animate-rise">
      {/* 1. Sidebar Panel */}
      <div className="lg:col-span-1 space-y-4">
        {/* User Card */}
        <div className="card p-5 text-center relative overflow-hidden bg-gradient-to-b from-surface to-surface-2/20">
          <div className="absolute top-3 right-3 text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary-soft border border-primary/20 shadow-sm">
            {profile.isGuest ? "Misafir" : "Üye"}
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center text-xl font-black text-white shadow-md shadow-primary/10">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          {!editName ? (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-bold tracking-tight text-ink truncate max-w-40">{profile.name}</h2>
              <button
                onClick={() => setEditName(true)}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
                title="İsmi Düzenle"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-1 justify-center">
              <input
                className="input !py-1 text-center font-bold text-xs max-w-36 !rounded-lg"
                value={guestNameInput}
                maxLength={20}
                onChange={(e) => setGuestNameInput(e.target.value)}
              />
              <button
                className="btn-primary !px-2.5 !py-1 text-xs !rounded-lg"
                onClick={() => {
                  setGuestName(guestNameInput);
                  setEditName(false);
                }}
              >
                Koru
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted tracking-wide mt-1 truncate">{user ? user.email : "Cihaz Kayıt Modu"}</p>

          <div className="grid grid-cols-2 gap-2 mt-5 text-[11px]">
            <div className="bg-surface/30 p-2.5 rounded-xl border border-edge/20">
              <div className="font-extrabold text-ink">{user ? rank?.totalPoints ?? 0 : localTotals.totalPoints}</div>
              <div className="text-muted mt-0.5">Toplam Puan</div>
            </div>
            <div className="bg-surface/30 p-2.5 rounded-xl border border-edge/20">
              <div className="font-extrabold text-ink">{user ? rank?.gamesPlayed ?? 0 : localTotals.gamesPlayed}</div>
              <div className="text-muted mt-0.5">Oyun Sayısı</div>
            </div>
          </div>

          {user && (
            <button
              onClick={() => handleAuth(signOut)}
              className="btn-danger w-full mt-4 !py-2 text-xs flex items-center justify-center gap-1.5"
              disabled={busy}
            >
              <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="card p-1.5 flex flex-col gap-1">
          {(["profile", "active", "history", "achievements", "recent"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const TabIcon = TAB_ICONS[tab];
            let badgeCount: number | null = null;
            if (tab === "active") badgeCount = activeRoomsCount;
            if (tab === "history") badgeCount = finishedRoomsCount;
            if (tab === "recent") badgeCount = recentRooms.length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cls(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow shadow-primary/20"
                    : "text-muted hover:bg-surface-2/40 hover:text-ink"
                )}
              >
                <TabIcon className="w-4 h-4" />
                <span>
                  {tab === "profile" && "Hesap & İstatistik"}
                  {tab === "active" && "Aktif Odalar"}
                  {tab === "history" && "Geçmiş Oyunlar"}
                  {tab === "achievements" && "Başarımlar"}
                  {tab === "recent" && "Geçmiş Odalar"}
                </span>
                {badgeCount !== null && badgeCount > 0 && (
                  <span className={cls(
                    "ml-auto text-[9px] font-black rounded-full px-1.5 py-0.5 tabular-nums border",
                    isActive ? "bg-white/15 border-white/5 text-white" : "bg-surface-2/80 border-edge/20 text-muted"
                  )}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content Dashboard Panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* Tab 1: Profile & Stats */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Guest join cloud promo if guest */}
            {!user && (
              <div className="card p-6 bg-gradient-to-br from-primary/5 via-secondary/0 to-transparent border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />
                <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent animate-pulse" /> Bulut Hesabına Yükselt!
                </h2>
                <p className="text-xs text-muted/90 mt-1 max-w-lg leading-relaxed">
                  Şu an misafir modundasın. Ücretsiz bir bulut hesabı açarak online multiplayer odalarına bağlanabilir, başarılar elde edebilir ve skorlarını global skor tablosunda paylaşabilirsin!
                </p>

                {!firebaseReady ? (
                  <div className="bg-surface-2/30 border border-edge/10 rounded-xl p-3 text-xs text-muted/65 mt-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
                    <span>Giriş sistemi, Firebase API anahtarları yapılandırıldığında aktifleşir.</span>
                  </div>
                ) : (
                  <div className="mt-5 border-t border-edge/15 pt-5">
                    <div className="flex gap-1.5 mb-4 max-w-xs">
                      <button
                        onClick={() => setAuthTab("login")}
                        className={cls("flex-1 text-xs py-1.5 cursor-pointer font-bold rounded-lg border transition-all", authTab === "login" ? "bg-primary text-white border-primary/20" : "bg-transparent text-muted hover:text-ink border-transparent")}
                      >
                        Giriş Yap
                      </button>
                      <button
                        onClick={() => setAuthTab("register")}
                        className={cls("flex-1 text-xs py-1.5 cursor-pointer font-bold rounded-lg border transition-all", authTab === "register" ? "bg-primary text-white border-primary/20" : "bg-transparent text-muted hover:text-ink border-transparent")}
                      >
                        Kayıt Ol
                      </button>
                    </div>

                    <form
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end max-w-2xl"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (authTab === "login") handleAuth(() => signInEmail(email, password));
                        else handleAuth(() => registerEmail(name, email, password));
                      }}
                    >
                      {authTab === "register" && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80">Takma Ad</label>
                          <input
                            className="input !py-1.5 !rounded-lg text-xs mt-1"
                            placeholder="Takma adın"
                            value={name}
                            maxLength={20}
                            required
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80">E-posta</label>
                        <input
                          className="input !py-1.5 !rounded-lg text-xs mt-1"
                          type="email"
                          placeholder="ad@ornek.com"
                          value={email}
                          required
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted/80">Şifre</label>
                        <input
                          className="input !py-1.5 !rounded-lg text-xs mt-1"
                          type="password"
                          placeholder="En az 6 haneli"
                          value={password}
                          required
                          minLength={6}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-3 flex flex-wrap items-center gap-2.5 mt-2">
                        <button type="submit" className="btn-primary text-xs !py-2 px-5 flex items-center gap-1.5" disabled={busy}>
                          <Lock className="w-3.5 h-3.5" />
                          {busy ? "Lütfen bekleyin…" : authTab === "login" ? "Giriş Yap" : "Hesap Oluştur"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAuth(signInGoogle)}
                          className="btn-ghost text-xs !py-2 px-4 flex items-center gap-1.5"
                          disabled={busy}
                        >
                          <Mail className="w-3.5 h-3.5" /> Google Giriş
                        </button>
                      </div>
                    </form>
                    {authError && <p className="text-bad text-xs font-semibold mt-3 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {authError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Premium Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-5 bg-gradient-to-br from-violet-600/5 to-violet-800/0 border-violet-500/10">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Kazanma Oranı</span>
                <div className="text-2xl font-black text-violet-400 mt-2">
                  {user && rank && rank.gamesPlayed > 0
                    ? `${Math.round((rank.wins / rank.gamesPlayed) * 100)}%`
                    : "0%"}
                </div>
                <p className="text-[10px] text-muted/70 mt-1">Multiplayer galibiyet yüzdesi</p>
              </div>

              <div className="card p-5 bg-gradient-to-br from-pink-600/5 to-pink-800/0 border-pink-500/10">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Galibiyetler</span>
                <div className="text-2xl font-black text-pink-400 mt-2">
                  {user ? rank?.wins ?? 0 : 0}
                </div>
                <p className="text-[10px] text-muted/70 mt-1">Toplam düello birinciliği</p>
              </div>

              <div className="card p-5 bg-gradient-to-br from-amber-500/5 to-amber-700/0 border-amber-500/10">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">XP Seviyesi</span>
                <div className="text-2xl font-black text-amber-400 mt-2">
                  {user && rank ? Math.floor((rank.totalPoints / 250) + 1) : 1}
                </div>
                <p className="text-[10px] text-muted/70 mt-1">Sonraki seviye: {user && rank ? (250 - (rank.totalPoints % 250)) : 250} XP</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 & 3: Active and Completed Games lists */}
        {(activeTab === "active" || activeTab === "history") && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="card p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-muted/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  className="input !pl-10 !py-2 text-sm !rounded-xl"
                  placeholder="Kod, oyuncu veya oyun ara…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  className="input !py-1.5 !w-auto text-xs cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Filtrele: Tümü</option>
                  <option value="waiting">Sadece Bekleyenler</option>
                  <option value="playing">Sadece Oynananlar</option>
                  <option value="finished">Sadece Bitenler</option>
                  <option value="hosted">Kurduğum Odalar</option>
                  <option value="joined">Katıldığım Odalar</option>
                </select>

                <select
                  className="input !py-1.5 !w-auto text-xs cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="updated">Sırala: Son Güncelleme</option>
                  <option value="newest">Sırala: En Yeni</option>
                  <option value="oldest">Sırala: En Eski</option>
                  <option value="alphabetical">Sırala: A-Z (Oyun)</option>
                  <option value="status">Sırala: Durum</option>
                </select>
              </div>
            </div>

            {/* List */}
            {processedRooms.length === 0 ? (
              <div className="card p-12 text-center text-muted max-w-md mx-auto">
                <Gamepad2 className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                <h3 className="font-bold text-ink mb-1 text-sm">Hiç Oda Bulunamadı</h3>
                <p className="text-xs">Aktif veya tamamlanmış herhangi bir eşleşme bulunamadı.</p>
                <div className="mt-4">
                  <Link href="/oyunlar" className="btn-primary text-xs flex items-center gap-1 inline-flex">
                    <Plus className="w-4 h-4" /> Yeni Oda Kur
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedRooms
                  .filter((r) => (activeTab === "active" ? r.status !== "finished" : r.status === "finished"))
                  .map((room) => {
                    const g = GAME_MAP[room.slug];
                    const isHost = room.hostUid === profile.uid;
                    const status = STATUS_DETAILS[room.status] || {
                      label: room.status,
                      color: "bg-surface-2/40 text-muted border-edge/20",
                      icon: Clock,
                    };
                    const StatusIcon = status.icon;
                    const roleLabel = isHost ? "Ev Sahibi" : "Katılımcı";
                    const formattedDate = new Date(room.updatedAt).toLocaleDateString("tr", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    // Determine active turn
                    let activeTurnName = "Bilinmiyor";
                    let isMyTurn = false;
                    try {
                      const stateObj = JSON.parse(room.state);
                      const turnIdx = stateObj.turn;
                      if (turnIdx === 0) {
                        activeTurnName = room.hostName;
                        if (isHost) isMyTurn = true;
                      } else {
                        activeTurnName = room.guestName || "Bekleniyor";
                        if (!isHost) isMyTurn = true;
                      }
                    } catch {}

                    return (
                      <div
                        key={room.roomCode}
                        className="card group flex flex-col gap-3.5 p-4.5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                        style={{
                          boxShadow: g ? `inset 0 1px 0 hsla(${g.hue},80%,70%,0.05)` : undefined,
                        }}
                      >
                        {/* Background light glow */}
                        {g && (
                          <div
                            className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-5 blur-2xl pointer-events-none"
                            style={{ background: `hsl(${g.hue}, 85%, 60%)` }}
                          />
                        )}

                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg border border-edge/20 flex items-center justify-center bg-surface-2/20">
                              <GameIcon slug={room.slug} className="w-4 h-4" style={g ? { color: `hsl(${g.hue}, 80%, 65%)` } : undefined} />
                            </span>
                            <div>
                              <h3 className="font-bold text-sm tracking-tight text-ink leading-none">
                                {g?.name ?? room.slug}
                              </h3>
                              <span className="text-[9px] text-muted tracking-widest uppercase mt-1 block">
                                KOD: <b className="text-ink">{room.roomCode}</b>
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={cls("text-[9px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1", status.color)}>
                              <StatusIcon className="w-3 h-3" /> {status.label}
                            </span>
                            <span className="text-[9px] text-muted/75 mt-0.5">
                              {formattedDate}
                            </span>
                          </div>
                        </div>

                        {/* Players */}
                        <div className="bg-surface-2/25 p-2.5 rounded-xl border border-edge/20 space-y-2 text-xs text-muted">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-primary-soft" /> {room.hostName} <span className="text-[9px] text-muted/60">(Kurucu)</span>
                            </span>
                            {room.status === "playing" && activeTurnName === room.hostName && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-soft shadow shadow-primary-soft animate-ping" />
                            )}
                          </div>
                          <div className="flex justify-between items-center border-t border-edge/10 pt-1.5">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-secondary" /> {room.guestName || <span className="italic text-muted/40">Rakip bekleniyor...</span>}
                            </span>
                            {room.status === "playing" && activeTurnName === room.guestName && (
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow shadow-secondary animate-ping" />
                            )}
                          </div>
                        </div>

                        {/* Role and Turn indicators */}
                        <div className="flex justify-between items-center text-[10px] px-0.5 font-bold text-muted">
                          <span>
                            Rolüm: <b className="text-ink">{roleLabel}</b>
                          </span>
                          {room.status === "playing" && (
                            <span className={cls(isMyTurn ? "text-good" : "text-muted")}>
                              {isMyTurn ? "🟢 Senin Sıran!" : "⏳ Rakip Hamle Yapıyor"}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 mt-2 pt-3 border-t border-edge/15">
                          {room.status !== "finished" && (
                            <Link
                              href={`/oyunlar/${room.slug}?code=${room.roomCode}`}
                              className="btn-primary !px-3 !py-1.5 text-xs flex-1 text-center flex items-center justify-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" /> Devam Et
                            </Link>
                          )}
                          <button
                            onClick={() => setSelectedRoom(room)}
                            className="btn-ghost !px-2.5 !py-1.5 text-xs flex items-center gap-1"
                            title="Detayları Gör"
                          >
                            <Info className="w-3.5 h-3.5" /> Detay
                          </button>
                          <button
                            onClick={() => shareRoom(room)}
                            className="btn-ghost !px-2.5 !py-1.5 text-xs flex items-center gap-1"
                            title="Bağlantıyı Paylaş"
                          >
                            {shareSuccess === room.roomCode ? <Check className="w-3.5 h-3.5 text-good" /> : <Share2 className="w-3.5 h-3.5" />}
                            <span>{shareSuccess === room.roomCode ? "Kopyalandı" : "Paylaş"}</span>
                          </button>
                          {isHost ? (
                            <button
                              onClick={() => deleteRoom(room.roomCode)}
                              className="btn-ghost !px-2.5 !py-1.5 text-xs !border-bad/20 hover:!bg-bad/10 hover:!text-bad transition-colors"
                              title="Odayı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => leaveRoom(room)}
                              className="btn-ghost !px-2.5 !py-1.5 text-xs !border-bad/20 hover:!bg-bad/10 hover:!text-bad transition-colors"
                              title="Odadan Ayrıl"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Achievements */}
        {activeTab === "achievements" && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-1 tracking-tight text-ink flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" /> Başarımlar
            </h2>
            <p className="text-muted text-xs mb-6">Zihnini zorlayarak kazandığın ödüller ve madalyalar.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AchievementItem
                icon="🥉"
                title="İlk Adım"
                desc="İlk multiplayer oyununa başarıyla katıl."
                unlocked={user ? (rank?.gamesPlayed ?? 0) >= 1 : false}
              />
              <AchievementItem
                icon="🥈"
                title="Savaşçı"
                desc="En az 10 multiplayer maçı tamamla."
                unlocked={user ? (rank?.gamesPlayed ?? 0) >= 10 : false}
              />
              <AchievementItem
                icon="🥇"
                title="Usta Düellocu"
                desc="Çok oyunculu karşılaşmalarda 5 zafer elde et."
                unlocked={user ? (rank?.wins ?? 0) >= 5 : false}
              />
              <AchievementItem
                icon="💎"
                title="Şampiyonlar Ligi"
                desc="Global sıralamada 1000 puan barajını aş."
                unlocked={user ? (rank?.totalPoints ?? 0) >= 1000 : false}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Recent Visited Rooms (LocalStorage fallback) */}
        {activeTab === "recent" && (
          <div className="space-y-4">
            <div className="card p-4.5 bg-gradient-to-r from-surface-2/10 to-transparent">
              <h2 className="text-lg font-bold mb-1 tracking-tight text-ink flex items-center gap-2">
                <Save className="w-5 h-5 text-primary-soft" /> Son Ziyaret Edilen Odalar
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                İnternet bağlantın koptuğunda veya misafir olarak oynarken katıldığın odaları hızlıca bulabilmen için tarayıcında saklanan geçmiş.
              </p>
            </div>

            {recentRooms.length === 0 ? (
              <div className="card p-8 text-center text-muted max-w-sm mx-auto">
                <History className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                <p className="text-xs font-semibold">Geçmiş oda kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentRooms.map((room) => {
                  const g = GAME_MAP[room.slug];
                  return (
                    <div key={room.code} className="card p-4.5 flex flex-col gap-2 relative overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg border border-edge/20 flex items-center justify-center bg-surface-2/20">
                          <GameIcon slug={room.slug} className="w-4 h-4" style={g ? { color: `hsl(${g.hue}, 80%, 65%)` } : undefined} />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-ink leading-none">{room.name}</h4>
                          <span className="text-[9px] text-muted tracking-widest mt-1 block">🔑 Kod: <b>{room.code}</b></span>
                        </div>
                      </div>
                      <div className="text-[9px] text-muted/75 mt-1.5">
                        Ziyaret: {new Date(room.at).toLocaleString("tr")}
                      </div>
                      <div className="flex gap-2 mt-3 pt-2.5 border-t border-edge/15">
                        <a
                          href={`/oyunlar/${room.slug}?code=${room.code}`}
                          className="btn-primary !px-3 !py-1 text-xs text-center flex-1 flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Tekrar Bağlan
                        </a>
                        <button
                          onClick={() => copyRoomCode(room.code)}
                          className="btn-ghost !px-2.5 !py-1 text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Kopyala
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedRoom && (
        <Modal
          open={Boolean(selectedRoom)}
          onClose={() => setSelectedRoom(null)}
          title={`Oda Bilgisi — ${selectedRoom.roomCode}`}
        >
          <div className="space-y-4 text-xs text-ink/90">
            <div className="grid grid-cols-2 gap-3.5 bg-surface-2/20 p-4.5 rounded-xl border border-edge/15">
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase tracking-wider mb-0.5">Oyun</span>
                <span className="font-semibold text-ink">{GAME_MAP[selectedRoom.slug]?.name || selectedRoom.slug}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase tracking-wider mb-0.5">Durum</span>
                <span className="font-semibold text-ink">{selectedRoom.status}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase tracking-wider mb-0.5">Hamle Sayısı</span>
                <span className="font-semibold text-ink tabular-nums">{selectedRoom.moveCount ?? 0}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase tracking-wider mb-0.5">Oluşturuldu</span>
                <span className="font-semibold text-ink">{new Date(selectedRoom.createdAt).toLocaleDateString("tr")}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[10px] text-muted uppercase tracking-wider mb-2.5">Aktif Oyuncular</h4>
              <div className="space-y-2">
                {selectedRoom.playerObjects?.map((p: PlayerObj, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-surface p-2.5 rounded-xl border border-edge/20">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-soft">
                        {p.name.charAt(0)}
                      </span>
                      <span className="font-semibold text-ink">{p.name} {p.uid === profile.uid && <span className="text-[9px] text-muted/60">(sen)</span>}</span>
                    </span>
                    <span className="text-[10px] text-muted font-semibold bg-surface-2/30 px-2 py-0.5 rounded-full border border-edge/10">
                      {p.isHost ? "Kurucu (S0)" : "Katılımcı (S1)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[10px] text-muted uppercase tracking-wider mb-2">Hamle Durumu (JSON)</h4>
              <pre className="bg-surface-2 border border-edge/15 rounded-xl p-3 text-[10px] overflow-x-auto font-mono max-h-48 text-muted/80">
                {JSON.stringify(JSON.parse(selectedRoom.state), null, 2)}
              </pre>
            </div>

            <button onClick={() => setSelectedRoom(null)} className="btn-primary w-full mt-4">
              Kapat
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AchievementItem({ icon, title, desc, unlocked }: { icon: string; title: string; desc: string; unlocked: boolean }) {
  return (
    <div className={cls(
      "flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-300",
      unlocked
        ? "bg-primary/5 border-primary/20 text-ink shadow-inner shadow-primary/5"
        : "bg-surface-2/15 border-edge/10 text-muted/50 opacity-55"
    )}>
      <span className="text-3xl filter drop-shadow">{icon}</span>
      <div>
        <h4 className="font-bold text-sm text-ink leading-tight">{title}</h4>
        <p className="text-[10px] mt-0.5 text-muted leading-relaxed">{desc}</p>
      </div>
      {unlocked && (
        <span className="ml-auto text-[9px] font-black text-primary-soft bg-primary/10 rounded-full px-2 py-0.5 border border-primary/20">
          Açıldı
        </span>
      )}
    </div>
  );
}

function humanizeAuthError(msg: string): string {
  if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password"))
    return "E-posta veya şifre hatalı.";
  if (msg.includes("auth/user-not-found")) return "Bu e-postayla kayıtlı kullanıcı yok.";
  if (msg.includes("auth/email-already-in-use")) return "Bu e-posta zaten kayıtlı.";
  if (msg.includes("auth/weak-password")) return "Şifre çok zayıf (en az 6 karakter).";
  if (msg.includes("auth/invalid-email")) return "Geçersiz e-posta adresi.";
  if (msg.includes("auth/popup-closed-by-user")) return "Giriş penceresi kapatıldı.";
  return "Bir hata oluştu. Lütfen tekrar dene.";
}
