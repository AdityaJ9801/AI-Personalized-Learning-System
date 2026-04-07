import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ReportCardPage from './pages/ReportCardPage'
import AnalysisPage from './pages/AnalysisPage'
import RoadmapPage from './pages/RoadmapPage'
import PracticePage from './pages/PracticePage'
import ExamPrepPage from './pages/ExamPrepPage'
import ChatbotPage from './pages/ChatbotPage'
import BadgesPage from './pages/BadgesPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="spinner" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="report"     element={<ReportCardPage />} />
          <Route path="analysis"   element={<AnalysisPage />} />
          <Route path="roadmap"    element={<RoadmapPage />} />
          <Route path="practice"   element={<PracticePage />} />
          <Route path="exam-prep"  element={<ExamPrepPage />} />
          <Route path="chatbot"    element={<ChatbotPage />} />
          <Route path="badges"     element={<BadgesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
