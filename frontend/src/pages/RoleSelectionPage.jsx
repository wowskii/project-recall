import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './RoleSelection.css'

function RoleSelectionPage() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState('')

  // Load roles from backend
  const loadRoles = async () => {
    try {
      setLoading(true)
      const resp = await fetch('http://localhost:8000/roles')
      if (!resp.ok) throw new Error('Failed to fetch roles')
      const payload = await resp.json()
      setRoles(payload.roles || [])
      setError('')
    } catch (err) {
      console.error(err)
      setError('Could not load roles from API.')
      // Set placeholder roles if API fails
      setRoles([
        { id: 1, name: 'Developer', icon: '💻', role_status: 'active', icon_name: 'code' },
        { id: 2, name: 'Musician', icon: '🎨', role_status: 'active', icon_name: 'palette' },
        { id: 3, name: 'Manager', icon: '📊', role_status: 'active', icon_name: 'chart' },
        { id: 4, name: 'Student', icon: '📚', role_status: 'active', icon_name: 'book' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const selectRole = () => {
    navigate('/pomodoro')
  }

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return

    try {
      const resp = await fetch('http://localhost:8000/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: newRoleName,
          color_hex: '#f99e1a',
          icon_name: 'shield',
        }),
      })
      if (!resp.ok) throw new Error('Failed to create role')
      setNewRoleName('')
      await loadRoles()
    } catch (err) {
      console.error(err)
      setError('Failed to create role.')
    }
  }

  const handleDeleteRole = async (roleId) => {
    try {
      const resp = await fetch(`http://localhost:8000/roles/${roleId}`, {
        method: 'DELETE',
      })
      if (!resp.ok) throw new Error('Failed to delete role')
      setConfirmDelete(null)
      await loadRoles()
    } catch (err) {
      console.error(err)
      setError('Failed to delete role.')
    }
  }

  const handleRetireRole = async (roleId) => {
    try {
      const resp = await fetch(`http://localhost:8000/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('inactive'),
      })
      if (!resp.ok) throw new Error('Failed to retire role')
      await loadRoles()
    } catch (err) {
      console.error(err)
      setError('Failed to retire role.')
    }
  }

  const activeRoles = roles.filter((r) => r.role_status === 'active')
  const inactiveRoles = roles.filter((r) => r.role_status !== 'active')

  if (loading && !editMode) {
    return (
      <main className="role-selection-page">
        <p>Loading roles...</p>
      </main>
    )
  }

  if (!editMode) {
    // Normal selection mode
    return (
      <main className="role-selection-page">
        <header>
          <h1>Welcome to Project Recall</h1>
          <p>Select your role to get started</p>
          {error && <p className="error">{error}</p>}
          <button className="btn-edit" onClick={() => setEditMode(true)}>
            Edit
          </button>
        </header>

        <section className="roles-grid">
          {activeRoles.map((role) => (
            <div key={role.id} className="role-card" onClick={selectRole}>
              <div className="role-icon">
                {role.name === 'Developer' && '💻'}
                {role.name === 'Musician' && '🎨'}
                {role.name === 'Manager' && '📊'}
                {role.name === 'Student' && '📚'}
                {role.name === 'Recovery' && '➕'}
              </div>
              <div className="role-name">{role.name.toLocaleUpperCase()}</div>
            </div>
          ))}
        </section>
      </main>
    )
  }

  // Edit mode
  return (
    <main className="role-selection-page">
      <header className="edit-header">
        <div className="header-left">
          <button className="btn-add-role" onClick={() => handleAddRole()}>
            + Add Role
          </button>
          <div className="add-role-form">
            <input
              type="text"
              placeholder="New role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
            />
          </div>
        </div>
        <h1>Edit Roles</h1>
        <button className="btn-confirm" onClick={() => setEditMode(false)}>
          ✓ Confirm Changes
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {/* Active Roles */}
      <section className="edit-section">
        <h2>Active Roles</h2>
        <div className="roles-grid-edit">
          {activeRoles.map((role) => (
            <div key={role.id} className="role-card-edit">
              <div className="role-card-header">
                <button
                  className="btn-delete"
                  onClick={() => setConfirmDelete(role.id)}
                  title="Delete role"
                >
                  ✕
                </button>
              </div>
              <div className="role-icon">
                {role.name === 'Developer' && '💻'}
                {role.name === 'Musician' && '🎨'}
                {role.name === 'Manager' && '📊'}
                {role.name === 'Student' && '📚'}
                {role.name === 'Recovery' && '➕'}
              </div>
              <div className="role-name">{role.name.toLocaleUpperCase()}</div>
              <button
                className="btn-retire"
                onClick={() => handleRetireRole(role.id)}
              >
                Retire
              </button>

              {confirmDelete === role.id && (
                <div className="confirm-overlay">
                  <div className="confirm-box">
                    <p>Delete this role permanently?</p>
                    <div className="confirm-buttons">
                      <button
                        className="btn-confirm-yes"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="btn-confirm-no"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Inactive Roles */}
      {inactiveRoles.length > 0 && (
        <>
          <div className="separator"></div>
          <section className="edit-section">
            <h2>Inactive Roles</h2>
            <div className="roles-grid-edit">
              {inactiveRoles.map((role) => (
                <div key={role.id} className="role-card-edit inactive">
                  <div className="role-card-header">
                    <button
                      className="btn-delete"
                      onClick={() => setConfirmDelete(role.id)}
                      title="Delete role"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="role-icon">
                    {role.name === 'Developer' && '💻'}
                    {role.name === 'Musician' && '🎨'}
                    {role.name === 'Manager' && '📊'}
                    {role.name === 'Student' && '📚'}
                    {role.name === 'Recovery' && '➕'}
                  </div>
                  <div className="role-name">{role.name.toLocaleUpperCase()}</div>
                  <button
                    className="btn-reactivate"
                    onClick={() => handleRetireRole(role.id)}
                  >
                    Reactivate
                  </button>

                  {confirmDelete === role.id && (
                    <div className="confirm-overlay">
                      <div className="confirm-box">
                        <p>Delete this role permanently?</p>
                        <div className="confirm-buttons">
                          <button
                            className="btn-confirm-yes"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            Yes, Delete
                          </button>
                          <button
                            className="btn-confirm-no"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default RoleSelectionPage