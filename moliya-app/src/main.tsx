import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
// Запускает слушатель авторизации и облачную синхронизацию
import './store/authStore'
import { ensureDebtTxSync } from './store/debtStore'
import App from './App'

ensureDebtTxSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
