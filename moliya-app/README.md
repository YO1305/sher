# Moliya — Shaxsiy moliya

Личная финансовая учётная система (PWA). Данные хранятся локально в браузере, а после входа через Google — синхронизируются с облаком (Firebase Firestore).

## Стек

- React + Vite + TypeScript
- Tailwind CSS
- Zustand + localStorage
- Firebase (Auth + Firestore) — облачная синхронизация
- Recharts, Lucide, react-i18next (UZ/RU)
- vite-plugin-pwa
- xlsx (импорт Excel)

## Запуск

```bash
cd moliya-app
npm install
npm run dev
```

Сборка:

```bash
npm run build
npm run preview
```

## Возможности

- Дашборд: баланс, итоги месяца, pie chart, последние операции
- Журнал транзакций с фильтрами и поиском
- Долги и кредиты (кредиты / мне должны / я должен)
- Отчёты и аналитика по месяцам
- Импорт/экспорт JSON, импорт Excel (`молия СВОЙ.xlsx`)
- PWA: офлайн, Add to Home Screen
- Языки: узбекский / русский

## Данные

localStorage keys:

- `moliya_transactions`
- `moliya_debts`
- `moliya_settings`

В облаке (Firestore) данные лежат в:

- `users/{uid}/transactions/{id}`
- `users/{uid}/debts/{id}`
- `users/{uid}/meta/settings`

## Настройка Firebase (один раз)

1. Зайдите на [console.firebase.google.com](https://console.firebase.google.com) и создайте проект (Google Analytics можно выключить).
2. **Authentication** → Get started → вкладка **Sign-in method** → включите **Google**.
3. **Firestore Database** → Create database → режим **Production**, регион любой (например `europe-west1`).
4. Во вкладке **Rules** Firestore вставьте и опубликуйте:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Project settings (шестерёнка) → **Your apps** → добавьте **Web app** (`</>`) → скопируйте значения `firebaseConfig`.
6. Скопируйте `.env.example` в `.env.local` и вставьте значения:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

7. Для Vercel: добавьте те же 6 переменных в Settings → Environment Variables и сделайте redeploy. Также в Firebase: Authentication → Settings → **Authorized domains** → добавьте домен приложения на Vercel.

После этого в приложении: **Настройки → Облако и синхронизация → Войти через Google**. При первом входе локальные данные автоматически загрузятся в облако; дальше всё синхронизируется само (работает и офлайн — изменения отправятся при появлении сети).
