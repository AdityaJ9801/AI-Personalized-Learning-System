import { useState } from 'react'
import { practiceApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Dumbbell, CheckCircle, XCircle, Send } from 'lucide-react'

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','History','Geography','Computer Science','Economics','Science','Social Studies']
const DIFFICULTIES = ['easy','medium','hard']

export default function PracticePage() {
  const { user } = useAuth()
  const [config, setConfig] = useState({ subject:'Mathematics', topic:'', difficulty:'medium', num_questions:10 })
  const [session, setSession] = useState(null)
  const [answers, setAnswers] = useState({})
  const [evaluations, setEvaluations] = useState({})
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [evalLoading, setEvalLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(null)

  const startSession = async () => {
    setLoading(true)
    setDone(false); setAnswers({}); setEvaluations({}); setCurrent(0); setScore(null)
    try {
      const { data } = await practiceApi.questions({
        ...config,
        language: user?.language || 'en',
        grade_level: user?.grade_level || '10th Grade'
      })
      setSession(data)
      toast.success(`${data.questions.length} questions ready!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate questions')
    } finally { setLoading(false) }
  }

  const submitAnswer = async (qIndex) => {
    const q = session.questions[qIndex]
    const studentAnswer = answers[qIndex] || ''
    if (!studentAnswer.trim()) return toast.error('Please enter an answer')

    setEvalLoading(true)
    try {
      const { data } = await practiceApi.evaluate({
        question: q.question,
        model_answer: q.correct_answer || q.model_answer || '',
        student_answer: studentAnswer,
        subject: session.subject,
        language: user?.language || 'en'
      })
      setEvaluations(ev => ({ ...ev, [qIndex]: data.evaluation }))
      if (qIndex < session.questions.length - 1) setTimeout(() => setCurrent(qIndex + 1), 2000)
      else setDone(true)
    } catch {
      toast.error('Evaluation failed — try again')
    } finally { setEvalLoading(false) }
  }

  const finishSession = async () => {
    const evals = Object.values(evaluations)
    const avg = evals.length ? evals.reduce((s, e) => s + (e.percentage || 0), 0) / evals.length : 0
    const correct = evals.filter(e => e.percentage >= 70).length
    setScore(avg)
    try {
      await practiceApi.complete(session.session_id, {
        score: avg,
        correct_answers: correct,
        duration_minutes: Math.ceil(session.questions.length * 2)
      })
      toast.success(`Session complete! Score: ${avg.toFixed(1)}% 🎯`)
    } catch { /* ignore */ }
  }

  const q = session?.questions[current]
  const ev = evaluations[current]

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>🎯 Daily Practice</h1>
        <p>AI-generated practice questions tailored to your level and language</p>
      </div>

      {/* Config panel */}
      {!session && (
        <div className="glass" style={{ padding:32 }}>
          <h3 style={{ marginBottom:20 }}>Configure Your Session</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div className="input-group">
              <label>Subject</label>
              <select value={config.subject} onChange={e => setConfig(c => ({...c,subject:e.target.value}))}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Topic (optional)</label>
              <input placeholder="e.g. Quadratic Equations, Photosynthesis..."
                value={config.topic} onChange={e => setConfig(c => ({...c,topic:e.target.value}))} />
            </div>
            <div className="input-group">
              <label>Difficulty</label>
              <select value={config.difficulty} onChange={e => setConfig(c => ({...c,difficulty:e.target.value}))}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Number of Questions</label>
              <select value={config.num_questions} onChange={e => setConfig(c => ({...c,num_questions:Number(e.target.value)}))}>
                {[5,10,15,20].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={startSession} disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Generating...</> : <><Dumbbell size={16}/>Start Session</>}
          </button>
        </div>
      )}

      {/* Active session */}
      {session && !done && q && (
        <div>
          {/* Progress */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:14, fontWeight:600 }}>Question {current + 1} of {session.questions.length}</span>
              <span style={{ fontSize:13, color:'var(--on-muted)' }}>{session.subject} · {session.difficulty}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width:`${((current + 1) / session.questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="glass" style={{ padding:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <span className="chip chip-purple">{q.type?.toUpperCase()} · {q.marks} marks</span>
            </div>

            <p style={{ fontSize:'1.1rem', color:'var(--on-surface)', marginBottom:24, lineHeight:1.7 }}>
              {q.question}
            </p>

            {/* MCQ options */}
            {q.type === 'mcq' && q.options && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                {q.options.map((opt, oi) => (
                  <button key={oi}
                    onClick={() => setAnswers(a => ({...a,[current]:opt}))}
                    style={{
                      padding:'12px 16px', borderRadius:'var(--radius-md)', textAlign:'left',
                      cursor:'pointer', transition:'all var(--transition)', fontSize:14,
                      background: answers[current] === opt ? 'rgba(197,154,255,0.2)' : 'var(--surface-hi)',
                      border: answers[current] === opt ? '1px solid var(--primary)' : '1px solid var(--outline)',
                      color:'var(--on-surface)'
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Text answer */}
            {q.type !== 'mcq' && (
              <textarea rows={4} placeholder="Type your answer here..."
                value={answers[current] || ''}
                onChange={e => setAnswers(a => ({...a,[current]:e.target.value}))}
                style={{ marginBottom:20, resize:'vertical' }} />
            )}

            {/* Submit */}
            {!ev && (
              <button className="btn btn-primary" onClick={() => submitAnswer(current)} disabled={evalLoading}>
                {evalLoading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Evaluating...</> : <><Send size={15}/>Submit Answer</>}
              </button>
            )}

            {/* Evaluation result */}
            {ev && (
              <div style={{ marginTop:16, padding:20, borderRadius:'var(--radius-md)', background: ev.percentage >= 70 ? 'rgba(160,255,240,0.07)' : 'rgba(255,110,132,0.07)', border:`1px solid ${ev.percentage >= 70 ? 'rgba(160,255,240,0.3)' : 'rgba(255,110,132,0.3)'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  {ev.percentage >= 70 ? <CheckCircle size={18} color="var(--tertiary)" /> : <XCircle size={18} color="var(--error)" />}
                  <span style={{ fontWeight:700, fontSize:15 }}>{ev.verdict} · {ev.percentage}%</span>
                </div>
                <p style={{ fontSize:13, marginBottom:8 }}>{ev.feedback}</p>
                {ev.encouraged_message && <p style={{ fontSize:13, color:'var(--primary)', fontStyle:'italic' }}>{ev.encouraged_message}</p>}
                {current < session.questions.length - 1
                  ? <button className="btn btn-ghost" style={{ marginTop:12 }} onClick={() => setCurrent(c => c + 1)}>Next Question →</button>
                  : <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => { setDone(true); finishSession() }}>Finish Session 🏁</button>
                }
              </div>
            )}
          </div>

          {/* Question nav strip */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:16 }}>
            {session.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{
                  width:34, height:34, borderRadius:'var(--radius-sm)', border:'1px solid var(--outline)',
                  cursor:'pointer', fontSize:12, fontWeight:600,
                  background: i === current ? 'var(--primary)' : evaluations[i] ? 'rgba(160,255,240,0.2)' : 'var(--surface-hi)',
                  color: i === current ? '#fff' : 'var(--on-surface)'
                }}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      {/* Done screen */}
      {done && (
        <div className="glass" style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🎯</div>
          <h2 style={{ marginBottom:8 }}>Session Complete!</h2>
          <div style={{ fontSize:'3rem', fontWeight:800, color:'var(--primary)', margin:'16px 0' }}>
            {score?.toFixed(1)}%
          </div>
          <p style={{ marginBottom:24, color:'var(--on-muted)' }}>
            You answered {Object.keys(evaluations).length} questions
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button className="btn btn-primary" onClick={() => { setSession(null); setDone(false) }}>
              <Dumbbell size={15} /> New Session
            </button>
            <button className="btn btn-ghost" onClick={() => toast.success('Progress saved!')}>
              View Progress
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
