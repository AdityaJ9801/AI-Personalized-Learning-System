import { useState } from 'react'
import { reportApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload, Plus, Trash2, FileText, CheckCircle } from 'lucide-react'

const SUBJECTS_COMMON = [
  'Mathematics','Physics','Chemistry','Biology','English',
  'History','Geography','Computer Science','Economics','Hindi',
  'Social Science','Political Science','Accountancy','Business Studies'
]

export default function ReportCardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('upload') // 'upload' | 'manual'
  const [file, setFile]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [subjects, setSubjects] = useState([{ name:'', marks:'', max_marks:100 }])
  const [meta, setMeta] = useState({ term:'Term 1', academic_year:'2024-25', language: user?.language || 'en' })

  /* ── File upload handler ── */
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('term', meta.term)
    fd.append('academic_year', meta.academic_year)
    fd.append('language', meta.language)
    try {
      const { data } = await reportApi.upload(fd)
      setResult(data.report_card)
      toast.success('Report card analysed!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setLoading(false) }
  }

  /* ── Manual entry handler ── */
  const handleManual = async (e) => {
    e.preventDefault()
    const valid = subjects.filter(s => s.name && s.marks !== '')
    if (!valid.length) return toast.error('Add at least one subject')
    setLoading(true)
    try {
      const { data } = await reportApi.manual({
        subjects: valid.map(s => ({ name:s.name, marks:Number(s.marks), max_marks:Number(s.max_marks) })),
        term: meta.term, academic_year: meta.academic_year, language: meta.language,
        grade_level: user?.grade_level
      })
      setResult(data.report_card)
      toast.success('Subjects saved!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally { setLoading(false) }
  }

  const addSubject = () => setSubjects(s => [...s, { name:'', marks:'', max_marks:100 }])
  const removeSubject = (i) => setSubjects(s => s.filter((_,idx) => idx !== i))
  const updateSubject = (i, k, v) => setSubjects(s => s.map((x,idx) => idx===i ? {...x,[k]:v} : x))

  const SubjectIcon = <FileText size={16} />

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>📋 Report Card Input</h1>
        <p>Upload your report card or enter marks manually — AI handles the rest.</p>
      </div>

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:10, marginBottom:28 }}>
        {['upload','manual'].map(m => (
          <button key={m} className={`btn ${mode===m?'btn-primary':'btn-ghost'}`}
            onClick={() => { setMode(m); setResult(null) }}>
            {m === 'upload' ? '📤 Upload File' : '✍️ Manual Entry'}
          </button>
        ))}
      </div>

      {/* Common meta fields */}
      <div className="glass-sm" style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          <div className="input-group">
            <label>Term</label>
            <select value={meta.term} onChange={e => setMeta(m=>({...m,term:e.target.value}))}>
              {['Term 1','Term 2','Term 3','Mid-Term','Final','Annual'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Academic Year</label>
            <input value={meta.academic_year} onChange={e => setMeta(m=>({...m,academic_year:e.target.value}))} placeholder="2024-25" />
          </div>
          <div className="input-group">
            <label>Language for Analysis</label>
            <select value={meta.language} onChange={e => setMeta(m=>({...m,language:e.target.value}))}>
              {[['en','English'],['hi','Hindi'],['bn','Bengali'],['ta','Tamil'],['te','Telugu'],
                ['mr','Marathi'],['es','Spanish'],['fr','French'],['de','German'],['ar','Arabic'],
                ['zh','Chinese'],['pt','Portuguese'],['ru','Russian']].map(([c,n]) => (
                <option key={c} value={c}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <form onSubmit={handleUpload}>
          <div style={{
            border:'2px dashed var(--outline)', borderRadius:'var(--radius-lg)',
            padding:48, textAlign:'center', marginBottom:20,
            background: file ? 'rgba(160,255,240,0.05)' : 'transparent',
            transition:'all var(--transition)', cursor:'pointer'
          }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('file-input').click()}>
            <input id="file-input" type="file" accept=".pdf,.png,.jpg,.jpeg"
              style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
            <div style={{ fontSize:48, marginBottom:12 }}>{file ? '✅' : '📤'}</div>
            {file
              ? <div><div style={{ fontWeight:700, marginBottom:4 }}>{file.name}</div>
                  <div style={{ fontSize:12, color:'var(--on-muted)' }}>{(file.size/1024).toFixed(1)} KB</div></div>
              : <div><div style={{ fontWeight:600, marginBottom:6 }}>Drag & drop or click to upload</div>
                  <div style={{ fontSize:13, color:'var(--on-muted)' }}>PDF, PNG, JPG supported (max 16 MB)</div></div>
            }
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !file}>
            {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Processing...</> : <><Upload size={16}/> Analyse with AI</>}
          </button>
        </form>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <form onSubmit={handleManual}>
          <div className="glass-sm" style={{ padding:24, marginBottom:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:10, marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--on-muted)', textTransform:'uppercase' }}>Subject</div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--on-muted)', textTransform:'uppercase' }}>Marks</div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--on-muted)', textTransform:'uppercase', width:80 }}>Max</div>
              <div></div>
            </div>
            {subjects.map((s, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:10, marginBottom:10, alignItems:'center' }}>
                <div style={{ position:'relative' }}>
                  <input list={`subj-list-${i}`} value={s.name} placeholder="e.g. Mathematics"
                    onChange={e => updateSubject(i,'name',e.target.value)} />
                  <datalist id={`subj-list-${i}`}>
                    {SUBJECTS_COMMON.map(x => <option key={x} value={x} />)}
                  </datalist>
                </div>
                <input type="number" min={0} max={s.max_marks} value={s.marks}
                  style={{ width:80 }} placeholder="85"
                  onChange={e => updateSubject(i,'marks',e.target.value)} />
                <input type="number" min={1} value={s.max_marks}
                  style={{ width:80 }}
                  onChange={e => updateSubject(i,'max_marks',e.target.value)} />
                <button type="button" className="btn btn-danger" style={{ padding:'8px 10px' }}
                  onClick={() => removeSubject(i)}><Trash2 size={14}/></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={addSubject} style={{ marginTop:8 }}>
              <Plus size={15}/> Add Subject
            </button>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/>Saving...</> : <><CheckCircle size={16}/>Save & Continue</>}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div className="glass" style={{ padding:28, marginTop:28 }}>
          <h3 style={{ marginBottom:16, color:'var(--tertiary)' }}>✅ Data Extracted Successfully</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:24 }}>
            {(Array.isArray(result.subjects) ? result.subjects : Object.entries(result.subjects || {}).map(([k,v]) => ({name:k,...(typeof v==='object'?v:{marks_obtained:v})})))
              .map((s, i) => (
              <div key={i} className="stat-card" style={{ padding:'16px 18px' }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{s.name}</div>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--primary)', marginTop:4 }}>
                  {s.marks_obtained ?? s.marks}/{s.max_marks ?? 100}
                </div>
                <div style={{ fontSize:11, color:'var(--on-muted)' }}>
                  {s.percentage ?? Math.round((s.marks_obtained/s.max_marks)*100)}% · {s.grade}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/analysis', { state:{ report_card_id: result.id, language: meta.language } })}>
            🧠 Run AI Analysis →
          </button>
        </div>
      )}
    </div>
  )
}
