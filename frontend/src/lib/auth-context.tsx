"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  signInWithCustomToken,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebaseClient";

export type UserRole = "claimant" | "examiner" | "admin";

export interface UserProfile {
  uid: string;
  phone?: string;
  email?: string;
  fullName: string;
  role: UserRole;
  status: "active" | "pending" | "rejected";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<UserProfile>;
  signInWithToken: (token: string) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile> => {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const p = snap.data() as UserProfile;
      setProfile(p);
      return p;
    }
    throw new Error("User profile not found");
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          try {
            await fetchProfile(firebaseUser.uid);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    } catch (e) {
      console.error("[Auth] Firebase not configured:", e);
      setLoading(false);
    }
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const signInAdmin = async (email: string, password: string): Promise<UserProfile> => {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return fetchProfile(cred.user.uid);
  };

  const signInWithToken = async (token: string): Promise<UserProfile> => {
    const auth = getFirebaseAuth();
    const cred = await signInWithCustomToken(auth, token);
    return fetchProfile(cred.user.uid);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, signInAdmin, signInWithToken, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
