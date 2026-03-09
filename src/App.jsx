import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import KanbanBoard from './pages/KanbanBoard'
import Analytics from './pages/Analytics'
import ResumeVault from './pages/ResumeVault'
import Diary from './pages/Diary'
import OfferMatrix from './pages/OfferMatrix'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)
  useEffect(() => { initAuth() }, [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="board" element={<KanbanBoard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="vault" element={<ResumeVault />} />
          <Route path="resilience" element={<Diary />} />
          <Route path="offers" element={<OfferMatrix />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
