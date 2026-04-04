import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function ManageStaff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Staff</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-gray-600">Username</th>
              <th className="text-left px-4 py-3 text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 text-gray-600">Action</th>
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
                    <button
                      onClick={() => toggleBlock(member)}
                      className={`text-xs font-semibold px-3 py-1 rounded transition ${member.is_blocked ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                      {member.is_blocked ? 'Unblock' : 'Block'}
                    </button>
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
