import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Count from './pages/Count'
import ManageInstruments from './pages/ManageInstruments'
import ManageStaff from './pages/ManageStaff'
import Export from './pages/Export'
import PrintView from './pages/PrintView'
import { useAuth } from './contexts/AuthContext'

function AppLayout({ children }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      <main className={user ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/count" element={<ProtectedRoute><Count /></ProtectedRoute>} />
            <Route path="/admin/instruments" element={<ProtectedRoute adminOnly><ManageInstruments /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute adminOnly><ManageStaff /></ProtectedRoute>} />
            <Route path="/admin/export" element={<ProtectedRoute adminOnly><Export /></ProtectedRoute>} />
            <Route path="/admin/print" element={<ProtectedRoute adminOnly><PrintView /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}
