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

## Настройка Firebase

Проект: **moliya-s** (номер `376723011011`).

Уже сделано в коде/CLI:
- Web app `MoliyaS` зарегистрирован
- `.env.local` с ключами Firebase
- Firestore `(default)` создан (регион `eur3`)
- Security rules задеплоены (`firestore.rules`)

Осталось вручную (1 минута) — без биллинга Google Sign-in включается только в консоли:

1. Откройте [Authentication → Sign-in method](https://console.firebase.google.com/project/moliya-s/authentication/providers)
2. Нажмите **Get started** (если впервые)
3. Включите провайдер **Google** → Save

Для Vercel: добавьте 6 переменных из `.env.example` / `.env.local` в Settings → Environment Variables и сделайте redeploy. В Firebase → Authentication → Settings → **Authorized domains** добавьте домен Vercel.

После этого в приложении: **Настройки → Облако и синхронизация → Войти через Google**.
