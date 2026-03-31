import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RoleSelectionPage from './pages/RoleSelectionPage'
import PomodoroPage from './pages/PomodoroPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />
      </Routes>
    </Router>
  )
}

export default App

