# Moliya — Shaxsiy moliya

Личная финансовая учётная система (PWA). Данные хранятся локально в браузере.

## Стек

- React + Vite + TypeScript
- Tailwind CSS
- Zustand + localStorage
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
