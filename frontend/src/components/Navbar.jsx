import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [nepalTime, setNepalTime] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const tick = () => {
      setNepalTime(new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kathmandu',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            🏥 OT Instrument Tracker
          </Link>

          {/* Clock */}
          <span className="hidden md:block text-indigo-200 text-sm font-mono">{nepalTime} NPT</span>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="hover:text-indigo-200 transition text-sm">Dashboard</Link>
            <Link to="/count" className="hover:text-indigo-200 transition text-sm">Count</Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/instruments" className="hover:text-indigo-200 transition text-sm">Instruments</Link>
                <Link to="/admin/staff" className="hover:text-indigo-200 transition text-sm">Staff</Link>
                <Link to="/admin/export" className="hover:text-indigo-200 transition text-sm">Export</Link>
                <Link to="/admin/print" className="hover:text-indigo-200 transition text-sm">Print</Link>
              </>
            )}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-indigo-200">{user?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user?.role === 'admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-indigo-500 text-white'}`}>
                {user?.role}
              </span>
              <button onClick={handleLogout} className="ml-2 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition">
                Logout
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded focus:outline-none">
            <div className="space-y-1">
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <div className="text-indigo-200 text-sm font-mono py-1">{nepalTime} NPT</div>
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200">Dashboard</Link>
            <Link to="/count" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200">Count</Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/instruments" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200">Instruments</Link>
                <Link to="/admin/staff" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200">Staff</Link>
                <Link to="/admin/export" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200">Export</Link>
                <Link to="/admin/print" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200">Print</Link>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-indigo-200">{user?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user?.role === 'admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-indigo-500 text-white'}`}>
                {user?.role}
              </span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
