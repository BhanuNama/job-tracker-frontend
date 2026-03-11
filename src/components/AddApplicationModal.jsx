import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, Briefcase, MapPin, DollarSign, Link, Calendar, Star, Sparkles, ChevronDown, ChevronUp, Loader2, FileText, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'

const STAGES = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed']

const defaultForm = {
    company: '', role: '', stage: 'Applied', location: '', remote: 'onsite',
    jobUrl: '', notes: '', skills: '', rating: 0,
    salary: { min: '', max: '' },
    appliedAt: new Date().toISOString().split('T')[0],
    jobDescription: '',
}

export default function AddApplicationModal({ onClose }) {
    const [form, setForm] = useState(defaultForm)
    const [jdText, setJdText] = useState('')
    const [jdSummary, setJdSummary] = useState('')
    const [jdOpen, setJdOpen] = useState(true)
    const [summaryOpen, setSummaryOpen] = useState(true)
    const [parsing, setParsing] = useState(false)
    const [parsed, setParsed] = useState(false)
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (data) => api.post('/applications', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['applications'])
            queryClient.invalidateQueries(['dashboard'])
            toast.success(`Added ${form.company || 'application'}!`)
            onClose()
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to add'),
    })

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

    const parseJD = async () => {
        if (!jdText.trim()) return toast.error('Paste a job description first')
        setParsing(true)
        setParsed(false)
        try {
            const { data } = await api.post('/ai/parse-jd', { jdText })
            setForm(f => ({
                ...f,
                company: data.company || f.company,
                role: data.role || f.role,
                location: data.location || f.location,
                remote: data.remote || f.remote,
                skills: data.skills?.join(', ') || f.skills,
                jobUrl: data.jobUrl || f.jobUrl,
                salary: {
                    min: data.salary?.min !== null ? String(data.salary?.min ?? '') : f.salary.min,
                    max: data.salary?.max !== null ? String(data.salary?.max ?? '') : f.salary.max,
                },
                jobDescription: data.jdSummary || f.jobDescription,
            }))
            if (data.jdSummary) setJdSummary(data.jdSummary)
            setParsed(true)
            setJdOpen(false)
            toast.success('Fields filled from JD ✨')
        } catch (err) {
            toast.error(err.response?.data?.error || 'AI parsing failed')
        } finally {
            setParsing(false)
        }
    }

    const submit = (e) => {
        e.preventDefault()
        if (!form.company || !form.role) return toast.error('Company and role are required')
        mutation.mutate({
            ...form,
            skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            salary: { min: Number(form.salary.min) || undefined, max: Number(form.salary.max) || undefined },
            lastContact: form.stage === 'Applied' ? new Date() : undefined,
            jobDescription: jdSummary || form.jobDescription || undefined,
        })
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div
                className="modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ maxWidth: 680 }}
            >
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 20 }}>Add Application</h2>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── AI JD Parser Section ── */}
                    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, overflow: 'hidden' }}>
                        {/* Collapsible header */}
                        <button
                            type="button"
                            onClick={() => setJdOpen(o => !o)}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-primary)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={15} color="#fff" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Parse from Job Description
                                        {parsed && <CheckCircle size={14} color="var(--teal)" />}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                        {parsed ? 'Fields auto-filled — edit below if needed' : 'Paste a JD and let AI fill the form for you'}
                                    </div>
                                </div>
                            </div>
                            {jdOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                        </button>

                        <AnimatePresence initial={false}>
                            {jdOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <textarea
                                            value={jdText}
                                            onChange={e => setJdText(e.target.value)}
                                            placeholder="Paste the full job description here — job title, company, responsibilities, requirements, salary, location…"
                                            className="input"
                                            rows={6}
                                            style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={parseJD}
                                            disabled={parsing || !jdText.trim()}
                                            className="btn-primary"
                                            style={{ alignSelf: 'flex-start', gap: 8, opacity: (!jdText.trim() || parsing) ? 0.6 : 1 }}
                                        >
                                            {parsing
                                                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Parsing…</>
                                                : <><Sparkles size={15} /> Parse with AI</>
                                            }
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── AI Summary Card ── */}
                    <AnimatePresence>
                        {jdSummary && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                style={{ background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSummaryOpen(o => !o)}
                                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FileText size={14} color="var(--teal)" />
                                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Job Summary</span>
                                    </div>
                                    {summaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                <AnimatePresence initial={false}>
                                    {summaryOpen && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                                {jdSummary}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Form ── */}
                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-grid-2">
                            <div>
                                <label className="input-label"><Building2 size={11} style={{ display: 'inline', marginRight: 5 }} />Company *</label>
                                <input className="input" placeholder="Stripe" value={form.company} onChange={set('company')} required />
                            </div>
                            <div>
                                <label className="input-label"><Briefcase size={11} style={{ display: 'inline', marginRight: 5 }} />Role *</label>
                                <input className="input" placeholder="Senior Engineer" value={form.role} onChange={set('role')} required />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div>
                                <label className="input-label">Stage</label>
                                <select className="select" value={form.stage} onChange={set('stage')}>
                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Work Type</label>
                                <select className="select" value={form.remote} onChange={set('remote')}>
                                    <option value="onsite">On-site</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="remote">Remote</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-3">
                            <div>
                                <label className="input-label"><MapPin size={11} style={{ display: 'inline', marginRight: 5 }} />Location</label>
                                <input className="input" placeholder="San Francisco, CA" value={form.location} onChange={set('location')} />
                            </div>
                            <div>
                                <label className="input-label"><DollarSign size={11} style={{ display: 'inline', marginRight: 5 }} />Salary Min</label>
                                <input className="input" type="number" placeholder="150000" value={form.salary.min} onChange={(e) => setForm(f => ({ ...f, salary: { ...f.salary, min: e.target.value } }))} />
                            </div>
                            <div>
                                <label className="input-label">Salary Max</label>
                                <input className="input" type="number" placeholder="200000" value={form.salary.max} onChange={(e) => setForm(f => ({ ...f, salary: { ...f.salary, max: e.target.value } }))} />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div>
                                <label className="input-label"><Link size={11} style={{ display: 'inline', marginRight: 5 }} />Job URL</label>
                                <input className="input" placeholder="https://..." value={form.jobUrl} onChange={set('jobUrl')} />
                            </div>
                            <div>
                                <label className="input-label"><Calendar size={11} style={{ display: 'inline', marginRight: 5 }} />Applied Date</label>
                                <input className="input" type="date" value={form.appliedAt} onChange={set('appliedAt')} />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Skills (comma-separated)</label>
                            <input className="input" placeholder="React, TypeScript, GraphQL" value={form.skills} onChange={set('skills')} />
                        </div>

                        <div>
                            <label className="input-label">Notes</label>
                            <textarea className="input" placeholder="Referral from Sarah. Big interest in payments team." value={form.notes} onChange={set('notes')} rows={3} style={{ resize: 'vertical' }} />
                        </div>

                        <div>
                            <label className="input-label"><Star size={11} style={{ display: 'inline', marginRight: 5 }} />Priority Rating</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        <Star size={22} fill={n <= form.rating ? '#FBBF24' : 'transparent'} color={n <= form.rating ? '#FBBF24' : 'var(--text-muted)'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Adding...' : 'Add Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
