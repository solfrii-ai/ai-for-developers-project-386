import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminPrototype from './AdminPrototype'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/prototype/admin' ? <AdminPrototype /> : <App />}
  </StrictMode>,
)
