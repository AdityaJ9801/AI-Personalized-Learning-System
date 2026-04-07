import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FileText, Brain, Map, Dumbbell,
  ClipboardList, MessageCircle, Trophy, LogOut, Zap, Flame
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/report',    icon: FileText,         label: 'Report Card' },
  { to: '/analysis',  icon: Brain,            label: 'AI Analysis' },
  { to: '/roadmap',   icon: Map,              label: 'Roadmap' },
  { to: '/practice',  icon: Dumbbell,         label: 'Practice' },
  { to: '/exam-prep', icon: ClipboardList,    label: 'Exam Prep' },
  { to: '/chatbot',   icon: MessageCircle,    label: 'AI Chatbot' },
  { to: '/badges',    icon: Trophy,           label: 'Badges' },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--outline)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:38, height:38, borderRadius:10,
              background:'linear-gradient(135deg,var(--primary),var(--primary-dim))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, flexShrink:0
            }}>🧠</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:'var(--on-surface)' }}>EduAI</div>
              <div style={{ fontSize:11, color:'var(--on-muted)' }}>Learning System</div>
            </div>
          </div>
        </div>

        {/* User quick-stats */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--outline)' }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:6, color:'var(--on-surface)' }}>
            {user?.name?.split(' ')[0]} 👋
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--primary)' }}>
              <Zap size={13} />{user?.xp ?? 0} XP
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#ffa040' }}>
              <Flame size={13} />{user?.streak ?? 0} streak
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:'var(--radius-md)',
              fontSize:14, fontWeight:500,
              color: isActive ? 'var(--primary)' : 'var(--on-muted)',
              background: isActive ? 'rgba(197,154,255,0.1)' : 'transparent',
              transition:'all var(--transition)',
              textDecoration:'none',
            })}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding:'12px 10px', borderTop:'1px solid var(--outline)' }}>
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', gap:10, fontSize:14 }}
            onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <main className="main-content" style={{ position:'relative', zIndex:1 }}>
        <Outlet />
      </main>
    </div>
  )
}
