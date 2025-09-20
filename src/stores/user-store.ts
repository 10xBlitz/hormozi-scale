// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";

export type UserState = {
  user: {
    id: string;
    email: string;
    full_name: string;
    gender: string;
    birth_date: Date;
    contact_number: string;
    residence: string;
    work_place: string;
    role: "admin" | "customer" | null;
    login_status: string; // e.g., "active", "inactive"
    created_at: Date;
  };
};

export type UserAction = {
  updateUser: (userData: Partial<UserState>["user"]) => void;
};

export type UserStore = UserState & UserAction;

export const createUserStore = (initState: UserState) => {
  return createStore<UserStore>()((set) => ({
    ...initState,
    updateUser: (userData) =>
      set((state) => ({
        user: state.user
          ? { ...state.user, ...userData }
          : (userData as UserState["user"]),
      })),
  }));
};
