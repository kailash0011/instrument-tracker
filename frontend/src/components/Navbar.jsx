import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 10-1.061-1.061l-1.59 1.59z" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-700 dark:bg-slate-900 dark:border-b dark:border-slate-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-white rounded">
            🏥 OT Instrument Tracker
          </Link>

          {/* Clock */}
          <span className="hidden md:block text-indigo-200 dark:text-slate-400 text-sm font-mono">{nepalTime} NPT</span>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="hover:text-indigo-200 dark:hover:text-slate-300 transition text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-1">Dashboard</Link>
            <Link to="/count" className="hover:text-indigo-200 dark:hover:text-slate-300 transition text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-1">Count</Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/instruments" className="hover:text-indigo-200 dark:hover:text-slate-300 transition text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-1">Instruments</Link>
                <Link to="/admin/staff" className="hover:text-indigo-200 dark:hover:text-slate-300 transition text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-1">Staff</Link>
                <Link to="/admin/export" className="hover:text-indigo-200 dark:hover:text-slate-300 transition text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-1">Export</Link>
                <Link to="/admin/print" className="hover:text-indigo-200 dark:hover:text-slate-300 transition text-sm focus:outline-none focus:ring-2 focus:ring-white rounded px-1">Print</Link>
              </>
            )}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-indigo-200 dark:text-slate-400">{user?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user?.role === 'admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-indigo-500 dark:bg-slate-700 text-white'}`}>
                {user?.role}
              </span>
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-1.5 rounded-lg text-indigo-200 dark:text-slate-400 hover:bg-indigo-600 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-white"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition focus:outline-none focus:ring-2 focus:ring-white"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-lg text-indigo-200 dark:text-slate-400 hover:bg-indigo-600 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-white"
            >
              <div className="space-y-1" aria-hidden="true">
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-6 h-0.5 bg-white"></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <div className="text-indigo-200 dark:text-slate-400 text-sm font-mono py-1">{nepalTime} NPT</div>
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200 dark:hover:text-slate-300">Dashboard</Link>
            <Link to="/count" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200 dark:hover:text-slate-300">Count</Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/instruments" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200 dark:hover:text-slate-300">Instruments</Link>
                <Link to="/admin/staff" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200 dark:hover:text-slate-300">Staff</Link>
                <Link to="/admin/export" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200 dark:hover:text-slate-300">Export</Link>
                <Link to="/admin/print" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-indigo-200 dark:hover:text-slate-300">Print</Link>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-indigo-200 dark:text-slate-400">{user?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user?.role === 'admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-indigo-500 dark:bg-slate-700 text-white'}`}>
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
