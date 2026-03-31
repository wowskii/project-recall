import { useNavigate } from 'react-router-dom'
import './RoleSelection.css' // We'll create this CSS file

function RoleSelectionPage() {
  const navigate = useNavigate()

  const roles = [
    { id: 1, name: 'Developer', icon: '💻' },
    { id: 2, name: 'Musician', icon: '🎨' },
    { id: 3, name: 'Manager', icon: '📊' },
    { id: 4, name: 'Student', icon: '📚' },
    { id: 5, name: 'Recovery', icon: '➕' }
  ]

  const selectRole = () => {
    // For now, just navigate to pomodoro
    navigate('/pomodoro')
  }

  return (
    <main className="role-selection-page">
      <header>
        <h1>Welcome to Project Recall</h1>
        <p>Select your role to get started</p>
      </header>

      <section className="roles-grid">
        {roles.map((role) => (
          <div key={role.id} className="role-card" onClick={selectRole}>
            <div className="role-icon">{role.icon}</div>
            <button className="role-button">{role.name}</button>
          </div>
        ))}
      </section>
    </main>
  )
}

export default RoleSelectionPage