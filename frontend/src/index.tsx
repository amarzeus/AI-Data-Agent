import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Get the root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Create React root and render
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
