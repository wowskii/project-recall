import { useEffect, useState, useMemo } from 'react'
import './App.css'

const PLACEHOLDER_TASKS = [
  { id: 1, title: 'Review mission brief', done: false },
  { id: 2, title: 'Prepare strategy notes', done: false },
  { id: 3, title: 'Set up environment', done: false },
  { id: 4, title: 'Write story + XP goals', done: false },
]

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

function formatClock(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, '0')
  const sec = String(seconds % 60).padStart(2, '0')
  return `${min}:${sec}`
}

function App() {
  const [tasks, setTasks] = useState(PLACEHOLDER_TASKS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mode, setMode] = useState('work') // work | break
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    async function loadTasks() {
      try {
        const resp = await fetch('http://localhost:8000/tasks')
        if (!resp.ok) throw new Error('Network error fetching tasks')

        const payload = await resp.json()
        if (!payload.tasks || !Array.isArray(payload.tasks)) throw new Error('Invalid payload')

        const backendTasks = payload.tasks.map((task) => ({
          id: task.id,
          title: task.title || 'Untitled task',
          done: task.status === 'done',
        }))

        if (backendTasks.length === 0) {
          throw new Error('No tasks found from backend; using placeholders')
        }

        setTasks(backendTasks)
      } catch (err) {
        console.warn(err)
        setError('Could not load tasks from API; using placeholders.')
        setTasks(PLACEHOLDER_TASKS)
      } finally {
        setLoading(false)
      }
    }

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

  const completedCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks])

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    )
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
              <li key={task.id} className={task.done ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  {task.title}
                </label>
              </li>
            ))}
          </ul>
        )}

        <small>
          Tip: check tasks to mark completed. Once you are done with work session,
          uncheck break mode and continue.
        </small>
      </section>

      <section className="placeholder-help">
        <p>
          Placeholder tasks exist in the app for tests. In backend, use your POST
          `/tasks` API to create real tasks and refresh.
        </p>
      </section>
    </main>
  )
}

export default App

