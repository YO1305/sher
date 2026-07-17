import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

// Публичный конфиг Firebase Web (по дизайну встраивается в клиент — не секрет).
// Значения из .env.local имеют приоритет; иначе используется этот проект (moliya-s),
// чтобы облако работало и в проде (Vercel) без настройки переменных окружения.
const fallbackConfig = {
  apiKey: 'AIzaSyAjiJcrWUjT8sg_3zQS6d1dX0VWghyoOLQ',
  authDomain: 'moliya-s.firebaseapp.com',
  projectId: 'moliya-s',
  storageBucket: 'moliya-s.firebasestorage.app',
  messagingSenderId: '376723011011',
  appId: '1:376723011011:web:36709f983797d02af37976',
}

const env = import.meta.env
const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) || fallbackConfig.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || fallbackConfig.authDomain,
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined) || fallbackConfig.projectId,
  storageBucket:
    (env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || fallbackConfig.storageBucket,
  messagingSenderId:
    (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ||
    fallbackConfig.messagingSenderId,
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) || fallbackConfig.appId,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Локальный кэш, чтобы приложение продолжало работать офлайн (PWA)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}

export const googleProvider = new GoogleAuthProvider()
export { auth, db }
