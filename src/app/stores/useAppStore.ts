import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppUser, UserRole } from '../types/domain';
import { STORAGE_KEYS } from '../lib/constants';

interface AppStoreState {
  demoUser: AppUser | null;
  preferredRole: UserRole | null;
  setDemoUser: (user: AppUser | null) => void;
  setPreferredRole: (role: UserRole | null) => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      demoUser: null,
      preferredRole: null,
      setDemoUser: (user) => set({ demoUser: user }),
      setPreferredRole: (role) => set({ preferredRole: role }),
    }),
    {
      name: STORAGE_KEYS.profile,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        demoUser: state.demoUser,
        preferredRole: state.preferredRole,
      }),
    }
  )
);
