import './utils/axiosConfig'; // Import axios configuration first
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.jsx'

if (!import.meta.env.DEV) {
  const noop = () => {}
  console.log = noop
  console.warn = noop
  console.error = noop
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
