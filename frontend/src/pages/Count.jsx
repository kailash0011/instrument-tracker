import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

const STATUS_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'damage', label: 'Damage' },
  { value: 'malfunction', label: 'Malfunction' },
  { value: 'send_to_repair', label: 'Send to Repair' }
]

function getNepalHour() {
  return parseInt(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kathmandu' }))
}

function getActiveShift() {
  const hour = getNepalHour()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 20) return 'evening'
  return null
}

export default function Count() {
  const [nepalTime, setNepalTime] = useState('')
  const [selectedShift, setSelectedShift] = useState(null)
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [session, setSession] = useState(null)
  const [instruments, setInstruments] = useState([])
  const [entries, setEntries] = useState({})
  const [expandedRows, setExpandedRows] = useState({})
  const [search, setSearch] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkStatus, setCheckStatus] = useState(null)
  const saveTimers = useRef({})

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

  useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data)).catch(console.error)
    setSelectedShift(getActiveShift())
  }, [])

  function isShiftAllowed(shift) {
    const hour = getNepalHour()
    if (shift === 'morning') return hour >= 6 && hour < 12
    if (shift === 'evening') return hour >= 12 && hour < 20
    return false
  }

  async function handleStartCount() {
    if (!selectedShift || !selectedDept) {
      setError('Please select both shift and department')
      return
    }
    if (!isShiftAllowed(selectedShift)) {
      const windows = { morning: '06:00 AM – 12:00 PM', evening: '12:00 PM – 08:00 PM' }
      setError(`${selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)} shift is only accessible between ${windows[selectedShift]} Nepal time.`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const today = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kathmandu' }).split(',')[0]

      const checkRes = await api.post('/counts/check', {
        date: today,
        shift: selectedShift,
        department_id: parseInt(selectedDept)
      })
      setCheckStatus(checkRes.data)

      if (checkRes.data.is_submitted) {
        setIsSubmitted(true)
        if (checkRes.data.session) {
          const sessionRes = await api.get(`/counts/session/${checkRes.data.session.id}`)
          setSession(sessionRes.data)
          setInstruments(sessionRes.data.instruments || [])
          const initialEntries = {}
          sessionRes.data.instruments.forEach(inst => {
            initialEntries[inst.id] = { ...inst.entry }
          })
          setEntries(initialEntries)
        }
        return
      }

      const sessionRes = await api.post('/counts/session', {
        date: today,
        shift: selectedShift,
        department_id: parseInt(selectedDept)
      })
      const fullSession = await api.get(`/counts/session/${sessionRes.data.id}`)
      setSession(fullSession.data)
      setInstruments(fullSession.data.instruments || [])
      const initialEntries = {}
      fullSession.data.instruments.forEach(inst => {
        initialEntries[inst.id] = { ...inst.entry }
      })
      setEntries(initialEntries)
    } catch (err) {
      if (err.response?.data?.error === 'Session already submitted') {
        setError('This session has already been submitted.')
      } else {
        setError(err.response?.data?.error || 'Failed to start session')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveEntry(instrumentId) {
    if (!session || isSubmitted) return
    const entry = entries[instrumentId]
    if (!entry) return
    try {
      await api.put('/counts/entry', {
        session_id: session.id,
        instrument_id: instrumentId,
        actual_count: parseInt(entry.actual_count) || 0,
        status: entry.status || 'normal',
        remarks: entry.remarks || ''
      })
    } catch (err) {
      console.error('Save entry error:', err)
    }
  }

  function handleCountChange(instrumentId, field, value) {
    setEntries(prev => ({
      ...prev,
      [instrumentId]: { ...prev[instrumentId], [field]: value }
    }))

    if (saveTimers.current[instrumentId]) clearTimeout(saveTimers.current[instrumentId])
    saveTimers.current[instrumentId] = setTimeout(() => {
      saveEntry(instrumentId)
    }, 800)
  }

  async function handleSubmit() {
    if (!window.confirm('Are you sure you want to submit this count? This cannot be undone.')) return
    setSubmitLoading(true)
    try {
      // Save all pending entries first
      Object.keys(saveTimers.current).forEach(id => {
        clearTimeout(saveTimers.current[id])
        saveEntry(parseInt(id))
      })
      await api.post(`/counts/submit/${session.id}`)
      setIsSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Submit failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  function toggleExpand(instrumentId) {
    setExpandedRows(prev => ({ ...prev, [instrumentId]: !prev[instrumentId] }))
  }

  const filteredInstruments = instruments.filter(inst =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Instrument Count</h1>
        <span className="text-indigo-600 font-mono text-sm">{nepalTime} NPT</span>
      </div>

      {!session && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          {/* Shift selection */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Shift</h2>
          <div className="flex gap-4 mb-6">
            {['morning', 'evening'].map(shift => {
              const allowed = isShiftAllowed(shift)
              return (
              <button
                key={shift}
                onClick={() => setSelectedShift(shift)}
                className={`flex-1 py-3 rounded-xl font-semibold capitalize text-sm border-2 transition ${
                  selectedShift === shift
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : allowed
                    ? 'border-indigo-300 text-indigo-600 bg-indigo-50'
                    : 'border-gray-200 text-gray-400 bg-gray-50'
                }`}
              >
                {shift === 'morning' ? '🌅' : '🌆'} {shift}
                {allowed
                  ? <span className="ml-1 text-xs">(Active)</span>
                  : <span className="ml-1 text-xs text-gray-400">(Inactive)</span>}
              </button>
              )
            })}
          </div>

          {/* Department selection */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Select Department</h2>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          >
            <option value="">-- Select Department --</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          <button
            onClick={handleStartCount}
            disabled={loading || !selectedShift || !selectedDept}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Start Count'}
          </button>
        </div>
      )}

      {session && isSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="text-green-700 font-semibold text-lg mb-1">✅ Count Already Submitted</div>
          <p className="text-green-600 text-sm">
            {session.dept_name} - {session.shift} shift on {session.date} has been submitted.
          </p>
          {session.submitted_by_name && (
            <p className="text-green-500 text-xs mt-1">Submitted by: {session.submitted_by_name}</p>
          )}
        </div>
      )}

      {session && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{session.dept_name}</h2>
              <p className="text-sm text-gray-500 capitalize">{session.shift} shift — {session.date}</p>
            </div>
            {!isSubmitted && (
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
              >
                {submitLoading ? 'Submitting...' : 'Submit Count'}
              </button>
            )}
          </div>

          {/* Search */}
          {!isSubmitted && (
            <input
              type="text"
              placeholder="Search instruments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          <div className="space-y-3">
            {filteredInstruments.map(inst => {
              const entry = entries[inst.id] || { actual_count: '', status: 'normal', remarks: '' }
              const count = parseInt(entry.actual_count)
              const isMismatch = !isNaN(count) && entry.actual_count !== '' && count !== inst.expected_quantity
              const isExpanded = expandedRows[inst.id]

              return (
                <div key={inst.id} className={`border rounded-lg p-3 ${isMismatch ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex-1 text-sm font-medium text-gray-800">{inst.name}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Expected: {inst.expected_quantity}</span>
                    {isSubmitted ? (
                      <span className="text-sm font-semibold w-16 text-center">{entry.actual_count}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={entry.actual_count}
                        onChange={e => {
                          handleCountChange(inst.id, 'actual_count', e.target.value)
                          if (parseInt(e.target.value) !== inst.expected_quantity && e.target.value !== '') {
                            setExpandedRows(prev => ({ ...prev, [inst.id]: true }))
                          }
                        }}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  {isMismatch && (
                    <div className="mt-2 text-xs text-red-600 font-medium">
                      ⚠️ Expected: {inst.expected_quantity} | Counted: {count}
                    </div>
                  )}

                  {(isMismatch || isExpanded || entry.status !== 'normal' || entry.remarks) && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        {isSubmitted ? (
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${entry.status === 'normal' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {STATUS_OPTIONS.find(s => s.value === entry.status)?.label || entry.status}
                          </span>
                        ) : (
                          <select
                            value={entry.status}
                            onChange={e => handleCountChange(inst.id, 'status', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Remarks</label>
                        {isSubmitted ? (
                          <span className="text-xs text-gray-600">{entry.remarks || '-'}</span>
                        ) : (
                          <textarea
                            value={entry.remarks}
                            onChange={e => handleCountChange(inst.id, 'remarks', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={2}
                            placeholder="Add remarks..."
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {!isSubmitted && !isMismatch && (
                    <button
                      onClick={() => toggleExpand(inst.id)}
                      className="mt-2 text-xs text-indigo-500 hover:text-indigo-700"
                    >
                      {isExpanded ? 'Hide details ▲' : 'Add remarks/status ▼'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {!isSubmitted && (
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {submitLoading ? 'Submitting...' : '✓ Submit Count'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
