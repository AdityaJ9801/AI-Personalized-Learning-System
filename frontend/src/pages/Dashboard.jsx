import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { gamificationApi, reportApi, analysisApi } from '../api/client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Flame, Zap, Trophy, Brain, Map, Dumbbell, MessageCircle, FileText, ArrowRight, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameStats, setGameStats] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      gamificationApi.dashboard(),
      reportApi.list(),
    ]).then(([gRes, rRes]) => {
      setGameStats(gRes.data)
      setRecentReports(rRes.data.report_cards?.slice(0, 3) || [])
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', marginTop:80 }}>
      <div className="spinner" />
    </div>
  )

  const quickActions = [
    { icon:'📋', label:'Upload Report Card', sub:'Extract marks with AI', path:'/report', color:'rgba(197,154,255,0.12)' },
    { icon:'🎯', label:'Start Practice', sub:'AI-generated Q&A', path:'/practice', color:'rgba(160,255,240,0.08)' },
    { icon:'🗺️', label:'View Roadmap', sub:'Your learning plan', path:'/roadmap', color:'rgba(255,166,64,0.08)' },
    { icon:'💬', label:'Ask AI Tutor', sub:'Instant doubt solving', path:'/chatbot', color:'rgba(255,110,132,0.08)' },
  ]

  // Build radar chart data from last analysis if available
  const lastReport = recentReports[0]

  return (
    <div className="fade-up">
      {/* ── Header ── */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:'2rem', marginBottom:6 }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color:'var(--on-muted)' }}>
          Here's your learning overview for today
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
        <StatCard icon={<Zap size={20} color="var(--primary)" />} value={gameStats?.xp ?? 0} label="Total XP" />
        <StatCard icon={<span style={{fontSize:18}}>⭐</span>} value={`Lv.${gameStats?.level ?? 1}`} label="Current Level" />
        <StatCard icon={<Flame size={20} color="#ffa040" />} value={gameStats?.streak ?? 0} label="Day Streak" />
        <StatCard icon={<Trophy size={20} color="#ffc850" />} value={gameStats?.badges_earned ?? 0} label="Badges Earned" />
        <StatCard icon={<Dumbbell size={20} color="var(--tertiary)" />} value={gameStats?.total_sessions ?? 0} label="Sessions Done" />
        <StatCard icon={<TrendingUp size={20} color="#6af07a" />} value={`${gameStats?.avg_score ?? 0}%`} label="Avg Score" />
      </div>

      {/* ── XP Progress bar ── */}
      {gameStats && (
        <div className="glass-sm" style={{ padding:'18px 24px', marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontWeight:600, fontSize:14 }}>Level {gameStats.level} → Level {gameStats.level + 1}</span>
            <span style={{ fontSize:13, color:'var(--on-muted)' }}>{gameStats.xp % 500} / 500 XP</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width:`${gameStats.xp_progress_percent}%` }} />
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom:32 }}>
        <h2 style={{ fontSize:'1.2rem', marginBottom:16 }}>Quick Actions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{
                background: a.color, border:'1px solid var(--outline)',
                borderRadius:'var(--radius-lg)', padding:'20px', textAlign:'left',
                cursor:'pointer', transition:'all var(--transition)', color:'var(--on-surface)'
              }}
              onMouseOver={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-glow)' }}
              onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{a.icon}</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{a.label}</div>
              <div style={{ fontSize:12, color:'var(--on-muted)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                {a.sub} <ArrowRight size={13} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom two-col ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Recent Reports */}
        <div className="glass-sm" style={{ padding:24 }}>
          <div className="section-header" style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:'1rem' }}>Recent Report Cards</h3>
            <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => navigate('/report')}>
              View all
            </button>
          </div>
          {recentReports.length === 0
            ? <EmptyState icon="📄" text="No report cards yet. Upload one to get started!" />
            : recentReports.map(r => (
                <div key={r.id} style={{
                  padding:'12px 0', display:'flex', justifyContent:'space-between', alignItems:'center',
                  borderBottom:'1px solid var(--outline)'
                }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.term || 'Report Card'} {r.academic_year}</div>
                    <div style={{ fontSize:11, color:'var(--on-muted)', marginTop:2 }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`chip ${r.analysis_status === 'done' ? 'chip-teal' : 'chip-purple'}`}>
                    {r.analysis_status}
                  </span>
                </div>
              ))
          }
        </div>

        {/* Badges preview */}
        <div className="glass-sm" style={{ padding:24 }}>
          <div className="section-header" style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:'1rem' }}>Recent Badges</h3>
            <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => navigate('/badges')}>
              View all
            </button>
          </div>
          {!gameStats?.earned_badges?.length
            ? <EmptyState icon="🏆" text="Complete sessions to earn badges!" />
            : gameStats.earned_badges.slice(0, 4).map(ub => (
                <div key={ub.id} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                  borderBottom:'1px solid var(--outline)'
                }}>
                  <div style={{
                    width:38, height:38, borderRadius:10,
                    background:'rgba(197,154,255,0.12)', display:'flex',
                    alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0
                  }}>{ub.badge.icon}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{ub.badge.name}</div>
                    <div style={{ fontSize:11, color:'var(--on-muted)' }}>+{ub.badge.xp_reward} XP</div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--on-muted)', fontSize:12, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.07em' }}>
        {icon} {label}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'24px 16px', color:'var(--on-muted)', fontSize:13 }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      {text}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
