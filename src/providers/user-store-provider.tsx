// src/providers/user-store-provider.tsx
"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useStore } from "zustand";

import {
  type UserStore,
  createUserStore,
  type UserState,
} from "@/stores/user-store"; // Ensure UserState is exported
import { createClient } from "@/lib/supabase/client";

export type UserStoreApi = ReturnType<typeof createUserStore>;

export const UserStoreContext = createContext<UserStoreApi | undefined>(
  undefined
);

// Define a default state for when no user is logged in or profile is not found
// Ensure this matches your UserState type, especially clinic_id as nullable
const defaultUserState = {
  id: "",
  email: "",
  full_name: "",
  gender: "",
  birth_date: new Date(0), // Default to epoch
  contact_number: "",
  residence: "",
  work_place: "",
  region: "",
  role: null as "admin" | "customer" | null,
  created_at: new Date(0),
  login_status: "",
};

export const UserStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<UserStoreApi | null>(null);
  const [isStoreInitialized, setIsStoreInitialized] = useState(false);

  // Create Supabase client instance
  // This is already a singleton pattern, so we can reuse it
  // across the application without creating multiple instances.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const supabaseClient = createClient();

  useEffect(() => {
    let mounted = true;

    const initializeStore = async () => {
      let initialDataForStore: UserState = { user: defaultUserState };
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();
        if (sessionError) {
          console.error("Error getting initial session:", sessionError.message);
          // Early return on session error
          return;
        }
        if (!session?.user) {
          initialDataForStore = { user: defaultUserState };
          return;
        }
        // Only runs if session.user exists
        const profile = await fetchPublicDataOfUser(session.user.id);
        if (profile) {
          initialDataForStore = {
            user: {
              id: profile.id,
              email: session.user.email || "",
              full_name: profile.full_name,
              gender: profile.gender,
              birth_date: profile.birthdate,
              contact_number: profile.contact_number,
              residence: profile.residence,
              work_place: profile.work_place,
              role: profile.role,
              created_at: profile.created_at,
              login_status: profile.login_status,
            },
          };
        } else {
          initialDataForStore = {
            user: {
              ...defaultUserState,
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || "",
              role: session.user.user_metadata.role || "",
            },
          };
        }
      } catch (e) {
        console.error("Unexpected error during store initialization:", e);
      } finally {
        if (mounted) {
          if (!storeRef.current) {
            storeRef.current = createUserStore(initialDataForStore);
          } else {
            storeRef.current.getState().updateUser(initialDataForStore.user);
          }
          setIsStoreInitialized(true);
        }
      }
    };

    initializeStore();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          if (!storeRef.current) {
            console.warn("onAuthStateChange: storeRef not initialized yet.");
            return;
          }
          if (event === "SIGNED_IN" && session?.user) {
            await fetchProfileAndUpdateStore(
              storeRef.current,
              session.user.id,
              session.user.email
            );
          } else if (event === "SIGNED_OUT") {
            storeRef.current.getState().updateUser(defaultUserState);
          } else if (event === "USER_UPDATED" && session?.user) {
            await fetchProfileAndUpdateStore(
              storeRef.current,
              session.user.id,
              session.user.email
            );
          }
        }, 0);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  // Render children only after the store is initialized
  if (!isStoreInitialized || !storeRef.current) {
    return null; // Or a loading spinner, or some fallback UI
  }

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const userStoreContext = useContext(UserStoreContext);

  if (!userStoreContext) {
    // This error implies that useUserStore is used outside UserStoreProvider
    // or before the store is initialized and provider has rendered.
    throw new Error(
      `useUserStore must be used within a UserStoreProvider, and after the store has been initialized.`
    );
  }

  return useStore(userStoreContext, selector);
};

// --- Helper Functions ---

/**
 * Fetches the public user data from Supabase for a given user ID.
 *
 * - Queries the `user` table.
 * - Returns the user data object or null if not found.
 * - Throws an error for any Supabase error except for code "PGRST116" (row not found).
 *
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<any | null>} The user data object or null if not found.
 * @throws {Error} If a Supabase error occurs (other than not found).
 *
 * @example
 * const user = await fetchPublicDataOfUser("123");
 * if (user) {
 *   console.log(user.full_name);
 * }
 */
async function fetchPublicDataOfUser(userId: string) {
  const supabaseClient = createClient();
  const { data, error } = await supabaseClient
    .from("user")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data || null;
}

/**
 * Updates the zustand user store with the given user profile data.
 * If no profile is found, falls back to minimal info.
 */

// Custom type for user profile with clinic relation
// This type should come from supabase type
type UserProfileWithClinic = {
  id: string;
  email?: string;
  full_name: string;
  gender: string;
  birthdate: Date;
  contact_number: string;
  residence: string;
  work_place: string;
  role: "admin" | "customer" | null;
  created_at: Date;
  clinic_id: number;
  clinic?: {
    id: number;
    name: string;
    region: string;
    // Add other clinic fields as needed
  } | null;
  login_status: string;
};

function updateUserStoreWithProfile(
  store: UserStoreApi,
  profile: UserProfileWithClinic | null,
  userId: string,
  userEmail?: string
) {
  if (profile) {
    store.getState().updateUser({
      id: profile.id,
      email: userEmail || "",
      full_name: profile.full_name,
      gender: profile.gender,
      birth_date: profile.birthdate,
      contact_number: profile.contact_number,
      residence: profile.residence,
      work_place: profile.work_place,
      role: profile.role,
      created_at: profile.created_at,
      login_status: profile.login_status,
    });
  } else {
    store.getState().updateUser({
      ...defaultUserState,
      id: userId,
      email: userEmail || "",
      role: null,
      login_status: "inactive",
    });
  }
}

/**
 * Fetches the user profile and updates the zustand store.
 * Handles errors and fallback logic.
 */
async function fetchProfileAndUpdateStore(
  store: UserStoreApi,
  userId: string,
  userEmail?: string
) {
  try {
    const profile = await fetchPublicDataOfUser(userId);
    updateUserStoreWithProfile(store, profile, userId, userEmail);
  } catch (e) {
    console.error("Unexpected error in fetchProfileAndUpdateStore:", e);
    updateUserStoreWithProfile(store, null, userId, userEmail);
  }
}
