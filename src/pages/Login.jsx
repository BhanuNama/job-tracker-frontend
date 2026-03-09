import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, TrendingUp, Users, Target } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const features = [
    { icon: TrendingUp, label: 'Funnel Analytics', color: '#A78BFA' },
    { icon: Zap, label: 'Ghosting Radar™', color: '#FBBF24' },
    { icon: Target, label: 'Offer Matrix', color: '#34D399' },
]

export default function Login() {
    const [mode, setMode] = useState('login')
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [showPass, setShowPass] = useState(false)
    const { login, register, demoLogin, isLoading } = useAuthStore()
    const navigate = useNavigate()

    const handle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        if (!form.email || !form.password) return toast.error('Please fill in all fields')
        const result = mode === 'login'
            ? await login(form.email, form.password)
            : await register(form.name, form.email, form.password)
        if (result.success) {
            toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
            navigate('/')
        } else {
            toast.error(result.error)
        }
    }

    const demo = async () => {
        const result = await demoLogin()
        if (result.success) { toast.success('Welcome to JobTrack Pro!'); navigate('/') }
        else toast.error('Demo login failed — is the backend running?')
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-900)', display: 'flex', overflow: 'hidden' }}>
            {/* Left Panel */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', position: 'relative' }}
            >
                {/* Background glow */}
                <div style={{ position: 'absolute', top: '10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,204,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00E5CC, #00b8d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={20} color="#0a0b0f" />
                    </div>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 }}>JobTrack <span style={{ color: 'var(--teal)' }}>Pro</span></span>
                </div>

                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, lineHeight: 1.15, margin: '0 0 16px' }}>
                    Your personal<br /><span className="gradient-text">job search HQ</span>
                </h1>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 48, maxWidth: 440 }}>
                    Track every application, nail every follow-up, and decode your pipeline with AI-powered insights. Zero missed opportunities.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {features.map(({ icon: Icon, label, color }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-700)', border: '1px solid var(--border)' }}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={15} color={color} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Right Panel — Form */}
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ width: 440, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 48px', borderLeft: '1px solid var(--border)', background: 'var(--bg-800)' }}
            >
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
                    {mode === 'login' ? "Don't have an account?" : 'Already have one?'}{' '}
                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        {mode === 'login' ? 'Create one' : 'Sign in'}
                    </button>
                </p>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {mode === 'register' && (
                        <div>
                            <label className="input-label">Full Name</label>
                            <input className="input" type="text" placeholder="Alex Johnson" value={form.name} onChange={handle('name')} />
                        </div>
                    )}
                    <div>
                        <label className="input-label">Email</label>
                        <input className="input" type="email" placeholder="hello@example.com" value={form.email} onChange={handle('email')} />
                    </div>
                    <div>
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handle('password')} style={{ paddingRight: 40 }} />
                            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button className="btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '13px 20px', fontSize: 15 }}>
                        {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <button
                    onClick={demo}
                    disabled={isLoading}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, borderStyle: 'dashed' }}
                >
                    <Zap size={16} color="var(--teal)" />
                    Try Demo Account
                </button>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
                    Demo: demo@jobtrack.pro / demo123456
                </p>
            </motion.div>
        </div>
    )
}
