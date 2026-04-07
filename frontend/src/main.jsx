import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#272431',
            color: '#f5eefc',
            border: '1px solid rgba(120,115,127,0.25)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#a0fff0', secondary: '#0f0d16' } },
          error: { iconTheme: { primary: '#ff6e84', secondary: '#0f0d16' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
