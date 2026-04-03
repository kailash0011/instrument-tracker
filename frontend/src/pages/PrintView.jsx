import { useState, useEffect } from 'react'
import api from '../api/axios'

const STATUS_LABELS = {
  normal: 'Normal',
  damage: 'Damage',
  malfunction: 'Malfunction',
  send_to_repair: 'Send to Repair'
}

export default function PrintView() {
  const [departments, setDepartments] = useState([])
  const [deptId, setDeptId] = useState('')
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data)).catch(console.error)
  }, [])

  async function loadData() {
    if (!deptId || !yearMonth) {
      setError('Please select department and month')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.get('/export/print', {
        params: { department_id: deptId, year_month: yearMonth }
      })
      setData(res.data)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="print:hidden mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Print View</h1>
        <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={deptId}
              onChange={e => setDeptId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Department --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={yearMonth}
              onChange={e => setYearMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Data'}
          </button>
          {data && (
            <button
              onClick={() => window.print()}
              className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              🖨️ Print
            </button>
          )}
        </div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>

      {data && (
        <div className="bg-white p-6 rounded-xl shadow print:shadow-none print:rounded-none">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">OT Instrument Tracker</h2>
            <p className="text-gray-600">{data.dept?.name} — {data.year_month}</p>
          </div>

          {data.sessions.length === 0 ? (
            <p className="text-center text-gray-400">No submitted sessions for this period.</p>
          ) : (
            data.sessions.map(session => (
              <div key={session.id} className="mb-8">
                <div className="flex justify-between items-center mb-2 bg-gray-100 px-3 py-2 rounded">
                  <span className="font-semibold capitalize">{session.date} — {session.shift} shift</span>
                  <span className="text-sm text-gray-500">By: {session.submitted_by_name || '-'}</span>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-1 pr-2">Instrument</th>
                      <th className="text-center py-1 px-2">Expected</th>
                      <th className="text-center py-1 px-2">Actual</th>
                      <th className="text-left py-1 px-2">Status</th>
                      <th className="text-left py-1 px-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.entries.map(entry => (
                      <tr key={entry.id} className={`border-b ${entry.actual_count !== entry.expected_quantity ? 'bg-yellow-50' : ''}`}>
                        <td className="py-1 pr-2">{entry.instrument_name}</td>
                        <td className="py-1 px-2 text-center">{entry.expected_quantity}</td>
                        <td className={`py-1 px-2 text-center font-medium ${entry.actual_count !== entry.expected_quantity ? 'text-red-600' : 'text-green-700'}`}>
                          {entry.actual_count}
                        </td>
                        <td className="py-1 px-2">{STATUS_LABELS[entry.status] || entry.status}</td>
                        <td className="py-1 px-2 text-gray-500">{entry.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
