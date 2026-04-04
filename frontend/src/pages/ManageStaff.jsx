import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function ManageStaff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resetResult, setResetResult] = useState(null)

  async function loadStaff() {
    try {
      const res = await api.get('/staff')
      setStaff(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStaff() }, [])

  async function toggleBlock(member) {
    const endpoint = member.is_blocked ? `/staff/${member.id}/unblock` : `/staff/${member.id}/block`
    try {
      const res = await api.put(endpoint)
      setStaff(prev => prev.map(s => s.id === member.id ? res.data : s))
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    }
  }

  async function resetPassword(member) {
    if (!window.confirm(`Reset password for ${member.name.replace(/[^\w\s]/g, '')}? A new temporary password will be generated.`)) return
    try {
      const res = await api.put(`/staff/${member.id}/reset-password`)
      setResetResult({ name: member.name, username: member.username, temp_password: res.data.temp_password })
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Staff</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {resetResult && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4">
          <div className="font-semibold text-yellow-800 mb-1">🔑 Temporary Password Generated</div>
          <p className="text-sm text-yellow-700 mb-2">Share this with <strong>{resetResult.name}</strong> ({resetResult.username}). They can log in with this password immediately.</p>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-yellow-100 border border-yellow-300 text-yellow-900 px-3 py-1 rounded text-base tracking-widest select-all">{resetResult.temp_password}</span>
            <button
              onClick={() => setResetResult(null)}
              className="text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-gray-600">Username</th>
              <th className="text-left px-4 py-3 text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No staff members found</td></tr>
            ) : (
              staff.map(member => (
                <tr key={member.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-gray-600">{member.username}</td>
                  <td className="px-4 py-3 text-gray-600">{member.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${member.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {member.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(member.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => toggleBlock(member)}
                        className={`text-xs font-semibold px-3 py-1 rounded transition ${member.is_blocked ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                      >
                        {member.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => resetPassword(member)}
                        className="text-xs font-semibold px-3 py-1 rounded transition bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
