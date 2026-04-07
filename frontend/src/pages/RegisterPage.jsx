import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

const LANGUAGES = [
  { code:'en', name:'English' }, { code:'hi', name:'हिन्दी' },
  { code:'bn', name:'বাংলা' }, { code:'ta', name:'தமிழ்' },
  { code:'te', name:'తెలుగు' }, { code:'mr', name:'मराठी' },
  { code:'gu', name:'ગુજરાતી' }, { code:'kn', name:'ಕನ್ನಡ' },
  { code:'ml', name:'മലയാളം' }, { code:'ur', name:'اردو' },
  { code:'es', name:'Español' }, { code:'fr', name:'Français' },
  { code:'de', name:'Deutsch' }, { code:'ar', name:'العربية' },
  { code:'zh', name:'中文' }, { code:'pt', name:'Português' },
  { code:'ru', name:'Русский' }, { code:'ja', name:'日本語' },
]

const GRADES = [
  'Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10',
  '11th (Science)','11th (Commerce)','11th (Arts)',
  '12th (Science)','12th (Commerce)','12th (Arts)',
  'Undergraduate','Other'
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name:'', email:'', password:'', language:'en', grade_level:'Grade 10'
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to EduAI 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', zIndex:1
    }}>
      <div className="glass fade-up" style={{ width:'100%', maxWidth:460, padding:'44px 40px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:60, height:60, borderRadius:16, margin:'0 auto 14px',
            background:'linear-gradient(135deg,var(--primary),var(--primary-dim))',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:28
          }}>🧠</div>
          <h1 style={{ fontSize:'1.7rem', marginBottom:5 }}>Create your account</h1>
          <p style={{ fontSize:14, color:'var(--on-muted)' }}>Start your AI-powered learning journey</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your full name" required
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" required
                style={{ paddingRight:44 }}
                value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" onClick={() => setShowPw(v=>!v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'var(--on-muted)' }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* Two-column row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="input-group">
              <label>Grade / Level</label>
              <select value={form.grade_level} onChange={e => set('grade_level', e.target.value)}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Preferred Language</label>
              <select value={form.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'13px', marginTop:6 }}>
            {loading
              ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} />
              : <><UserPlus size={16} /> Create Account</>
            }
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:22, fontSize:14, color:'var(--on-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
