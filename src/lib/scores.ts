import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Profile } from "./auth-context";

export interface ScoreEntry {
  gameSlug: string;
  name: string;
  score: number;
  uid: string | null;
  at: number; // epoch ms
}

export interface UserRank {
  uid: string;
  name: string;
  totalPoints: number;
  wins: number;
  gamesPlayed: number;
}

const LOCAL_SCORES_KEY = "splend:scores";
const MAX_LOCAL = 300;

// ---------- Local (guest) storage ----------

export function getLocalScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalScore(entry: ScoreEntry) {
  const all = getLocalScores();
  all.push(entry);
  all.sort((a, b) => b.at - a.at);
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(all.slice(0, MAX_LOCAL)));
}

export function getLocalBest(gameSlug: string): number | null {
  const scores = getLocalScores().filter((s) => s.gameSlug === gameSlug);
  if (!scores.length) return null;
  return Math.max(...scores.map((s) => s.score));
}

export function getLocalTotals(): { totalPoints: number; gamesPlayed: number } {
  const scores = getLocalScores();
  return {
    totalPoints: scores.reduce((sum, s) => sum + s.score, 0),
    gamesPlayed: scores.length,
  };
}

// ---------- Submitting ----------

/**
 * Submits a finished single-player score.
 * Logged-in users -> Firestore (global leaderboard). Guests -> localStorage only.
 */
export async function submitScore(
  profile: Profile,
  gameSlug: string,
  score: number
): Promise<"cloud" | "local"> {
  const entry: ScoreEntry = {
    gameSlug,
    name: profile.name,
    score: Math.max(0, Math.round(score)),
    uid: profile.uid,
    at: Date.now(),
  };
  // Guests never write to Firebase — local only.
  saveLocalScore(entry);
  if (profile.isGuest || !db || !profile.uid) return "local";

  try {
    await addDoc(collection(db, "scores"), entry);
    await setDoc(
      doc(db, "users", profile.uid),
      {
        name: profile.name,
        totalPoints: increment(entry.score),
        gamesPlayed: increment(1),
      },
      { merge: true }
    );
    return "cloud";
  } catch (e) {
    console.error("Skor gönderilemedi:", e);
    return "local";
  }
}

/** Records an online multiplayer win for a logged-in player. */
export async function recordWin(profile: Profile): Promise<void> {
  if (profile.isGuest || !db || !profile.uid) return;
  try {
    await setDoc(
      doc(db, "users", profile.uid),
      { name: profile.name, wins: increment(1), totalPoints: increment(50) },
      { merge: true }
    );
  } catch (e) {
    console.error("Galibiyet kaydedilemedi:", e);
  }
}

// ---------- Leaderboards ----------

export async function fetchTopScores(
  gameSlug: string,
  n = 20
): Promise<ScoreEntry[]> {
  if (!db) return [];
  const q = query(
    collection(db, "scores"),
    where("gameSlug", "==", gameSlug),
    orderBy("score", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ScoreEntry);
}

export async function fetchTopUsers(n = 20): Promise<UserRank[]> {
  if (!db) return [];
  const q = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name ?? "Oyuncu",
      totalPoints: data.totalPoints ?? 0,
      wins: data.wins ?? 0,
      gamesPlayed: data.gamesPlayed ?? 0,
    };
  });
}

export async function fetchUserRank(uid: string): Promise<UserRank | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    name: data.name ?? "Oyuncu",
    totalPoints: data.totalPoints ?? 0,
    wins: data.wins ?? 0,
    gamesPlayed: data.gamesPlayed ?? 0,
  };
}
