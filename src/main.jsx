import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { AuthProvider } from './contexts/AuthContext'
import { PlayerProvider } from './contexts/PlayerContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PlayerProvider>
        <RouterProvider router={router} />
      </PlayerProvider>
    </AuthProvider>
  </StrictMode>,
)
