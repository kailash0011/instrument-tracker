import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
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

  async function fetchDashboard() {
    try {
      const res = await api.get('/counts/dashboard')
      setData(res.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const stats = data?.stats || {}

  const statusCards = [
    { label: 'Total Counts Today', value: stats.total_counts || 0, color: 'bg-blue-500' },
    { label: 'Total Mismatches', value: stats.mismatches || 0, color: 'bg-yellow-500' },
    { label: 'Damage Items', value: stats.damage_items || 0, color: 'bg-orange-500' },
    { label: 'Sent to Repair', value: stats.sent_to_repair || 0, color: 'bg-red-500' }
  ]

  function getSessionStatusColor(session) {
    if (!session) return 'bg-gray-100 border-gray-200 text-gray-400'
    if (session.is_submitted) return 'bg-green-100 border-green-300 text-green-700'
    return 'bg-yellow-100 border-yellow-300 text-yellow-700'
  }

  function getSessionStatusText(session) {
    if (!session) return 'Not started'
    if (session.is_submitted) return '✓ Completed'
    return '⏳ In progress'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Time header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{nepalTime} (Nepal Time)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statusCards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-4 shadow`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Department status */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Department Count Status — Today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.departments || []).map(dept => (
            <div key={dept.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{dept.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                {['morning', 'evening'].map(shift => (
                  <button
                    key={shift}
                    onClick={() => navigate('/count')}
                    className={`border rounded-lg p-2 text-xs font-medium text-left transition hover:opacity-80 ${getSessionStatusColor(dept[shift])}`}
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
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Submitted Sessions</h2>
        {(data?.recent_sessions || []).length === 0 ? (
          <p className="text-gray-400 text-sm">No submitted sessions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Date</th>
                  <th className="text-left py-2 text-gray-600">Department</th>
                  <th className="text-left py-2 text-gray-600">Shift</th>
                  <th className="text-left py-2 text-gray-600">Submitted By</th>
                  <th className="text-left py-2 text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sessions.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{s.date}</td>
                    <td className="py-2">{s.dept_name}</td>
                    <td className="py-2 capitalize">{s.shift}</td>
                    <td className="py-2">{s.submitted_by_name || '-'}</td>
                    <td className="py-2 text-xs text-gray-500">{s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mismatches */}
      {(data?.mismatches || []).length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-yellow-700 mb-4">⚠️ Mismatches Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Department</th>
                  <th className="text-left py-2 text-gray-600">Shift</th>
                  <th className="text-left py-2 text-gray-600">Instrument</th>
                  <th className="text-left py-2 text-gray-600">Expected</th>
                  <th className="text-left py-2 text-gray-600">Actual</th>
                  <th className="text-left py-2 text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.mismatches.map((m, i) => (
                  <tr key={i} className="border-b hover:bg-yellow-50">
                    <td className="py-2">{m.dept_name}</td>
                    <td className="py-2 capitalize">{m.shift}</td>
                    <td className="py-2">{m.instrument_name}</td>
                    <td className="py-2 text-green-700 font-medium">{m.expected_quantity}</td>
                    <td className="py-2 text-red-600 font-medium">{m.actual_count}</td>
                    <td className="py-2 text-gray-500">{m.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Damage Items */}
      {(data?.damage_items || []).length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-orange-700 mb-4">🔧 Damage Items Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Department</th>
                  <th className="text-left py-2 text-gray-600">Shift</th>
                  <th className="text-left py-2 text-gray-600">Instrument</th>
                  <th className="text-left py-2 text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.damage_items.map((d, i) => (
                  <tr key={i} className="border-b hover:bg-orange-50">
                    <td className="py-2">{d.dept_name}</td>
                    <td className="py-2 capitalize">{d.shift}</td>
                    <td className="py-2">{d.instrument_name}</td>
                    <td className="py-2 text-gray-500">{d.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sent to Repair */}
      {(data?.sent_to_repair || []).length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-4">🛠️ Sent to Repair Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Department</th>
                  <th className="text-left py-2 text-gray-600">Shift</th>
                  <th className="text-left py-2 text-gray-600">Instrument</th>
                  <th className="text-left py-2 text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.sent_to_repair.map((s, i) => (
                  <tr key={i} className="border-b hover:bg-red-50">
                    <td className="py-2">{s.dept_name}</td>
                    <td className="py-2 capitalize">{s.shift}</td>
                    <td className="py-2">{s.instrument_name}</td>
                    <td className="py-2 text-gray-500">{s.remarks || '-'}</td>
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
