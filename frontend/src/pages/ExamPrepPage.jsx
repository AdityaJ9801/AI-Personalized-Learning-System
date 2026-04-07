import { useState } from 'react'
import { practiceApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ClipboardList, Play, ChevronDown, ChevronUp } from 'lucide-react'

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','History','Computer Science','Economics']
const EXAM_TYPES = ['Chapter Test','Unit Test','Mid Term','Final Exam','Board Exam','Entrance Prep','Quiz']

export default function ExamPrepPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState(['Mathematics'])
  const [examType, setExamType] = useState('Chapter Test')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const toggle = (s) => setSubjects(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  )

  const startExam = async () => {
    if (!subjects.length) return toast.error('Select at least one subject')
    setLoading(true)
    setUserAnswers({}); setRevealed({}); setExpanded(null)
    try {
      const { data } = await practiceApi.examPrep({
        subjects, exam_type: examType,
        language: user?.language || 'en',
        grade_level: user?.grade_level || '10th Grade'
      })
      setSession(data.exam_session)
      toast.success('Exam prep session ready! 📝')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate exam')
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>📝 Exam Preparation</h1>
        <p>AI-generated exam-style Q&A sessions to simulate real test conditions</p>
      </div>

      {/* Config */}
      <div className="glass-sm" style={{ padding:24, marginBottom:28 }}>
        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'var(--on-muted)', display:'block', marginBottom:10 }}>Select Subjects</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {SUBJECTS.map(s => (
              <button key={s}
                className={`chip ${subjects.includes(s) ? 'chip-purple' : ''}`}
                onClick={() => toggle(s)}
                style={{
                  cursor:'pointer', border: subjects.includes(s) ? '1px solid var(--primary)' : '1px solid var(--outline)',
                  background: subjects.includes(s) ? 'rgba(197,154,255,0.15)' : 'var(--surface-hi)',
                  padding:'7px 14px', borderRadius:'var(--radius-full)', fontSize:13, fontWeight:500,
                  color: subjects.includes(s) ? 'var(--primary)' : 'var(--on-muted)', transition:'all var(--transition)'
                }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'end' }}>
          <div className="input-group">
            <label>Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)}>
              {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={startExam} disabled={loading || !subjects.length}>
            {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Generating...</> : <><Play size={15}/>Start Exam Prep</>}
          </button>
        </div>
      </div>

      {/* Session display */}
      {session && (
        <>
          <div className="glass" style={{ padding:24, marginBottom:24 }}>
            <h2 style={{ marginBottom:10 }}>{session.session_title}</h2>
            <div style={{ display:'flex', gap:16 }}>
              <span className="chip chip-purple">⏱ {session.duration_minutes} min</span>
              <span className="chip chip-teal">📊 {session.total_marks} marks</span>
            </div>
          </div>

          {session.sections?.map((sec, si) => (
            <div key={si} className="glass-sm" style={{ marginBottom:16, overflow:'hidden' }}>
              <button onClick={() => setExpanded(expanded === si ? null : si)}
                style={{
                  width:'100%', background:'none', border:'none', cursor:'pointer',
                  padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
                  color:'var(--on-surface)'
                }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>📚</span>
                  <span style={{ fontWeight:700 }}>{sec.subject}</span>
                  <span className="chip chip-purple">{sec.questions?.length} questions</span>
                </div>
                {expanded === si ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expanded === si && (
                <div style={{ padding:'0 20px 20px', borderTop:'1px solid var(--outline)' }}>
                  {sec.questions?.map((q, qi) => {
                    const key = `${si}-${qi}`
                    const isRevealed = revealed[key]
                    return (
                      <div key={qi} style={{ padding:'16px 0', borderBottom:qi < sec.questions.length-1?'1px solid var(--outline)':'none' }}>
                        <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                          <span style={{ fontWeight:700, color:'var(--primary)', flexShrink:0 }}>Q{qi+1}.</span>
                          <div>
                            <p style={{ color:'var(--on-surface)', fontSize:14, lineHeight:1.6 }}>{q.question}</p>
                            {q.marks && <div style={{ fontSize:11, color:'var(--on-muted)', marginTop:4 }}>[{q.marks} marks]</div>}
                          </div>
                        </div>

                        {/* MCQ options */}
                        {q.type === 'mcq' && q.options && (
                          <div style={{ paddingLeft:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                            {q.options.map((opt, oi) => (
                              <div key={oi}
                                style={{
                                  padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13,
                                  background: isRevealed && opt === q.answer ? 'rgba(160,255,240,0.1)' : 'var(--surface-hi)',
                                  border: isRevealed && opt === q.answer ? '1px solid var(--tertiary)' : '1px solid var(--outline)',
                                  color: isRevealed && opt === q.answer ? 'var(--tertiary)' : 'var(--on-surface)'
                                }}>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Short/long answer */}
                        {q.type !== 'mcq' && (
                          <textarea rows={3} placeholder="Write your answer..."
                            value={userAnswers[key] || ''}
                            onChange={e => setUserAnswers(a => ({...a,[key]:e.target.value}))}
                            style={{ marginLeft:20, width:'calc(100% - 20px)', marginBottom:10, resize:'vertical' }} />
                        )}

                        {/* Reveal / Hint */}
                        <div style={{ paddingLeft:20, display:'flex', gap:10 }}>
                          <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }}
                            onClick={() => setRevealed(r => ({...r,[key]:!r[key]}))}>
                            {isRevealed ? '🙈 Hide Answer' : '👁 Show Answer'}
                          </button>
                          {q.hint && !isRevealed && (
                            <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }}
                              onClick={() => toast(q.hint, { icon:'💡' })}>
                              💡 Hint
                            </button>
                          )}
                        </div>

                        {isRevealed && (
                          <div style={{ marginLeft:20, marginTop:10, padding:'10px 14px', background:'rgba(160,255,240,0.07)', borderRadius:'var(--radius-md)', borderLeft:'3px solid var(--tertiary)', fontSize:13 }}>
                            <strong style={{ color:'var(--tertiary)' }}>Answer: </strong>{q.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          <button className="btn btn-ghost" onClick={() => { setSession(null) }} style={{ marginTop:8 }}>
            ← New Exam Prep
          </button>
        </>
      )}
    </div>
  )
}
