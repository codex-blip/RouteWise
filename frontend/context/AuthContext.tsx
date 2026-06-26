"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ ok: false, error: "Not initialized" }),
  register: async () => ({ ok: false, error: "Not initialized" }),
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { signOut } = useClerk();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (userLoaded) {
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: clerkUser.fullName || clerkUser.username || "",
          role: (clerkUser.publicMetadata?.role as string) || "rider",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [clerkUser, userLoaded]);

  const login = async (email: string, password: string) => {
    if (!signInLoaded) return { ok: false, error: "Clerk not loaded" };
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        return { ok: true };
      } else {
        return { ok: false, error: `Login status: ${result.status}` };
      }
    } catch (e: any) {
      return { ok: false, error: e.errors?.[0]?.message || e.message || "Login failed" };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (!signUpLoaded) return { ok: false, error: "Clerk not loaded" };
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.errors?.[0]?.message || e.message || "Registration failed" };
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading: loading || !userLoaded, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
