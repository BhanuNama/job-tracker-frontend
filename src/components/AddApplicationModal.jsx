import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Building2, Briefcase, MapPin, DollarSign, Link, Calendar, Star } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'

const STAGES = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed']

const defaultForm = {
    company: '', role: '', stage: 'Applied', location: '', remote: 'onsite',
    jobUrl: '', notes: '', skills: '', rating: 0,
    salary: { min: '', max: '' },
    appliedAt: new Date().toISOString().split('T')[0],
}

export default function AddApplicationModal({ onClose }) {
    const [form, setForm] = useState(defaultForm)
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
    const submit = (e) => {
        e.preventDefault()
        if (!form.company || !form.role) return toast.error('Company and role are required')
        mutation.mutate({
            ...form,
            skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            salary: { min: Number(form.salary.min) || undefined, max: Number(form.salary.max) || undefined },
            lastContact: form.stage === 'Applied' ? new Date() : undefined,
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
            >
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 22 }}>Add Application</h2>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                </div>

                <form onSubmit={submit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label className="input-label"><Building2 size={11} style={{ display: 'inline', marginRight: 5 }} />Company *</label>
                            <input className="input" placeholder="Stripe" value={form.company} onChange={set('company')} required />
                        </div>
                        <div>
                            <label className="input-label"><Briefcase size={11} style={{ display: 'inline', marginRight: 5 }} />Role *</label>
                            <input className="input" placeholder="Senior Engineer" value={form.role} onChange={set('role')} required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
            </motion.div>
        </div>
    )
}
