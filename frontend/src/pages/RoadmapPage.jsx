import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { roadmapApi, analysisApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Map, CheckCircle, Calendar, Clock, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'

export default function RoadmapPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [analyses, setAnalyses] = useState([])
  const [selectedAnalysis, setSelectedAnalysis] = useState(location.state?.analysis_id || '')
  const [duration, setDuration] = useState(12)
  const [language, setLanguage] = useState(user?.language || 'en')
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState(null)

  useEffect(() => {
    analysisApi.history().then(r => setAnalyses(r.data.analyses || []))
    roadmapApi.active().then(r => { if (r.data.roadmap) setRoadmap(r.data.roadmap) })
    if (location.state?.analysis_id) setSelectedAnalysis(String(location.state.analysis_id))
  }, [])

  const handleGenerate = async () => {
    if (!selectedAnalysis) return toast.error('Please select an analysis')
    setLoading(true)
    try {
      const { data } = await roadmapApi.generate({
        analysis_id: Number(selectedAnalysis),
        duration_weeks: duration,
        language,
      })
      setRoadmap(data.roadmap)
      toast.success('Roadmap generated! +100 XP 🗺️')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate roadmap')
    } finally { setLoading(false) }
  }

  const phases = roadmap ? [...new Set(roadmap.milestones.map(m => m.phase).filter(Boolean))] : []

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>🗺️ Learning Roadmap</h1>
        <p>AI-generated personalized improvement plan with week-by-week timeline</p>
      </div>

      {/* Generator controls */}
      <div className="glass-sm" style={{ padding:20, marginBottom:28, display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:14, alignItems:'end' }}>
        <div className="input-group">
          <label>Based on Analysis</label>
          <select value={selectedAnalysis} onChange={e => setSelectedAnalysis(e.target.value)}>
            <option value="">-- Select analysis --</option>
            {analyses.map(a => (
              <option key={a.id} value={a.id}>
                Analysis #{a.id} · {a.overall_score?.toFixed(1)}% · {new Date(a.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Duration (weeks)</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ minWidth:130 }}>
            {[4,8,12,16,24].map(w => <option key={w} value={w}>{w} weeks</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ minWidth:130 }}>
            {[['en','English'],['hi','Hindi'],['bn','Bengali'],['ta','Tamil'],['te','Telugu'],
              ['es','Spanish'],['fr','French'],['de','German'],['ar','Arabic']].map(([c,n]) => (
              <option key={c} value={c}>{n}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !selectedAnalysis}>
          {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Generating...</> : <><Map size={16}/>Generate</>}
        </button>
      </div>

      {/* Roadmap Display */}
      {roadmap && (
        <>
          {/* Header card */}
          <div className="glass" style={{ padding:32, marginBottom:28, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:20, top:10, fontSize:80, opacity:0.06 }}>🗺️</div>
            <div style={{ marginBottom:8 }}>
              <span className="chip chip-purple">{roadmap.duration_weeks} weeks</span>
              {' '}
              <span className="chip chip-teal">Active Plan</span>
            </div>
            <h2 style={{ fontSize:'1.4rem', marginBottom:8 }}>{roadmap.title}</h2>
            <p style={{ maxWidth:580 }}>{roadmap.description}</p>

            <div style={{ display:'flex', gap:24, marginTop:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--on-muted)' }}>
                <Calendar size={15} /> {roadmap.duration_weeks} weeks total
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--on-muted)' }}>
                <BookOpen size={15} /> {roadmap.milestones?.length} milestones
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--on-muted)' }}>
                <Clock size={15} /> {new Date(roadmap.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Phase chips */}
          {phases.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              {phases.map(p => <span key={p} className="chip chip-purple">{p}</span>)}
            </div>
          )}

          {/* Timeline */}
          <div style={{ position:'relative' }}>
            {/* Vertical line */}
            <div style={{ position:'absolute', left:20, top:0, bottom:0, width:2, background:'linear-gradient(to bottom,var(--primary-dim),transparent)', borderRadius:2 }} />

            {roadmap.milestones?.map((m, i) => (
              <div key={i} style={{ marginLeft:48, marginBottom:16, position:'relative' }}>
                {/* Dot */}
                <div style={{
                  position:'absolute', left:-36, top:16, width:14, height:14,
                  borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--primary-dim))',
                  border:'2px solid var(--bg)', boxShadow:'0 0 8px rgba(197,154,255,0.4)'
                }} />

                <div className="glass-sm" style={{ padding:0, overflow:'hidden' }}>
                  {/* Week header */}
                  <button
                    onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                    style={{
                      width:'100%', background:'none', border:'none', cursor:'pointer',
                      padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
                      color:'var(--on-surface)', textAlign:'left'
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, flexShrink:0,
                        background:'rgba(197,154,255,0.12)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--font-display)', fontWeight:800, fontSize:13, color:'var(--primary)'
                      }}>W{m.week}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{m.title}</div>
                        <div style={{ fontSize:12, color:'var(--on-muted)', marginTop:2 }}>
                          {m.phase} · {m.focus_subjects?.join(', ')}
                        </div>
                      </div>
                    </div>
                    {expandedWeek === i ? <ChevronDown size={16} color="var(--on-muted)" /> : <ChevronRight size={16} color="var(--on-muted)" />}
                  </button>

                  {/* Expanded content */}
                  {expandedWeek === i && (
                    <div style={{ padding:'0 20px 20px', borderTop:'1px solid var(--outline)' }}>
                      {/* Goals */}
                      {m.goals?.length > 0 && (
                        <div style={{ marginTop:16 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'var(--on-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Goals</div>
                          {m.goals.map((g, gi) => (
                            <div key={gi} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6, fontSize:13 }}>
                              <CheckCircle size={14} color="var(--tertiary)" style={{ flexShrink:0, marginTop:2 }} />
                              {g}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Daily tasks */}
                      {m.daily_tasks?.length > 0 && (
                        <div style={{ marginTop:16 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'var(--on-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Daily Tasks</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
                            {m.daily_tasks.map((t, ti) => (
                              <div key={ti} style={{ background:'var(--surface-hi)', borderRadius:'var(--radius-md)', padding:'10px 12px' }}>
                                <div style={{ fontSize:11, color:'var(--primary)', fontWeight:600, marginBottom:3 }}>{t.day}</div>
                                <div style={{ fontWeight:600, fontSize:13 }}>{t.subject}: {t.topic}</div>
                                <div style={{ fontSize:11, color:'var(--on-muted)', marginTop:2 }}>{t.activity} · {t.duration_min}min</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      {m.tips && (
                        <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(197,154,255,0.07)', borderRadius:'var(--radius-md)', borderLeft:'3px solid var(--primary)', fontSize:13 }}>
                          💡 {m.tips}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No roadmap yet */}
      {!roadmap && !loading && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--on-muted)' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
          <h3 style={{ marginBottom:8 }}>No roadmap yet</h3>
          <p>Run an AI analysis first, then generate your personalized learning roadmap.</p>
        </div>
      )}
    </div>
  )
}
