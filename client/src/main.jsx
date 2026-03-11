import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { TimezoneProvider } from './contexts/TimezoneContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <TimezoneProvider>
        <App />
      </TimezoneProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
