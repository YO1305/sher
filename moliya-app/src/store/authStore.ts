import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config'
import { startSync, stopSync } from '../firebase/sync'

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
}

interface AuthState {
  user: AuthUser | null
  syncing: boolean
  error: string
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  syncing: false,
  error: '',
  signIn: async () => {
    if (!auth) return
    set({ error: '' })
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // Попапы часто блокируются на мобильных — пробуем редирект
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch {
          /* показываем исходную ошибку ниже */
        }
      }
      set({ error: code ?? 'auth error' })
    }
  },
  signOut: async () => {
    if (!auth) return
    stopSync()
    await fbSignOut(auth)
  },
}))

if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      useAuthStore.setState({
        user: { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName },
        syncing: true,
      })
      void startSync(fbUser.uid)
        .catch(() => useAuthStore.setState({ error: 'sync error' }))
        .finally(() => useAuthStore.setState({ syncing: false }))
    } else {
      stopSync()
      useAuthStore.setState({ user: null, syncing: false })
    }
  })
}
