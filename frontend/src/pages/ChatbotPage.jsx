import { useState, useEffect, useRef } from 'react'
import { chatApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Send, Plus, MessageCircle, Trash2, Bot, User } from 'lucide-react'
const uuidv4 = () => crypto.randomUUID()

const SUBJECTS = ['General','Mathematics','Physics','Chemistry','Biology','English','History','Computer Science','Economics']
const LANG_OPTIONS = [['en','English'],['hi','Hindi'],['bn','Bengali'],['ta','Tamil'],['te','Telugu'],['mr','Marathi'],['es','Spanish'],['fr','French'],['de','German'],['ar','Arabic'],['zh','Chinese'],['pt','Portuguese']]

export default function ChatbotPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState('General')
  const [language, setLanguage] = useState(user?.language || 'en')
  const bottomRef = useRef(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const { data } = await chatApi.sessions()
      setSessions(data.sessions || [])
    } catch { /* ignore */ }
  }

  const newSession = () => {
    const id = uuidv4()
    setCurrentSession(id)
    setMessages([{
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your EduAI tutor. I'm here to help you understand any topic, solve doubts, or guide your studies. What would you like to learn today?`,
      timestamp: new Date().toISOString()
    }])
  }

  const loadSession = async (sessionId) => {
    try {
      const { data } = await chatApi.getSession(sessionId)
      setCurrentSession(sessionId)
      setMessages(data.chat.messages || [])
    } catch {
      toast.error('Failed to load session')
    }
  }

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation()
    try {
      await chatApi.deleteSession(sessionId)
      setSessions(s => s.filter(x => x.session_id !== sessionId))
      if (currentSession === sessionId) { setCurrentSession(null); setMessages([]) }
      toast.success('Session deleted')
    } catch { toast.error('Failed to delete') }
  }

  const send = async () => {
    if (!input.trim() || sending) return
    if (!currentSession) return toast.error('Start a new session first')

    const userMsg = { role:'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)

    try {
      const { data } = await chatApi.send({
        message: userMsg.content,
        session_id: currentSession,
        subject_context: subject !== 'General' ? subject : null,
        language
      })
      setMessages(m => [...m, { role:'assistant', content: data.response, timestamp: new Date().toISOString() }])
      loadSessions()
    } catch {
      toast.error('Failed to get response')
      setMessages(m => m.filter(x => x !== userMsg))
    } finally { setSending(false) }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20, height:'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div className="glass-sm" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px', borderBottom:'1px solid var(--outline)' }}>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={newSession}>
            <Plus size={15} /> New Chat
          </button>
        </div>

        {/* Context selectors */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--outline)' }}>
          <div className="input-group" style={{ marginBottom:8 }}>
            <label>Subject Focus</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              {LANG_OPTIONS.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Session list */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {sessions.length === 0 && (
            <p style={{ padding:12, fontSize:13, color:'var(--on-muted)', textAlign:'center' }}>No previous chats</p>
          )}
          {sessions.map(s => (
            <button key={s.session_id} onClick={() => loadSession(s.session_id)}
              style={{
                width:'100%', background: currentSession===s.session_id?'rgba(197,154,255,0.12)':'none',
                border: currentSession===s.session_id?'1px solid rgba(197,154,255,0.2)':'1px solid transparent',
                borderRadius:'var(--radius-md)', padding:'10px 12px', cursor:'pointer',
                textAlign:'left', marginBottom:4, transition:'all var(--transition)'
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--on-surface)' }}>
                    {s.subject_context || 'General'} Chat
                  </div>
                  <div style={{ fontSize:11, color:'var(--on-muted)', marginTop:2 }}>
                    {s.message_count} messages · {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={(e) => deleteSession(s.session_id, e)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--on-muted)', padding:4 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="glass-sm" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--outline)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--primary),var(--primary-dim))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🧠</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>EduAI Tutor</div>
            <div style={{ fontSize:11, color:'var(--tertiary)' }}>● Online · {subject} mode · {LANG_OPTIONS.find(l=>l[0]===language)?.[1]}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {!currentSession && (
            <div style={{ textAlign:'center', marginTop:60 }}>
              <div style={{ fontSize:56, marginBottom:16 }}>💬</div>
              <h3 style={{ marginBottom:8 }}>Start a conversation</h3>
              <p style={{ color:'var(--on-muted)', fontSize:14 }}>Ask me anything about your studies!</p>
              <button className="btn btn-primary" style={{ marginTop:20 }} onClick={newSession}>
                <Plus size={15} /> New Chat
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display:'flex', gap:10, marginBottom:16,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', flexShrink:0,
                background: msg.role === 'user' ? 'linear-gradient(135deg,var(--primary),var(--primary-dim))' : 'var(--surface-br)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14
              }}>
                {msg.role === 'user' ? <User size={14} /> : '🧠'}
              </div>
              <div style={{ maxWidth:'72%' }}>
                <div style={{
                  padding:'12px 16px', borderRadius: msg.role==='user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role==='user' ? 'linear-gradient(135deg,rgba(197,154,255,0.25),rgba(149,71,247,0.2))' : 'var(--surface-hi)',
                  fontSize:14, lineHeight:1.7, color:'var(--on-surface)',
                  border:'1px solid var(--outline)'
                }}>
                  <pre style={{ whiteSpace:'pre-wrap', fontFamily:'var(--font-body)', margin:0 }}>{msg.content}</pre>
                </div>
                <div style={{ fontSize:10, color:'var(--on-muted)', marginTop:4, textAlign: msg.role==='user'?'right':'left' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-br)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🧠</div>
              <div style={{ padding:'12px 16px', background:'var(--surface-hi)', borderRadius:'4px 16px 16px 16px', border:'1px solid var(--outline)' }}>
                <span style={{ display:'flex', gap:4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary)', animation:`bounce 0.8s ${i*0.15}s infinite` }} />)}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid var(--outline)' }}>
          <div style={{ display:'flex', gap:10 }}>
            <textarea
              rows={1}
              placeholder="Ask anything about your studies... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={!currentSession || sending}
              style={{ flex:1, resize:'none', borderRadius:'var(--radius-lg)', padding:'12px 16px', fontSize:14, minHeight:46, maxHeight:120 }}
            />
            <button className="btn btn-primary" onClick={send} disabled={!input.trim() || sending || !currentSession}
              style={{ padding:'0 18px', alignSelf:'flex-end', height:46 }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  )
}
