import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function ManageInstruments() {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [instruments, setInstruments] = useState([])
  const [newDeptName, setNewDeptName] = useState('')
  const [newInst, setNewInst] = useState({ name: '', expected_quantity: 1 })
  const [editDept, setEditDept] = useState(null)
  const [editInst, setEditInst] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function toast(msg, isError = false) {
    if (isError) setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  async function loadDepartments() {
    const res = await api.get('/departments')
    setDepartments(res.data)
  }

  async function loadInstruments(deptId) {
    const res = await api.get(`/instruments?department_id=${deptId}`)
    setInstruments(res.data)
  }

  useEffect(() => { loadDepartments() }, [])
  useEffect(() => {
    if (selectedDept) loadInstruments(selectedDept.id)
  }, [selectedDept])

  async function addDept() {
    if (!newDeptName.trim()) return
    try {
      await api.post('/departments', { name: newDeptName })
      setNewDeptName('')
      loadDepartments()
      toast('Department added')
    } catch (err) { toast(err.response?.data?.error || 'Error', true) }
  }

  async function updateDept(dept) {
    try {
      await api.put(`/departments/${dept.id}`, { name: editDept.name })
      setEditDept(null)
      loadDepartments()
      if (selectedDept?.id === dept.id) setSelectedDept({ ...selectedDept, name: editDept.name })
      toast('Department updated')
    } catch (err) { toast(err.response?.data?.error || 'Error', true) }
  }

  async function deleteDept(dept) {
    if (!window.confirm(`Delete department "${dept.name}"? This will also delete all its instruments and sessions.`)) return
    try {
      await api.delete(`/departments/${dept.id}`)
      if (selectedDept?.id === dept.id) { setSelectedDept(null); setInstruments([]) }
      loadDepartments()
      toast('Department deleted')
    } catch (err) { toast(err.response?.data?.error || 'Error', true) }
  }

  async function addInstrument() {
    if (!newInst.name.trim() || !selectedDept) return
    try {
      await api.post('/instruments', {
        name: newInst.name,
        expected_quantity: parseInt(newInst.expected_quantity),
        department_id: selectedDept.id
      })
      setNewInst({ name: '', expected_quantity: 1 })
      loadInstruments(selectedDept.id)
      toast('Instrument added')
    } catch (err) { toast(err.response?.data?.error || 'Error', true) }
  }

  async function updateInstrument() {
    try {
      await api.put(`/instruments/${editInst.id}`, {
        name: editInst.name,
        expected_quantity: parseInt(editInst.expected_quantity),
        department_id: selectedDept.id
      })
      setEditInst(null)
      loadInstruments(selectedDept.id)
      toast('Instrument updated')
    } catch (err) { toast(err.response?.data?.error || 'Error', true) }
  }

  async function deleteInstrument(inst) {
    if (!window.confirm(`Delete instrument "${inst.name}"?`)) return
    try {
      await api.delete(`/instruments/${inst.id}`)
      loadInstruments(selectedDept.id)
      toast('Instrument deleted')
    } catch (err) { toast(err.response?.data?.error || 'Error', true) }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Instruments</h1>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Departments */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Departments</h2>
          <div className="space-y-2 mb-4">
            {departments.map(dept => (
              <div key={dept.id} className={`border rounded-lg p-2 cursor-pointer transition ${selectedDept?.id === dept.id ? 'border-indigo-400 bg-indigo-50' : 'hover:bg-gray-50'}`}>
                {editDept?.id === dept.id ? (
                  <div className="flex gap-1">
                    <input
                      value={editDept.name}
                      onChange={e => setEditDept({ ...editDept, name: e.target.value })}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                    <button onClick={() => updateDept(dept)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Save</button>
                    <button onClick={() => setEditDept(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between" onClick={() => setSelectedDept(dept)}>
                    <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditDept({ ...dept })} className="text-xs text-indigo-500 hover:text-indigo-700 px-1">✏️</button>
                      <button onClick={() => deleteDept(dept)} className="text-xs text-red-500 hover:text-red-700 px-1">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              placeholder="New department"
              className="flex-1 border rounded px-2 py-1 text-sm"
              onKeyDown={e => e.key === 'Enter' && addDept()}
            />
            <button onClick={addDept} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Add</button>
          </div>
        </div>

        {/* Right: Instruments */}
        <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
          {!selectedDept ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              Select a department to manage instruments
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Instruments — {selectedDept.name}</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-600">Name</th>
                      <th className="text-left py-2 text-gray-600">Expected Qty</th>
                      <th className="text-left py-2 text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instruments.map(inst => (
                      <tr key={inst.id} className="border-b hover:bg-gray-50">
                        {editInst?.id === inst.id ? (
                          <>
                            <td className="py-2 pr-2">
                              <input
                                value={editInst.name}
                                onChange={e => setEditInst({ ...editInst, name: e.target.value })}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                value={editInst.expected_quantity}
                                onChange={e => setEditInst({ ...editInst, expected_quantity: e.target.value })}
                                className="w-20 border rounded px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="py-2">
                              <button onClick={updateInstrument} className="text-xs bg-green-500 text-white px-2 py-1 rounded mr-1">Save</button>
                              <button onClick={() => setEditInst(null)} className="text-xs bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2">{inst.name}</td>
                            <td className="py-2">{inst.expected_quantity}</td>
                            <td className="py-2">
                              <button onClick={() => setEditInst({ ...inst })} className="text-indigo-500 hover:text-indigo-700 mr-2 text-xs">✏️ Edit</button>
                              <button onClick={() => deleteInstrument(inst)} className="text-red-500 hover:text-red-700 text-xs">🗑️ Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add instrument */}
              <div className="flex gap-2 mt-4">
                <input
                  value={newInst.name}
                  onChange={e => setNewInst({ ...newInst, name: e.target.value })}
                  placeholder="Instrument name"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  value={newInst.expected_quantity}
                  onChange={e => setNewInst({ ...newInst, expected_quantity: e.target.value })}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  min="1"
                />
                <button onClick={addInstrument} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Add</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
