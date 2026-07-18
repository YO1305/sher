import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import { useTransactionStore } from '../store/transactionStore'
import { useDebtStore } from '../store/debtStore'
import { useSettingsStore } from '../store/settingsStore'
import type { Transaction, Debt, Settings } from '../types'

// Firestore не принимает undefined-поля — убираем их перед записью
function clean<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

type Unsub = () => void

let unsubs: Unsub[] = []
// Флаг, чтобы не отправлять обратно в Firestore данные, которые только что пришли оттуда
let applyingRemote = false
// Снимок последнего синхронизированного состояния (id -> JSON), для вычисления diff
let syncedTx = new Map<string, string>()
let syncedDebts = new Map<string, string>()
let syncedSettings = ''

function pickSettings(s: Settings): Settings {
  return {
    userName: s.userName,
    language: s.language,
    initialBalance: s.initialBalance,
    currency: s.currency,
    onboardingDone: s.onboardingDone,
    creditCards: s.creditCards ?? [],
    customCategories: s.customCategories ?? [],
    categoryOverrides: s.categoryOverrides ?? [],
  }
}

async function uploadAll(uid: string, txs: Transaction[], debts: Debt[], settings: Settings) {
  if (!db) return
  const items: { path: string[]; data: object }[] = [
    ...txs.map((t) => ({ path: ['users', uid, 'transactions', t.id], data: clean(t) })),
    ...debts.map((d) => ({ path: ['users', uid, 'debts', d.id], data: clean(d) })),
    { path: ['users', uid, 'meta', 'settings'], data: clean(settings) },
  ]
  // Батчи Firestore ограничены 500 операциями
  for (let i = 0; i < items.length; i += 450) {
    const batch = writeBatch(db)
    for (const item of items.slice(i, i + 450)) {
      batch.set(doc(db, item.path.join('/')), item.data)
    }
    await batch.commit()
  }
}

function syncCollection<T extends { id: string }>(
  uid: string,
  name: 'transactions' | 'debts',
  syncedMap: Map<string, string>,
  getItems: () => T[],
  setItems: (items: T[]) => void,
  subscribe: (listener: () => void) => Unsub,
) {
  if (!db) return
  const colRef = collection(db, 'users', uid, name)

  // Firestore -> локальный стор
  unsubs.push(
    onSnapshot(colRef, (snap) => {
      const remote = snap.docs.map((d) => d.data() as T)
      syncedMap.clear()
      for (const item of remote) syncedMap.set(item.id, JSON.stringify(item))
      applyingRemote = true
      setItems(remote)
      applyingRemote = false
    }),
  )

  // Локальный стор -> Firestore (по diff)
  unsubs.push(
    subscribe(() => {
      if (applyingRemote || !db) return
      const current = getItems()
      const currentIds = new Set<string>()
      for (const item of current) {
        currentIds.add(item.id)
        const json = JSON.stringify(item)
        if (syncedMap.get(item.id) !== json) {
          syncedMap.set(item.id, json)
          void setDoc(doc(db, 'users', uid, name, item.id), clean(item))
        }
      }
      for (const id of [...syncedMap.keys()]) {
        if (!currentIds.has(id)) {
          syncedMap.delete(id)
          void deleteDoc(doc(db, 'users', uid, name, id))
        }
      }
    }),
  )
}

export async function startSync(uid: string) {
  if (!db) return
  stopSync()

  const txStore = useTransactionStore.getState()
  const debtStore = useDebtStore.getState()
  const settingsStore = useSettingsStore.getState()

  // Проверяем, есть ли данные в облаке
  const [remoteTx, remoteDebts, remoteMeta] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'transactions')),
    getDocs(collection(db, 'users', uid, 'debts')),
    getDocs(collection(db, 'users', uid, 'meta')),
  ])
  const remoteEmpty = remoteTx.empty && remoteDebts.empty && remoteMeta.empty
  const localHasData = txStore.transactions.length > 0 || debtStore.debts.length > 0

  if (remoteEmpty && localHasData) {
    // Первый вход: загружаем локальные данные в облако
    await uploadAll(uid, txStore.transactions, debtStore.debts, pickSettings(settingsStore))
  }

  syncedTx = new Map()
  syncedDebts = new Map()

  syncCollection<Transaction>(
    uid,
    'transactions',
    syncedTx,
    () => useTransactionStore.getState().transactions,
    (items) => useTransactionStore.getState().setTransactions(items),
    (fn) => useTransactionStore.subscribe(fn),
  )

  syncCollection<Debt>(
    uid,
    'debts',
    syncedDebts,
    () => useDebtStore.getState().debts,
    (items) => useDebtStore.getState().setDebts(items),
    (fn) => useDebtStore.subscribe(fn),
  )

  // Настройки: один документ users/{uid}/meta/settings
  const settingsRef = doc(db, 'users', uid, 'meta', 'settings')
  unsubs.push(
    onSnapshot(settingsRef, (snap) => {
      if (!snap.exists()) return
      const remote = snap.data() as Settings
      syncedSettings = JSON.stringify(pickSettings(remote))
      applyingRemote = true
      const merged = {
        ...remote,
        creditCards:
          remote.creditCards && remote.creditCards.length > 0
            ? remote.creditCards
            : useSettingsStore.getState().creditCards,
        customCategories: remote.customCategories ?? useSettingsStore.getState().customCategories,
        categoryOverrides: remote.categoryOverrides ?? useSettingsStore.getState().categoryOverrides,
      }
      useSettingsStore.getState().setSettings(merged)
      applyingRemote = false
    }),
  )
  unsubs.push(
    useSettingsStore.subscribe((state) => {
      if (applyingRemote || !db) return
      const current = pickSettings(state)
      const json = JSON.stringify(current)
      if (json !== syncedSettings) {
        syncedSettings = json
        void setDoc(settingsRef, clean(current), { merge: true })
      }
    }),
  )
}

export function stopSync() {
  for (const unsub of unsubs) unsub()
  unsubs = []
  syncedTx = new Map()
  syncedDebts = new Map()
  syncedSettings = ''
}
