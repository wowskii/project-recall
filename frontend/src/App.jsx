import { useEffect, useState, useMemo } from 'react'
import './App.css'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

function formatClock(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, '0')
  const sec = String(seconds % 60).padStart(2, '0')
  return `${min}:${sec}`
}

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mode, setMode] = useState('work') // work | break
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [isRunning, setIsRunning] = useState(false)

  // New task form
  const [newTitle, setNewTitle] = useState('')
  const [newProjectId, setNewProjectId] = useState(1)
  const [newXpValue, setNewXpValue] = useState(100)

  const loadTasks = async () => {
    try {
      setLoading(true)
      const resp = await fetch('http://localhost:8000/tasks')
      if (!resp.ok) throw new Error('Network error fetching tasks')

      const payload = await resp.json()
      if (!payload.tasks || !Array.isArray(payload.tasks)) throw new Error('Invalid payload')

      const backendTasks = payload.tasks.map((task) => ({
        id: task.id,
        title: task.title || 'Untitled task',
        status: task.status || 'todo',
        xp_value: task.xp_value || 100,
      }))

      setTasks(backendTasks)
      setError('')
    } catch (err) {
      console.warn(err)
      setError('Could not load tasks from API.')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextMode = mode === 'work' ? 'break' : 'work'
          setMode(nextMode)
          setIsRunning(false)
          return nextMode === 'work' ? WORK_SECONDS : BREAK_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, mode])

  const completedCount = useMemo(() => tasks.filter((task) => task.status === 'done').length, [tasks])

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const newStatus = task.status === 'done' ? 'todo' : 'done'

    try {
      const resp = await fetch(`http://localhost:8000/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus),
      })
      if (!resp.ok) throw new Error('Failed to update task')

      await loadTasks() // Reload tasks
    } catch (err) {
      console.error(err)
      setError('Failed to update task status to ' + newStatus)
    }
  }

  const createTask = async () => {
    if (!newTitle.trim()) return

    try {
      const resp = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          title: newTitle,
          project_id: newProjectId,
          xp_value: newXpValue,
        }),
      })
      if (!resp.ok) throw new Error('Failed to create task')

      setNewTitle('')
      setNewProjectId(1)
      setNewXpValue(100)
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error(err)
      setError('Failed to create task.')
    }
  }

  const deleteTask = async (id) => {
    try {
      const resp = await fetch(`http://localhost:8000/tasks/${id}`, {
        method: 'DELETE',
      })
      if (!resp.ok) throw new Error('Failed to delete task')

      await loadTasks() // Reload tasks
    } catch (err) {
      console.error(err)
      setError('Failed to delete task.')
    }
  }

  const startPause = () => setIsRunning((p) => !p)
  const resetTimer = () => {
    setIsRunning(false)
    setMode('work')
    setSecondsLeft(WORK_SECONDS)
  }

  return (
    <main className="pomodoro-page">
      <header>
        <h1>Project Recall Pomodoro</h1>
        <p>
          Work mode: <b>{mode.toUpperCase()}</b> · {completedCount} / {tasks.length}{' '}
          tasks completed
        </p>
        {error && <p className="error">{error}</p>}
      </header>

      <section className="timer-card">
        <div className="time-display">{formatClock(secondsLeft)}</div>
        <div className="timer-controls">
          <button className="btn" onClick={startPause}>
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button className="btn" onClick={resetTimer}>
            Reset
          </button>
        </div>
        <div className="guide-text">
          {isRunning
            ? 'Focus on your task until the timer ends.'
            : 'Press start to begin the timer.'}
        </div>
      </section>

      <section className="tasks-card">
        <h2>Task list</h2>

        {loading ? (
          <p>Loading tasks...</p>
        ) : (
          <ul className="tasks-list">
            {tasks.map((task) => (
              <li key={task.id} className={task.status === 'done' ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => toggleTask(task.id)}
                  />
                  {task.title} (XP: {task.xp_value})
                </label>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="create-task">
          <h3>Create New Task</h3>
          <input
            type="text"
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="number"
            placeholder="Project ID"
            value={newProjectId}
            onChange={(e) => setNewProjectId(Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="XP Value"
            value={newXpValue}
            onChange={(e) => setNewXpValue(Number(e.target.value))}
          />
          <button className="btn" onClick={createTask}>
            Create Task
          </button>
        </div>
      </section>
    </main>
  )
}

export default App

