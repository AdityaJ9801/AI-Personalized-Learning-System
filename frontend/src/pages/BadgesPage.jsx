import { useState, useEffect } from 'react'
import { gamificationApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Trophy, Flame, Zap, Star } from 'lucide-react'

export default function BadgesPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('badges')

  useEffect(() => {
    gamificationApi.dashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load gamification data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', marginTop:80 }}>
      <div className="spinner" />
    </div>
  )

  const level        = data?.level ?? 1
  const xp           = data?.xp ?? 0
  const streak       = data?.streak ?? 0
  const badgesEarned = data?.badges_earned ?? 0
  const badgesTotal  = data?.badges_total ?? 0
  const xpProgress   = data?.xp_progress_percent ?? 0
  const xpInLevel    = xp % 500
  const xpNeeded     = 500 - xpInLevel

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>🏆 Badges &amp; Progress</h1>
        <p>Your achievements, XP, streaks and leaderboard position</p>
      </div>

      {/* Hero stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <HeroStat icon={<Star size={22} color="var(--primary)" />}   value={`Lv.${level}`}           label="Level"   color="var(--primary)" />
        <HeroStat icon={<Zap size={22} color="#ffc850" />}           value={xp}                       label="Total XP" color="#ffc850" />
        <HeroStat icon={<Flame size={22} color="#ffa040" />}         value={`${streak} days`}         label="Streak"  color="#ffa040" />
        <HeroStat icon={<Trophy size={22} color="var(--tertiary)" />} value={`${badgesEarned}/${badgesTotal}`} label="Badges" color="var(--tertiary)" />
      </div>

      {/* XP level progress bar */}
      <div className="glass-sm" style={{ padding:'20px 24px', marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontWeight:700 }}>Level {level}</span>
          <span style={{ fontSize:13, color:'var(--on-muted)' }}>
            {xpInLevel} / 500 XP to Level {level + 1}
          </span>
        </div>
        <div className="progress-track" style={{ height:10 }}>
          <div className="progress-fill" style={{ width:`${xpProgress}%` }} />
        </div>
        <div style={{ fontSize:12, color:'var(--on-muted)', marginTop:8 }}>
          {xpProgress.toFixed(1)}% complete · {xpNeeded} XP needed
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', gap:10, marginBottom:24 }}>
        {[['badges','🏅 My Badges'],['leaderboard','📊 Leaderboard']].map(([t,label]) => (
          <button key={t} className={`btn ${tab===t?'btn-primary':'btn-ghost'}`}
            onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {/* Badges grid */}
      {tab === 'badges' && (
        <>
          {(!data?.available_badges || data.available_badges.length === 0)
            ? (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--on-muted)' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏅</div>
                <p>No badges available yet. Complete practice sessions to unlock achievements!</p>
              </div>
            )
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
                {data.available_badges.map(b => (
                  <div key={b.id} className="glass-sm" style={{
                    padding:24, textAlign:'center',
                    opacity: b.earned ? 1 : 0.45,
                    transition:'all var(--transition)',
                    position:'relative', overflow:'hidden'
                  }}
                    onMouseOver={e => b.earned && (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseOut={e => (e.currentTarget.style.transform = 'none')}>
                    {b.earned && (
                      <div style={{ position:'absolute', top:8, right:8 }}>
                        <span className="chip chip-teal" style={{ padding:'2px 8px', fontSize:10 }}>✓ Earned</span>
                      </div>
                    )}
                    <div style={{
                      width:60, height:60, borderRadius:16, margin:'0 auto 12px',
                      background: b.earned ? 'linear-gradient(135deg,rgba(197,154,255,0.25),rgba(149,71,247,0.15))' : 'var(--surface-hi)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
                      border: b.earned ? '1px solid rgba(197,154,255,0.3)' : '1px solid var(--outline)',
                      boxShadow: b.earned ? '0 0 20px rgba(197,154,255,0.2)' : 'none'
                    }}>
                      {b.icon}
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{b.name}</div>
                    <div style={{ fontSize:12, color:'var(--on-muted)', marginBottom:10, lineHeight:1.5 }}>{b.description}</div>
                    <span className="chip chip-gold">+{b.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            )
          }
        </>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="glass-sm" style={{ padding:24 }}>
          <h3 style={{ marginBottom:20 }}>🏆 Top Learners</h3>
          <LeaderboardView />
        </div>
      )}
    </div>
  )
}

function LeaderboardView() {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gamificationApi.leaderboard()
      .then(r => setBoard(r.data.leaderboard || []))
      .finally(() => setLoading(false))
  }, [])

  const medals = ['🥇','🥈','🥉']

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:24 }}><div className="spinner" /></div>

  return (
    <div>
      {board.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--on-muted)', fontSize:14 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📊</div>
          <p>Be the first to top the board! Complete practice sessions to earn XP.</p>
        </div>
      )}
      {board.map((u, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:16, padding:'14px 16px',
          borderRadius:'var(--radius-md)', marginBottom:8,
          background: u.is_me ? 'rgba(197,154,255,0.1)' : 'var(--surface-hi)',
          border: u.is_me ? '1px solid rgba(197,154,255,0.3)' : '1px solid var(--outline)',
          transition:'all var(--transition)'
        }}>
          <div style={{ width:32, textAlign:'center', fontSize:20, flexShrink:0 }}>
            {i < 3 ? medals[i] : <span style={{ fontWeight:700, color:'var(--on-muted)' }}>#{u.rank}</span>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>
              {u.name}
              {u.is_me && <span className="chip chip-purple" style={{ marginLeft:8, fontSize:11 }}>You</span>}
            </div>
            <div style={{ fontSize:12, color:'var(--on-muted)', marginTop:2 }}>
              Level {u.level} · 🔥 {u.streak} day streak
            </div>
          </div>
          <div style={{ fontWeight:800, color:'var(--primary)', fontSize:16 }}>{u.xp} XP</div>
        </div>
      ))}
    </div>
  )
}

function HeroStat({ icon, value, label, color }) {
  return (
    <div className="glass-sm" style={{ padding:'20px 24px', textAlign:'center' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.8rem', color }}>{value}</div>
      <div style={{ fontSize:12, color:'var(--on-muted)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>
    </div>
  )
}
