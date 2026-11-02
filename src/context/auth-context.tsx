
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

type UserRole =
  | "admin"
  | "assistant_treasurer"
  | "prefect"
  | null;

type AuthContextType = {
  user: User | null;
  role: UserRole;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setRole(null);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (userDoc.exists()) {
          const userRole = userDoc.data().role;

          if (
            userRole === "admin" ||
            userRole === "assistant_treasurer" ||
            userRole === "prefect"
          ) {
            setRole(userRole);
          }
        }
      } catch (error) {
        console.error("Failed to load user role:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
