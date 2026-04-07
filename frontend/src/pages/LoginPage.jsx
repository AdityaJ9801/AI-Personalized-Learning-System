import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Brain, Sparkles } from 'lucide-react'

const LANGUAGES = [
  { code:'en', name:'English' }, { code:'hi', name:'Hindi' },
  { code:'bn', name:'Bengali' }, { code:'ta', name:'Tamil' },
  { code:'te', name:'Telugu' }, { code:'mr', name:'Marathi' },
  { code:'gu', name:'Gujarati' }, { code:'kn', name:'Kannada' },
  { code:'es', name:'Spanish' }, { code:'fr', name:'French' },
  { code:'de', name:'German' }, { code:'ar', name:'Arabic' },
  { code:'zh', name:'Chinese' }, { code:'pt', name:'Portuguese' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email:'', password:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', zIndex:1
    }}>
      <div className="glass fade-up" style={{ width:'100%', maxWidth:440, padding:'48px 40px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            width:64, height:64, borderRadius:18, margin:'0 auto 16px',
            background:'linear-gradient(135deg,var(--primary),var(--primary-dim))',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:30
          }}>🧠</div>
          <h1 style={{ fontSize:'1.8rem', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'var(--on-muted)' }}>Sign in to your EduAI account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="input-group">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                style={{ paddingRight:44 }}
                value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
              <button type="button" onClick={() => setShowPw(v=>!v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'var(--on-muted)' }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'13px', marginTop:4 }}>
            {loading ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} /> : <>
              <Sparkles size={16} /> Sign In
            </>}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'var(--on-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}
