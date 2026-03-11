import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Zap, TrendingUp, Target, ArrowRight, ArrowLeft, LogIn, UserPlus, Sun, Moon } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const features = [
    { icon: TrendingUp, label: 'Funnel Analytics', color: '#A78BFA' },
    { icon: Zap, label: 'Ghosting Radar™', color: '#FBBF24' },
    { icon: Target, label: 'Offer Matrix', color: '#34D399' },
]

const slideVariants = {
    enterFromRight: { x: '100%', opacity: 0 },
    enterFromLeft: { x: '-100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: '-100%', opacity: 0 },
    exitToRight: { x: '100%', opacity: 0 },
}

// ─── FormContent lives OUTSIDE Login so it never re-mounts on keystroke ───────
function FormContent({ isMobile, mode, form, setForm, showPass, setShowPass, isLoading, onBack, onToggleMode, onSubmit, onDemo }) {
    const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
    return (
        <>
            {isMobile && (
                <button
                    type="button"
                    onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 28, padding: 0 }}
                >
                    <ArrowLeft size={15} /> Back
                </button>
            )}

            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? 32 : 28, fontWeight: 700, marginBottom: 8 }}>
                {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
                {mode === 'login' ? "Don't have an account?" : 'Already have one?'}{' '}
                <button onClick={onToggleMode} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
            </p>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                        <input
                            className="input"
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handle('password')}
                            style={{ paddingRight: 40 }}
                        />
                        <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <button className="btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '13px 20px', fontSize: 15 }}>
                    {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button onClick={onDemo} disabled={isLoading} className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, borderStyle: 'dashed' }}>
                <Zap size={16} color="var(--teal)" /> Try Demo Account
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
                Demo: demo@jobtrack.pro / demo123456
            </p>
        </>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Login() {
    const [mode, setMode] = useState('login')
    const [mobilePanel, setMobilePanel] = useState('welcome')
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [showPass, setShowPass] = useState(false)
    const { login, register, demoLogin, isLoading } = useAuthStore()
    const navigate = useNavigate()

    const [theme, setTheme] = useState('light')

    useEffect(() => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light'
        setTheme(currentTheme)
        document.documentElement.setAttribute('data-theme', currentTheme)
    }, [])

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(nextTheme)
        document.documentElement.setAttribute('data-theme', nextTheme)
        localStorage.setItem('theme', nextTheme)
    }

    const goTo = (panel) => {
        setMobilePanel(panel)
        if (panel !== 'welcome') setMode(panel)
    }

    const handleSubmit = async (e) => {
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

    const handleDemo = async () => {
        const result = await demoLogin()
        if (result.success) { toast.success('Welcome to JobTrack Pro!'); navigate('/') }
        else toast.error('Demo login failed — is the backend running?')
    }

    const toggleMode = () => {
        const next = mode === 'login' ? 'register' : 'login'
        setMode(next)
        if (mobilePanel !== 'welcome') setMobilePanel(next)
    }

    const sharedProps = { form, setForm, showPass, setShowPass, isLoading, mode, onSubmit: handleSubmit, onDemo: handleDemo, onToggleMode: toggleMode }

    return (
        <>
            {/* ══════════════════════════════════════
                DESKTOP (≥769px)
            ══════════════════════════════════════ */}
            <div className="login-desktop" style={{ minHeight: '100vh', background: 'var(--bg-900)', display: 'flex', overflowY: 'auto', position: 'relative' }}>
                <button
                    onClick={toggleTheme}
                    style={{ position: 'absolute', top: 24, right: 24, zIndex: 50, background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                {/* Left marketing panel */}
                <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'none', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'none', pointerEvents: 'none' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={20} color="#0a0b0f" />
                        </div>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 }}>
                            JobTrack <span style={{ color: 'var(--teal)' }}>Pro</span>
                        </span>
                    </div>

                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, lineHeight: 1.15, margin: '0 0 16px' }}>
                        Your personal<br /><span className="gradient-text">job search HQ</span>
                    </h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 48, maxWidth: 440 }}>
                        Track every application, nail every follow-up, and decode your pipeline with AI-powered insights.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {features.map(({ icon: Icon, label, color }, i) => (
                            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-700)', border: '1px solid var(--border)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={15} color={color} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right form panel */}
                <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    style={{ width: 440, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', borderLeft: '1px solid var(--border)', background: 'var(--bg-800)' }}>
                    <FormContent isMobile={false} {...sharedProps} onBack={() => { }} />
                </motion.div>
            </div>

            {/* ══════════════════════════════════════
                MOBILE (≤768px)
            ══════════════════════════════════════ */}
            <div className="login-mobile" style={{ minHeight: '100vh', background: 'var(--bg-900)', overflow: 'hidden', position: 'relative' }}>
                <button
                    onClick={toggleTheme}
                    style={{ position: 'absolute', top: 16, right: 16, zIndex: 100, background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <AnimatePresence mode="wait">

                    {/* Panel 1 — Welcome */}
                    {mobilePanel === 'welcome' && (
                        <motion.div key="welcome"
                            variants={slideVariants} initial="enterFromLeft" animate="center" exit="exitToLeft"
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '56px 28px 48px', overflowY: 'auto' }}
                        >
                            <div style={{ position: 'fixed', top: '-10%', left: '-20%', width: 340, height: 340, borderRadius: '50%', background: 'none', pointerEvents: 'none' }} />
                            <div style={{ position: 'fixed', bottom: '5%', right: '-15%', width: 280, height: 280, borderRadius: '50%', background: 'none', pointerEvents: 'none' }} />

                            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={21} color="#0a0b0f" />
                                </div>
                                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 }}>
                                    JobTrack <span style={{ color: 'var(--teal)' }}>Pro</span>
                                </span>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: '0 0 14px' }}>
                                    Your personal<br /><span className="gradient-text">job search HQ</span>
                                </h1>
                                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
                                    Track every application and decode your pipeline with AI insights.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 44 }}>
                                {features.map(({ icon: Icon, label, color }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'var(--bg-700)', border: '1px solid var(--border)' }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={16} color={color} />
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                                <button className="btn-primary" onClick={() => goTo('login')}
                                    style={{ width: '100%', justifyContent: 'center', padding: '16px 20px', fontSize: 16, borderRadius: 14 }}>
                                    <LogIn size={18} /> Sign In <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
                                </button>
                                <button className="btn-secondary" onClick={() => goTo('register')}
                                    style={{ width: '100%', justifyContent: 'center', padding: '16px 20px', fontSize: 16, borderRadius: 14 }}>
                                    <UserPlus size={18} /> Create Account <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
                                </button>
                                <button onClick={handleDemo} disabled={isLoading} className="btn-secondary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 14, borderStyle: 'dashed' }}>
                                    <Zap size={15} color="var(--teal)" /> Try Demo Account
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Panel 2 — Login or Register */}
                    {(mobilePanel === 'login' || mobilePanel === 'register') && (
                        <motion.div key={mobilePanel}
                            variants={slideVariants} initial="enterFromRight" animate="center" exit="exitToRight"
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '56px 28px 48px', overflowY: 'auto', background: 'var(--bg-800)' }}
                        >
                            <div style={{ position: 'fixed', top: '-10%', right: '-20%', width: 280, height: 280, borderRadius: '50%', background: 'none', pointerEvents: 'none' }} />
                            <FormContent isMobile={true} {...sharedProps} onBack={() => goTo('welcome')} />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </>
    )
}
