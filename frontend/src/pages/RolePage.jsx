import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './RoleSelection.css'

function RolePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState('')
  const { roleId } = useParams()
  const [role, setRole] = useState(null)

  const fetchRoleData = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/roles/${roleId}`)
      if (!resp.ok) throw new Error('Failed to fetch role data')
      const payload = await resp.json()
      setRole(payload.role)
    } catch (err) {
      console.error(err)
      setError('Could not load role data from API.')
    }
  }

  // Load projects from backend
  const loadProjects = async () => {
    try {
      setLoading(true)
      const resp = await fetch('http://localhost:8000/projects')
      if (!resp.ok) throw new Error('Failed to fetch projects')
      const payload = await resp.json()
      setProjects(payload.projects || [])
      setError('')
    } catch (err) {
      console.error(err)
      setError('Could not load projects from API.')
      // Set placeholder projects if API fails
      setProjects([
        { id: 1, title: 'Project 1', description: 'Description 1', status: 'active', icon: '💻', icon_name: 'code' },
        { id: 2, title: 'Project 2', description: 'Description 2', status: 'active', icon: '🎨', icon_name: 'palette' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoleData()
    loadProjects()
  }, [])

  const selectProject = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const resp = await fetch('http://localhost:8000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: newProjectName,
          color_hex: '#f99e1a',
          icon_name: 'shield',
        }),
      })
      if (!resp.ok) throw new Error('Failed to create project')
      setNewProjectName('')
      await loadProjects()
    } catch (err) {
      console.error(err)
      setError('Failed to create project.')
    }
  }

  const handleDeleteProject = async (projectId) => {
    try {
      const resp = await fetch(`http://localhost:8000/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (!resp.ok) throw new Error('Failed to delete project')
      setConfirmDelete(null)
      await loadProjects()
    } catch (err) {
      console.error(err)
      setError('Failed to delete project.')
    }
  }

  const handleRetireProject = async (projectId) => {
    try {
      const resp = await fetch(`http://localhost:8000/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('inactive'),
      })
      if (!resp.ok) throw new Error('Failed to retire project ')
      await loadProjects()
    } catch (err) {
      console.error(err)
      setError('Failed to retire project.')
    }
  }

  const activeProjects = projects.filter((p) => p.status === 'active')
  const inactiveProjects = projects.filter((p) => p.status !== 'active')

  if (loading && !editMode) {
    return (
      <main className="role-selection-page">
        <p>Loading projects...</p>
      </main>
    )
  }

  if (!editMode) {
    // Normal selection mode
    return (
      <main className="role-selection-page">
        <header>
          <h1>Welcome to the {role.name} role</h1>
          <p>Select a project</p>
          {error && <p className="error">{error}</p>}
          <button className="btn-edit" onClick={() => setEditMode(true)}>
            Edit
          </button>
        </header>

        <section className="projects-grid">
          {activeProjects.map((project) => (
            <div key={project.id} className="project-card" onClick={() => selectProject(project.id)}>
              <div className="project-icon">
                {project.icon}
              </div>
              <div className="project-name">{project.title}</div>
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
          <button className="btn-add-project" onClick={() => handleAddProject()}>
            + Add Project
          </button>
          <div className="add-project-form">
            <input
              type="text"
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
            />
          </div>
        </div>
        <h1>Edit Projects</h1>
        <button className="btn-confirm" onClick={() => setEditMode(false)}>
          ✓ Confirm Changes
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {/* Active Projects */}
      <section className="edit-section">
        <h2>Active Projects</h2>
        <div className="projects-grid-edit">
          {activeProjects.map((project) => (
            <div key={project.id} className="project-card-edit">
              <div className="project-card-header">
                <button
                  className="btn-delete"
                  onClick={() => setConfirmDelete(project.id)}
                  title="Delete project"
                >
                  ✕
                </button>
              </div>
              <div className="project-icon">
                {project.icon}
              </div>
              <div className="project-name">{project.title}</div>
              <button
                className="btn-retire"
                onClick={() => handleRetireProject(project.id)}
              >
                Retire
              </button>

              {confirmDelete === project.id && (
                <div className="confirm-overlay">
                  <div className="confirm-box">
                    <p>Delete this project permanently?</p>
                    <div className="confirm-buttons">
                      <button
                        className="btn-confirm-yes"
                        onClick={() => handleDeleteProject(project.id)}
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

      {/* Inactive Projects */}
      {inactiveProjects.length > 0 && (
        <>
          <div className="separator"></div>
          <section className="edit-section">
            <h2>Inactive Projects</h2>
            <div className="projects-grid-edit">
              {inactiveProjects.map((project) => (
                <div key={project.id} className="project-card-edit inactive">
                  <div className="project-card-header">
                    <button
                      className="btn-delete"
                      onClick={() => setConfirmDelete(project.id)}
                      title="Delete project"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="project-icon">
                    {project.icon}
                  </div>
                  <div className="project-name">{project.title}</div>
                  <button
                    className="btn-reactivate"
                    onClick={() => handleRetireProject(project.id)}
                  >
                    Reactivate
                  </button>

                  {confirmDelete === project.id && (
                    <div className="confirm-overlay">
                      <div className="confirm-box">
                        <p>Delete this project permanently?</p>
                        <div className="confirm-buttons">
                          <button
                            className="btn-confirm-yes"
                            onClick={() => handleDeleteProject(project.id)}
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

export default RolePage