"use client";

import { createElement, useState, useEffect, useCallback, type ReactNode } from "react";
import { collection, query, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type {
  Supplier, Buyer, Product, Deal, Commission, CommissionDistribution,
  CalculatorScenario, ActivityLog, UserProfile, BuyerInteraction, FollowUp,
  BuyerRequest, RequestFinding,
} from "@/lib/data";

// Allowed admin emails
const ALLOWED_EMAILS = ["rangga@harsarekaniaga.id", "hafids@harsarekaniaga.id"];

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (auth) return;
    const id = window.setTimeout(() => setLoading(false), 0);
    return () => window.clearTimeout(id);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase belum siap.");
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      throw new Error("Akses hanya untuk Rangga dan Hafids.");
    }
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const isAdmin = user ? ALLOWED_EMAILS.includes((user.email ?? "").toLowerCase()) : false;

  return { user, loading, login, logout, isAdmin, isAuthenticated: !!user };
}

// ------------------------------------------------------------
// Generic Firestore hooks
// ------------------------------------------------------------
function useCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !auth) return;

    let unsubSnapshot: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = undefined;
      }

      if (!user) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const q = query(collection(db, collectionName));
      unsubSnapshot = onSnapshot(q, (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        setData(items);
        setLoading(false);
      }, (err) => {
        if (err.code !== "permission-denied") {
          console.warn(`[firebase-store] ${collectionName}:`, err.message);
        }
        setLoading(false);
      });
    });

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      unsubAuth();
    };
  }, [collectionName]);

  useEffect(() => {
    if (db && auth) return;
    const id = window.setTimeout(() => {
      setData([]);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const add = useCallback(async (item: T | Omit<T, "id">) => {
    if (!db) throw new Error("Firebase belum siap.");
    if (!auth?.currentUser) throw new Error("Silakan login terlebih dahulu.");
    const { id: maybeId, ...rest } = item as T & { id?: string };
    if (maybeId) {
      await setDoc(doc(db, collectionName, maybeId), {
        ...rest,
        createdAt: serverTimestamp(),
      });
      return maybeId;
    }
    const docRef = await addDoc(collection(db, collectionName), {
      ...rest,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }, [collectionName]);

  const update = useCallback(async (id: string, changes: Partial<T>) => {
    if (!db) throw new Error("Firebase belum siap.");
    if (!auth?.currentUser) throw new Error("Silakan login terlebih dahulu.");
    await updateDoc(doc(db, collectionName, id), changes as Record<string, unknown>);
  }, [collectionName]);

  const remove = useCallback(async (id: string) => {
    if (!db) throw new Error("Firebase belum siap.");
    if (!auth?.currentUser) throw new Error("Silakan login terlebih dahulu.");
    await deleteDoc(doc(db, collectionName, id));
  }, [collectionName]);

  const refresh = useCallback(() => {}, []);
  return { list: data, loading, add, update, remove, refresh };
}

// ------------------------------------------------------------
// Suppliers
// ------------------------------------------------------------
export function useSuppliers() {
  return useCollection<Supplier>("suppliers");
}

// ------------------------------------------------------------
// Buyers
// ------------------------------------------------------------
export function useBuyers() {
  return useCollection<Buyer>("buyers");
}

// ------------------------------------------------------------
// Products
// ------------------------------------------------------------
export function useProducts() {
  return useCollection<Product>("products");
}

// ------------------------------------------------------------
// Deals
// ------------------------------------------------------------
export function useDeals() {
  return useCollection<Deal>("deals");
}

// ------------------------------------------------------------
// Commissions
// ------------------------------------------------------------
export function useCommissions() {
  return useCollection<Commission>("commissions");
}

// ------------------------------------------------------------
// Calculator Scenarios
// ------------------------------------------------------------
export function useCalculatorScenarios() {
  return useCollection<CalculatorScenario>("calculatorScenarios");
}

// ------------------------------------------------------------
// Activity Logs
// ------------------------------------------------------------
export function useActivityLogs() {
  return useCollection<ActivityLog>("activityLogs");
}

// ------------------------------------------------------------
// Commission Distribution (single doc)
// ------------------------------------------------------------
export function useCommissionDistribution() {
  const [value, setValue] = useState<CommissionDistribution>({
    id: "main",
    partnerAShare: 40,
    partnerBShare: 40,
    operationalReserve: 20,
    updatedAt: new Date().toISOString(),
    demo: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !auth) return;

    let unsubSnapshot: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = undefined;
      }
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      unsubSnapshot = onSnapshot(doc(db, "commissionDistribution", "main"), (docSnap) => {
        if (docSnap.exists()) {
          setValue(docSnap.data() as CommissionDistribution);
        }
        setLoading(false);
      }, (err) => {
        if (err.code !== "permission-denied") {
          console.warn("[firebase-store] commissionDistribution:", err.message);
        }
        setLoading(false);
      });
    });

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (db && auth) return;
    const id = window.setTimeout(() => setLoading(false), 0);
    return () => window.clearTimeout(id);
  }, []);

  const update = useCallback(async (changes: Partial<CommissionDistribution>) => {
    if (!db) throw new Error("Firebase belum siap.");
    if (!auth?.currentUser) throw new Error("Silakan login terlebih dahulu.");
    await updateDoc(doc(db, "commissionDistribution", "main"), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const refresh = useCallback(() => {}, []);
  return { value, loading, update, refresh };
}

// ------------------------------------------------------------
// Buyer Interactions (stub - can be wired to Firestore collection)
// ------------------------------------------------------------
export function useBuyerInteractions() {
  return useCollection<BuyerInteraction>("buyerInteractions");
}

// ------------------------------------------------------------
// Follow Ups (stub - can be wired to Firestore collection)
// ------------------------------------------------------------
export function useFollowUps() {
  return useCollection<FollowUp>("followUps");
}

// ------------------------------------------------------------
// Users
// ------------------------------------------------------------
export function useUsers() {
  return useCollection<UserProfile>("users");
}

// ------------------------------------------------------------
// Buyer Requests
// ------------------------------------------------------------
export function useBuyerRequests() {
  return useCollection<BuyerRequest>("buyerRequests");
}

// ------------------------------------------------------------
// Request Findings
// ------------------------------------------------------------
export function useRequestFindings() {
  return useCollection<RequestFinding>("requestFindings");
}

// ------------------------------------------------------------
// DemoStoreProvider (compatibility - no-op wrapper for Firebase)
// ------------------------------------------------------------
export function DemoStoreProvider({ children }: { children: ReactNode }) {
  return createElement("div", { style: { display: "contents" } }, children);
}

// ------------------------------------------------------------
// Demo store (for backward compatibility)
// ------------------------------------------------------------
export function useDemoStore() {
  const suppliers = useSuppliers();
  const buyers = useBuyers();
  const products = useProducts();
  const deals = useDeals();
  const commissions = useCommissions();
  const users = useUsers();
  const calculatorScenarios = useCalculatorScenarios();
  const activityLogs = useActivityLogs();
  const buyerInteractions = useBuyerInteractions();
  const followUps = useFollowUps();
  const commissionDistribution = useCommissionDistribution();

  return {
    data: {
      suppliers: suppliers.list,
      buyers: buyers.list,
      products: products.list,
      deals: deals.list,
      commissions: commissions.list,
      users: users.list,
      calculatorScenarios: calculatorScenarios.list,
      activityLogs: activityLogs.list,
      buyerInteractions: buyerInteractions.list,
      followUps: followUps.list,
      commissionDistribution: commissionDistribution.value,
    },
    refresh: () => {},
    reset: () => {},
    markDemo: () => {},
  };
}
