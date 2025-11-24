import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init as initSDK } from '@tma.js/sdk-react'
import App from './App.tsx'
import './index.css'

// Initialize SDK
initSDK();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
