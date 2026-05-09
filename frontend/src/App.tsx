import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import MyPlantsPage from './pages/MyPlantsPage'
import CareJournalPage from './pages/CareJournalPage'
import CatalogPage from './pages/CatalogPage'
import DiagnosticsPage from './pages/DiagnosticsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/plants" replace />} />
        <Route path="plants" element={<MyPlantsPage />} />
        <Route path="journal" element={<CareJournalPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="diagnostics" element={<DiagnosticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/plants" replace />} />
    </Routes>
  )
}
