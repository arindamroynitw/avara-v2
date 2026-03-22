"use client";

import { createContext, useContext } from "react";

export interface UserData {
  id: string;
  fullName: string;
  email: string;
}

const UserContext = createContext<UserData | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}

export function UserProvider({
  value,
  children,
}: {
  value: UserData;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
