import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, ChevronDown, FileText, Sparkles, Loader2, CheckCircle, ChevronUp } from 'lucide-react'
import { ALL_SKILLS, APPLIED_THROUGH_OPTIONS } from '../lib/skills'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import useUIStore from '../store/uiStore'

const STAGES = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed']


// ─── Skills multi-select ──────────────────────────────────────────────────────
function SkillsPicker({ selected, onChange }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const filtered = ALL_SKILLS.filter(
        s => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
    ).slice(0, 30)

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const add = (skill) => { onChange([...selected, skill]); setQuery('') }
    const remove = (skill) => onChange(selected.filter(s => s !== skill))

    // Allow adding custom skill on Enter
    const handleKey = (e) => {
        if (e.key === 'Enter' && query.trim()) {
            e.preventDefault()
            const match = ALL_SKILLS.find(s => s.toLowerCase() === query.toLowerCase())
            add(match || query.trim())
        }
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Selected chips */}
            {selected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {selected.map(s => (
                        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'rgba(0,229,204,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, fontSize: 12, color: 'var(--teal)' }}>
                            {s}
                            <button type="button" onClick={() => remove(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', padding: 0, lineHeight: 1, display: 'flex' }}>
                                <X size={11} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                    className="input"
                    placeholder="Search & add skills (Enter to add custom)…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKey}
                    style={{ paddingLeft: 34 }}
                />
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (query || filtered.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, maxHeight: 220, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
                    >
                        {filtered.map(skill => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => add(skill)}
                                style={{ width: '100%', text: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-500)'}
                                onMouseOut={e => e.currentTarget.style.background = 'none'}
                            >
                                <span style={{ flex: 1 }}>{skill}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+</span>
                            </button>
                        ))}
                        {filtered.length === 0 && query && (
                            <button
                                type="button"
                                onClick={() => add(query.trim())}
                                style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13, textAlign: 'left' }}
                            >
                                Add "{query.trim()}" as custom skill ↵
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Main Form ─────────────────────────────────────────────────────────────────
const defaultForm = {
    company: '', role: '', stage: 'Applied', location: '', remote: 'onsite',
    jobUrl: '', notes: '', skills: [], appliedThrough: 'Company Website',
    expectedSalary: '', resumeUsed: '',
    appliedAt: new Date().toISOString().split('T')[0],
}

export default function ApplicationFormModal({ onClose, prefill = null }) {
    const isEdit = Boolean(prefill)
    const queryClient = useQueryClient()
    const fireConfetti = useUIStore(s => s.fireConfetti)
    const { data: vaultDocs = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => api.get('/documents').then(r => r.data),
    })
    const resumeOptions = vaultDocs.filter(d => d.type === 'resume').map(d => d.name)

    const [form, setForm] = useState(() => {
        if (!prefill) return defaultForm
        return {
            ...defaultForm,
            ...prefill,
            skills: Array.isArray(prefill.skills) ? prefill.skills : [],
            expectedSalary: prefill.expectedSalary || prefill.salary?.max || '',
            appliedAt: prefill.appliedAt ? new Date(prefill.appliedAt).toISOString().split('T')[0] : defaultForm.appliedAt,
            appliedThrough: prefill.appliedThrough || 'Company Website',
            resumeUsed: prefill.resumeUsed || '',
        }
    })

    // ── AI JD Parser state ──────────────────────────────────────────
    const [jdText, setJdText] = useState('')
    const [jdSummary, setJdSummary] = useState('')
    const [jdOpen, setJdOpen] = useState(true)
    const [summaryOpen, setSummaryOpen] = useState(true)
    const [parsing, setParsing] = useState(false)
    const [parsed, setParsed] = useState(false)

    const parseJD = async () => {
        if (!jdText.trim()) return toast.error('Paste a job description first')
        setParsing(true); setParsed(false)
        try {
            const { data } = await api.post('/ai/parse-jd', { jdText })
            setForm(f => ({
                ...f,
                company: data.company || f.company,
                role: data.role || f.role,
                location: data.location || f.location,
                remote: data.remote || f.remote,
                jobUrl: data.jobUrl || f.jobUrl,
                expectedSalary: data.salary?.max ? String(data.salary.max) : f.expectedSalary,
                skills: data.skills?.length
                    ? [...new Set([...f.skills, ...data.skills])]
                    : f.skills,
            }))
            if (data.jdSummary) setJdSummary(data.jdSummary)
            setParsed(true); setJdOpen(false)
            toast.success('Fields filled from JD ✨')
        } catch (err) {
            toast.error(err.response?.data?.error || 'AI parsing failed')
        } finally {
            setParsing(false)
        }
    }

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

    const mutation = useMutation({
        mutationFn: (data) => isEdit
            ? api.put(`/applications/${prefill._id}`, data)
            : api.post('/applications', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['applications'])
            queryClient.invalidateQueries(['dashboard'])
            if (res.data.stage === 'Offer') fireConfetti()
            toast.success(isEdit ? 'Application updated!' : `Added ${form.company}!`)
            onClose()
        },
        onError: (err) => toast.error(err.response?.data?.error || (isEdit ? 'Update failed' : 'Failed to add')),
    })

    const submit = (e) => {
        e.preventDefault()
        if (!form.company || !form.role) return toast.error('Company and role are required')
        mutation.mutate({
            ...form,
            salary: { max: Number(form.expectedSalary) || undefined },
            expectedSalary: Number(form.expectedSalary) || undefined,
            lastContact: (!isEdit && form.stage === 'Applied') ? new Date() : undefined,
            jdSummary: jdSummary || undefined,
        })
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div
                className="modal"
                style={{ maxWidth: 660 }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Header */}
                <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 22 }}>{isEdit ? `Edit — ${prefill.company}` : 'Add Application'}</h2>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                </div>

                <form onSubmit={submit}>
                    <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '72vh' }}>

                        {/* ── AI JD Parser ── */}
                        {!isEdit && (
                            <>
                                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14 }}>
                                    <button type="button" onClick={() => setJdOpen(o => !o)}
                                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-primary)', borderRadius: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Sparkles size={15} color="#fff" />
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    ✨ Parse from Job Description
                                                    {parsed && <CheckCircle size={13} color="var(--teal)" />}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                                    {parsed ? 'Fields auto-filled — edit below if needed' : 'Paste a JD and AI fills the form for you'}
                                                </div>
                                            </div>
                                        </div>
                                        {jdOpen ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                                    </button>
                                    {jdOpen && (
                                        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <textarea
                                                value={jdText} onChange={e => setJdText(e.target.value)}
                                                placeholder="Paste the full job description here — title, company, responsibilities, requirements, salary, location…"
                                                className="input" rows={5}
                                                style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
                                            />
                                            <button type="button" onClick={parseJD} disabled={parsing || !jdText.trim()} className="btn-primary"
                                                style={{ alignSelf: 'flex-start', opacity: (!jdText.trim() || parsing) ? 0.6 : 1 }}>
                                                {parsing
                                                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Parsing…</>
                                                    : <><Sparkles size={14} /> Parse with AI</>}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* AI Summary Card */}
                                {jdSummary && (
                                    <div style={{ background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 12 }}>
                                        <button type="button" onClick={() => setSummaryOpen(o => !o)}
                                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <FileText size={13} color="var(--teal)" />
                                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Job Summary</span>
                                            </div>
                                            {summaryOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                        </button>
                                        {summaryOpen && (
                                            <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{jdSummary}</p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        <div className="form-grid-2">
                            <div>
                                <label className="input-label">Company *</label>
                                <input className="input" placeholder="Stripe" value={form.company} onChange={set('company')} required />
                            </div>
                            <div>
                                <label className="input-label">Role *</label>
                                <input className="input" placeholder="Senior Engineer" value={form.role} onChange={set('role')} required />
                            </div>
                        </div>

                        {/* Row 2: Stage + Applied Through */}
                        <div className="form-grid-2">
                            <div>
                                <label className="input-label">Pipeline Stage</label>
                                <select className="select" value={form.stage} onChange={set('stage')}>
                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Applied Through</label>
                                <select className="select" value={form.appliedThrough} onChange={set('appliedThrough')}>
                                    {APPLIED_THROUGH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Location + Work Type + Expected Salary */}
                        <div className="form-grid-3">
                            <div>
                                <label className="input-label">Location</label>
                                <input className="input" placeholder="San Francisco, CA" value={form.location} onChange={set('location')} />
                            </div>
                            <div>
                                <label className="input-label">Work Type</label>
                                <select className="select" value={form.remote} onChange={set('remote')}>
                                    <option value="onsite">On-site</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="remote">Remote</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Expected Salary (USD)</label>
                                <input className="input" type="number" placeholder="180000" value={form.expectedSalary} onChange={set('expectedSalary')} />
                            </div>
                        </div>

                        {/* Row 4: Job URL + Applied Date */}
                        <div className="form-grid-2">
                            <div>
                                <label className="input-label">Job URL</label>
                                <input className="input" placeholder="https://..." value={form.jobUrl} onChange={set('jobUrl')} />
                            </div>
                            <div>
                                <label className="input-label">Applied Date</label>
                                <input className="input" type="date" value={form.appliedAt} onChange={set('appliedAt')} />
                            </div>
                        </div>

                        {/* Resume from Vault */}
                        <div>
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FileText size={11} /> Resume Used (from Vault)
                            </label>
                            {vaultDocs.length === 0 ? (
                                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-600)', border: '1px dashed var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                                    No resumes in vault yet — upload one in Resume Vault first
                                </div>
                            ) : (
                                <select className="select" value={form.resumeUsed} onChange={set('resumeUsed')}>
                                    <option value="">— None selected —</option>
                                    {resumeOptions.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="input-label">Skills Required</label>
                            <SkillsPicker selected={form.skills} onChange={skills => setForm(f => ({ ...f, skills }))} />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="input-label">Notes</label>
                            <textarea
                                className="input"
                                placeholder="Referral from Sarah. Strong focus on payments infra. Recruiter name: John."
                                value={form.notes}
                                onChange={set('notes')}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Application')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
