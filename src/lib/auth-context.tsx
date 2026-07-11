"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseAuth, db, isFirebaseEnabled, initializeFirebase, type FirebaseConfig } from "./firebase";

export interface Profile {
  uid: string | null; // null => guest
  name: string;
  isGuest: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile;
  loading: boolean;
  firebaseReady: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setGuestName: (name: string) => void;
}

const GUEST_KEY = "splend:guest-name";

function defaultGuestName() {
  return `Misafir-${Math.floor(1000 + Math.random() * 9000)}`;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  firebaseConfig,
  children,
}: {
  firebaseConfig: FirebaseConfig;
  children: ReactNode;
}) {
  initializeFirebase(firebaseConfig);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseEnabled);
  const [guestName, setGuestNameState] = useState(() => {
    if (typeof window === "undefined") return "Misafir";
    const stored = window.localStorage.getItem(GUEST_KEY);
    if (stored) return stored;
    const name = defaultGuestName();
    window.localStorage.setItem(GUEST_KEY, name);
    return name;
  });

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function ensureUserDoc(u: User, name?: string) {
    if (!db) return;
    await setDoc(
      doc(db, "users", u.uid),
      { name: name || u.displayName || "Oyuncu" },
      { merge: true }
    );
  }

  const value: AuthContextValue = {
    user,
    loading,
    firebaseReady: isFirebaseEnabled,
    profile: user
      ? { uid: user.uid, name: user.displayName || "Oyuncu", isGuest: false }
      : { uid: null, name: guestName, isGuest: true },
    async signInGoogle() {
      if (!firebaseAuth) throw new Error("Firebase yapılandırılmamış.");
      const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      await ensureUserDoc(cred.user);
    },
    async signInEmail(email, password) {
      if (!firebaseAuth) throw new Error("Firebase yapılandırılmamış.");
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await ensureUserDoc(cred.user);
    },
    async registerEmail(name, email, password) {
      if (!firebaseAuth) throw new Error("Firebase yapılandırılmamış.");
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await ensureUserDoc(cred.user, name);
      setUser({ ...cred.user });
    },
    async signOut() {
      if (firebaseAuth) await fbSignOut(firebaseAuth);
    },
    setGuestName(name: string) {
      const clean = name.trim().slice(0, 20) || defaultGuestName();
      localStorage.setItem(GUEST_KEY, clean);
      setGuestNameState(clean);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
