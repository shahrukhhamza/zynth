import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { TimezoneProvider } from './contexts/TimezoneContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ConfirmProvider } from './contexts/ConfirmContext.jsx'
import ReactGA from 'react-ga4'
import './index.css'

// Replace with your real GA4 Measurement ID (format: G-XXXXXXXXXX)
ReactGA.initialize('G-DQP2DPX3P2')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <TimezoneProvider>
        <ToastProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ToastProvider>
      </TimezoneProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
