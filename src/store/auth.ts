// Auth store.
//
// Why zustand and not React Context:
//   - Context re-renders every consumer on every state change, which
//     becomes painful when the auth value is read from many places.
//   - zustand exposes a `getState()` that lets the axios interceptor
//     read the current token WITHOUT being a React component. With
//     Context we'd have to thread a ref through and call useContext
//     inside the interceptor, which doesn't work outside React.
//
// Persistence:
//   We persist only `{ token, user }`. NOT `isHydrating` — that's a
//   transient render flag, not part of the auth identity.
//
//   Storage is `localStorage`. The token survives full reloads (and
//   browser restarts) until either (a) the user logs out, (b) the API
//   returns 401 (handled in lib/api.ts), or (c) the admin deactivates
//   the user (also yields 401 on the next call).
//
//   Threat model: LAN deployment, trusted kiosks. localStorage is the
//   right call. For multi-tenant / hostile-host scenarios we'd switch
//   to memory-only + an httpOnly cookie path on the backend.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { PublicUser } from '@/types/api'

interface AuthState {
  token: string | null
  user: PublicUser | null
  /** Setter used by the login mutation on success. */
  setSession: (token: string, user: PublicUser) => void
  /** Replace just the user (e.g. after a /auth/me refresh). */
  setUser: (user: PublicUser) => void
  /** Drop the session entirely. Used by logout and by the 401 handler. */
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null })
    }),
    {
      // Key in localStorage. Bumping this string is a clean way to
      // force everyone to re-login (e.g. after a breaking change to
      // the User shape — though we don't anticipate one).
      name: 'cobs:auth:v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist the durable bits. Functions are not serializable
      // and don't need to be — they're recreated on every page load.
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
)

/** Selector helpers. Use these inside components so re-renders only
    fire when the slice you care about changes. */
export const useAuthToken = () => useAuthStore((s) => s.token)
export const useAuthUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () =>
  useAuthStore((s) => Boolean(s.token && s.user))
