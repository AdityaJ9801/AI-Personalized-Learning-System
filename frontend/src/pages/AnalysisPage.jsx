import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { analysisApi, reportApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Brain, TrendingUp, TrendingDown, AlertCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalysisPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(location.state?.report_card_id || '')
  const [language, setLanguage] = useState(location.state?.language || user?.language || 'en')
  const [analysis, setAnalysis] = useState(null)
  const [summary, setSummary] = useState('')
  const [perfLevel, setPerfLevel] = useState('')
  const [motivational, setMotivational] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    reportApi.list().then(r => setReports(r.data.report_cards || []))
    analysisApi.history().then(r => setHistory(r.data.analyses || []))
    if (location.state?.report_card_id) runAnalysis(location.state.report_card_id, language)
  }, [])

  const runAnalysis = async (reportId = selectedReport, lang = language) => {
    if (!reportId) return toast.error('Please select a report card')
    setLoading(true)
    try {
      const { data } = await analysisApi.analyze({ report_card_id: Number(reportId), language: lang })
      setAnalysis(data.analysis)
      setSummary(data.summary)
      setPerfLevel(data.performance_level)
      setMotivational(data.motivational_message)
      toast.success('Analysis complete! +50 XP 🎉')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally { setLoading(false) }
  }

  // Build radar data from strengths/weaknesses
  const radarData = analysis ? [
    ...analysis.strengths.map(s => ({ subject: s.subject, score: s.score })),
    ...analysis.weaknesses.map(w => ({ subject: w.subject, score: w.score }))
  ].reduce((acc, cur) => {
    if (!acc.find(x => x.subject === cur.subject)) acc.push(cur)
    return acc
  }, []) : []

  const levelColor = { 'Excellent':'var(--tertiary)', 'Good':'#6af07a', 'Average':'#ffd166', 'Below Average':'#ffa040', 'Needs Improvement':'var(--error)' }

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>🧠 AI Analysis Engine</h1>
        <p>Strengths · Weak Areas · Gaps · Actionable Recommendations</p>
      </div>

      {/* Controls */}
      <div className="glass-sm" style={{ padding:20, marginBottom:24, display:'grid', gridTemplateColumns:'1fr auto auto', gap:14, alignItems:'end' }}>
        <div className="input-group">
          <label>Select Report Card</label>
          <select value={selectedReport} onChange={e => setSelectedReport(e.target.value)}>
            <option value="">-- Choose a report card --</option>
            {reports.map(r => (
              <option key={r.id} value={r.id}>{r.term || 'Report'} {r.academic_year} ({new Date(r.created_at).toLocaleDateString()})</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ minWidth:130 }}>
            {[['en','English'],['hi','Hindi'],['bn','Bengali'],['ta','Tamil'],['te','Telugu'],['mr','Marathi'],
              ['es','Spanish'],['fr','French'],['de','German'],['ar','Arabic'],['zh','Chinese']].map(([c,n]) => (
              <option key={c} value={c}>{n}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => runAnalysis()} disabled={loading || !selectedReport}>
          {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Analysing...</> : <><Brain size={16}/>Run Analysis</>}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Performance banner */}
          <div className="glass" style={{ padding:28, marginBottom:24, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:20, top:-10, fontSize:80, opacity:0.07 }}>🧠</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ marginBottom:10 }}>
                  <span className="chip chip-purple" style={{ fontSize:13, padding:'5px 14px' }}>
                    {perfLevel}
                  </span>
                </div>
                <h2 style={{ fontSize:'1.3rem', marginBottom:8 }}>Analysis Complete</h2>
                <p style={{ maxWidth:520, lineHeight:1.7 }}>{summary}</p>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'3rem', fontWeight:800, color: levelColor[perfLevel] || 'var(--primary)' }}>
                  {analysis.overall_score?.toFixed(1)}%
                </div>
                <div style={{ fontSize:12, color:'var(--on-muted)' }}>Overall Score</div>
              </div>
            </div>
            {motivational && (
              <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(160,255,240,0.07)', borderRadius:'var(--radius-md)', borderLeft:'3px solid var(--tertiary)' }}>
                <span style={{ fontSize:13, color:'var(--tertiary)' }}>💡 {motivational}</span>
              </div>
            )}
          </div>

          {/* Two-col layout */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            {/* Strengths */}
            <Section icon={<TrendingUp size={16} color="var(--tertiary)" />} title="Strengths" color="var(--tertiary)">
              {analysis.strengths.map((s, i) => (
                <SubjectRow key={i} item={s} type="strength" />
              ))}
            </Section>

            {/* Weaknesses */}
            <Section icon={<TrendingDown size={16} color="var(--error)" />} title="Areas to Improve" color="var(--error)">
              {analysis.weaknesses.map((w, i) => (
                <SubjectRow key={i} item={w} type="weakness" />
              ))}
            </Section>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
            {/* Gaps */}
            <Section icon={<AlertCircle size={16} color="#ffa040" />} title="Knowledge Gaps" color="#ffa040">
              {analysis.gaps.map((g, i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--outline)' }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{g.area}</div>
                  <div style={{ fontSize:12, color:'var(--on-muted)', marginTop:3 }}>{g.description}</div>
                </div>
              ))}
            </Section>

            {/* Recommendations */}
            <Section icon={<Lightbulb size={16} color="var(--primary)" />} title="Recommendations" color="var(--primary)">
              {(Array.isArray(analysis.recommendations) ? analysis.recommendations : []).map((r, i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--outline)', display:'flex', gap:10 }}>
                  <span className={`chip ${r.priority==='high'?'chip-red':r.priority==='medium'?'chip-gold':'chip-purple'}`}
                    style={{ height:'fit-content', flexShrink:0, marginTop:2 }}>{r.priority}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.action}</div>
                    <div style={{ fontSize:12, color:'var(--on-muted)', marginTop:2 }}>{r.reason}</div>
                  </div>
                </div>
              ))}
            </Section>
          </div>

          {/* Radar chart */}
          {radarData.length > 2 && (
            <div className="glass-sm" style={{ padding:24, marginBottom:24 }}>
              <h3 style={{ marginBottom:16 }}>Performance Radar</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--outline)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--on-muted)', fontSize:12 }} />
                  <Radar name="Score" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.18} />
                  <Tooltip contentStyle={{ background:'var(--surface-hi)', border:'1px solid var(--outline)', borderRadius:8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Navigate forward */}
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-primary" onClick={() => navigate('/roadmap', { state:{ analysis_id: analysis.id } })}>
              🗺️ Generate Roadmap
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/practice')}>
              🎯 Start Practice
            </button>
          </div>
        </>
      )}

      {/* History */}
      {!analysis && history.length > 0 && (
        <div className="glass-sm" style={{ padding:24 }}>
          <h3 style={{ marginBottom:16 }}>Previous Analyses</h3>
          {history.map(a => (
            <div key={a.id} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'12px 0', borderBottom:'1px solid var(--outline)'
            }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>Analysis #{a.id}</div>
                <div style={{ fontSize:11, color:'var(--on-muted)' }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontWeight:700, color:'var(--primary)' }}>{a.overall_score?.toFixed(1)}%</span>
                <button className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:12 }}
                  onClick={() => setAnalysis(a)}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ icon, title, color, children }) {
  return (
    <div className="glass-sm" style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        {icon}
        <h3 style={{ fontSize:'1rem', color }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function SubjectRow({ item, type }) {
  return (
    <div style={{ padding:'10px 0', borderBottom:'1px solid var(--outline)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontWeight:600, fontSize:13 }}>{item.subject}</span>
        <span style={{ fontWeight:700, fontSize:14, color: type==='strength'?'var(--tertiary)':'var(--error)' }}>
          {item.score}%
        </span>
      </div>
      <div style={{ fontSize:12, color:'var(--on-muted)' }}>{item.insight}</div>
      <div className="progress-track" style={{ marginTop:6 }}>
        <div className="progress-fill" style={{
          width:`${item.score}%`,
          background: type==='strength'
            ? 'linear-gradient(90deg,var(--tertiary),#2de7d2)'
            : 'linear-gradient(90deg,var(--error),#d73357)'
        }} />
      </div>
    </div>
  )
}
