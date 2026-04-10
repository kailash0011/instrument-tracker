import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { countService } from '../api/service'
import { useTheme } from '../contexts/ThemeContext'

const CHART_COLORS = ['#6366f1', '#f59e0b', '#f97316', '#ef4444']

const PIE_COLORS = {
  completed:   '#22c55e',
  in_progress: '#f59e0b',
  not_started: '#94a3b8',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nepalTime, setNepalTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setNepalTime(new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kathmandu',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await countService.dashboard()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30_000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="text-gray-500 dark:text-slate-400">Loading dashboard…</span>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-6 flex items-center gap-4" role="alert">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold">Could not load dashboard</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const stats = data?.stats || {}

  const statCards = [
    { label: 'Counts Today',   value: stats.total_counts   || 0, color: 'bg-indigo-500 dark:bg-indigo-600' },
    { label: 'Mismatches',     value: stats.mismatches     || 0, color: 'bg-amber-500 dark:bg-amber-600' },
    { label: 'Damage Items',   value: stats.damage_items   || 0, color: 'bg-orange-500 dark:bg-orange-600' },
    { label: 'Sent to Repair', value: stats.sent_to_repair || 0, color: 'bg-red-500 dark:bg-red-600' },
  ]

  const barChartData = statCards.map(c => ({ name: c.label, value: c.value }))

  const departments = data?.departments || []
  let completedCount = 0, inProgressCount = 0, notStartedCount = 0
  const shifts = ['morning', 'evening']
  departments.forEach(dept => {
    shifts.forEach(shift => {
      const session = dept[shift]
      if (!session) notStartedCount++
      else if (session.is_submitted) completedCount++
      else inProgressCount++
    })
  })

  const pieData = [
    { name: 'Completed',   value: completedCount,  color: PIE_COLORS.completed },
    { name: 'In Progress', value: inProgressCount, color: PIE_COLORS.in_progress },
    { name: 'Not Started', value: notStartedCount, color: PIE_COLORS.not_started },
  ].filter(d => d.value > 0)

  function getSessionStatusColor(session) {
    if (!session) return 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
    if (session.is_submitted) return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
    return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
  }

  function getSessionStatusText(session) {
    if (!session) return 'Not started'
    if (session.is_submitted) return '✓ Completed'
    return '⏳ In progress'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{nepalTime} (Nepal Time)</p>
      </div>

      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg p-3 mb-4 text-sm flex items-center gap-2" role="alert">
          <span>⚠️</span> {error} — showing cached data.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-4 shadow`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-4">{"Today's Summary"}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#6b7280' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: isDark ? '#f1f5f9' : '#111827',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barChartData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-4">Session Completion</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-slate-500 text-sm">
              No sessions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#6b7280' }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: isDark ? '#f1f5f9' : '#111827',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department status */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">Department Count Status — Today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">{dept.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                {['morning', 'evening'].map(shift => (
                  <button
                    key={shift}
                    onClick={() => navigate('/count')}
                    className={`border rounded-lg p-2 text-xs font-medium text-left transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getSessionStatusColor(dept[shift])}`}
                  >
                    <div className="capitalize font-semibold">{shift}</div>
                    <div className="mt-1">{getSessionStatusText(dept[shift])}</div>
                    {dept[shift]?.submitted_by_name && (
                      <div className="mt-0.5 text-xs opacity-70">{dept[shift].submitted_by_name}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-4">Recent Submitted Sessions</h2>
        {(data?.recent_sessions || []).length === 0 ? (
          <p className="text-gray-400 dark:text-slate-500 text-sm">No submitted sessions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Date</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Department</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Shift</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Submitted By</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sessions.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="py-2 text-gray-800 dark:text-slate-300">{s.date}</td>
                    <td className="py-2 text-gray-800 dark:text-slate-300">{s.dept_name}</td>
                    <td className="py-2 capitalize text-gray-800 dark:text-slate-300">{s.shift}</td>
                    <td className="py-2 text-gray-800 dark:text-slate-300">{s.submitted_by_name || '-'}</td>
                    <td className="py-2 text-xs text-gray-500 dark:text-slate-500">{s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mismatches */}
      {(data?.mismatches || []).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-4">⚠️ Mismatches Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Department</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Shift</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Instrument</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Expected</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Actual</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.mismatches.map((m, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    <td className="py-2 dark:text-slate-300">{m.dept_name}</td>
                    <td className="py-2 capitalize dark:text-slate-300">{m.shift}</td>
                    <td className="py-2 dark:text-slate-300">{m.instrument_name}</td>
                    <td className="py-2 text-green-700 dark:text-green-400 font-medium">{m.expected_quantity}</td>
                    <td className="py-2 text-red-600 dark:text-red-400 font-medium">{m.actual_count}</td>
                    <td className="py-2 text-gray-500 dark:text-slate-400">{m.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Damage Items */}
      {(data?.damage_items || []).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4">🔧 Damage Items Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Department</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Shift</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Instrument</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.damage_items.map((d, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <td className="py-2 dark:text-slate-300">{d.dept_name}</td>
                    <td className="py-2 capitalize dark:text-slate-300">{d.shift}</td>
                    <td className="py-2 dark:text-slate-300">{d.instrument_name}</td>
                    <td className="py-2 text-gray-500 dark:text-slate-400">{d.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sent to Repair */}
      {(data?.sent_to_repair || []).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">🛠️ Sent to Repair Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Department</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Shift</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Instrument</th>
                  <th className="text-left py-2 text-gray-600 dark:text-slate-400 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.sent_to_repair.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <td className="py-2 dark:text-slate-300">{s.dept_name}</td>
                    <td className="py-2 capitalize dark:text-slate-300">{s.shift}</td>
                    <td className="py-2 dark:text-slate-300">{s.instrument_name}</td>
                    <td className="py-2 text-gray-500 dark:text-slate-400">{s.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
