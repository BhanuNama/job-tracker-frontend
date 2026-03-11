import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Edit3, Trash2, Star, MapPin, DollarSign, Calendar, Globe, FileText, StickyNote, LayoutDashboard, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { confirmToast } from '../lib/confirmToast.jsx'
import { formatDistanceToNow, format } from 'date-fns'
import useUIStore from '../store/uiStore'

const STAGES = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed']
const STAGE_COLORS = { Saved: '#9095b0', Applied: '#60A5FA', Screening: '#A78BFA', Interviewing: '#FBBF24', 'Final Round': '#FB923C', Offer: '#34D399', Closed: '#55596e' }

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'jd', label: 'JD Summary', icon: Sparkles },
    { id: 'notes', label: 'Notes', icon: StickyNote },
]

export default function ApplicationDetailModal({ app, onClose }) {
    const [editing, setEditing] = useState(false)
    const [tab, setTab] = useState(app.jdSummary ? 'jd' : 'overview')
    const [form, setForm] = useState({ ...app, skills: app.skills?.join(', ') || '' })
    const queryClient = useQueryClient()
    const fireConfetti = useUIStore(s => s.fireConfetti)

    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/applications/${app._id}`, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['applications'])
            queryClient.invalidateQueries(['dashboard'])
            if (res.data.stage === 'Offer') fireConfetti()
            toast.success('Updated!')
            setEditing(false)
        },
        onError: () => toast.error('Update failed'),
    })

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/applications/${app._id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['applications'])
            queryClient.invalidateQueries(['dashboard'])
            toast.success('Deleted')
            onClose()
        },
    })

    const set = (f) => (e) => setForm(s => ({ ...s, [f]: e.target.value }))
    const save = () => updateMutation.mutate({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) })

    const stageColor = STAGE_COLORS[app.stage] || 'var(--teal)'

    // Tabs to show — hide JD Summary tab if there's no summary
    const visibleTabs = TABS.filter(t => t.id !== 'jd' || app.jdSummary)

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div
                className="modal"
                style={{ maxWidth: 600 }}
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* ── Header ── */}
                <div style={{ padding: '24px 28px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {editing
                                ? <input className="input" value={form.company} onChange={set('company')} style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, width: '100%' }} />
                                : <h2 style={{ margin: '0 0 4px', fontSize: 24, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.company}</h2>
                            }
                            {editing
                                ? <input className="input" value={form.role} onChange={set('role')} style={{ fontSize: 14, width: '100%' }} />
                                : <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>{app.role}</p>
                            }
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                            {app.jobUrl && <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: 8 }}><ExternalLink size={15} /></a>}
                            <button onClick={() => setEditing(!editing)} className="btn-ghost" style={{ padding: 8 }}><Edit3 size={15} /></button>
                            <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                        </div>
                    </div>

                    {/* Badges row */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                        {editing ? (
                            <select className="select" value={form.stage} onChange={set('stage')} style={{ width: 'auto', fontSize: 12 }}>
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, background: `${stageColor}18`, color: stageColor, fontSize: 12, fontWeight: 600, border: `1px solid ${stageColor}30` }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor, display: 'inline-block' }} />
                                {app.stage}
                            </span>
                        )}
                        {app.remote && <span className={`badge badge-${app.remote === 'remote' ? 'teal' : app.remote === 'hybrid' ? 'purple' : 'gray'}`}>{app.remote}</span>}
                        {app.rating > 0 && (
                            <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < app.rating ? '#FBBF24' : 'transparent'} color={i < app.rating ? '#FBBF24' : 'var(--text-muted)'} />)}
                            </span>
                        )}
                    </div>

                    {/* ── Tab bar ── */}
                    <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
                        {visibleTabs.map(({ id, label, icon: Icon }) => {
                            const active = tab === id
                            return (
                                <button
                                    key={id}
                                    onClick={() => setTab(id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '9px 16px', background: 'none', border: 'none',
                                        borderBottom: active ? '2px solid var(--teal)' : '2px solid transparent',
                                        color: active ? 'var(--teal)' : 'var(--text-muted)',
                                        cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Icon size={13} />
                                    {label}
                                    {id === 'jd' && app.jdSummary && (
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Tab content ── */}
                <div style={{ overflowY: 'auto', maxHeight: '55vh' }}>
                    <AnimatePresence mode="wait">
                        {/* OVERVIEW tab */}
                        {tab === 'overview' && (
                            <motion.div key="overview"
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.18 }}
                                style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    {app.salary?.min && (
                                        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><DollarSign size={10} />Salary</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>
                                                ${Math.round(app.salary.min / 1000)}k{app.salary.max ? ` – $${Math.round(app.salary.max / 1000)}k` : ''}
                                            </div>
                                        </div>
                                    )}
                                    {app.location && (
                                        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={10} />Location</div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{app.location}</div>
                                        </div>
                                    )}
                                    {app.appliedAt && (
                                        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={10} />Applied</div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</div>
                                        </div>
                                    )}
                                    {app.lastContact && (
                                        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={10} />Last Contact</div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDistanceToNow(new Date(app.lastContact), { addSuffix: true })}</div>
                                        </div>
                                    )}
                                </div>

                                {app.skills?.length > 0 && (
                                    <div>
                                        <div className="input-label" style={{ marginBottom: 8 }}>Skills Required</div>
                                        {editing
                                            ? <input className="input" value={form.skills} onChange={set('skills')} placeholder="React, TypeScript..." />
                                            : (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {app.skills.map(s => <span key={s} style={{ padding: '4px 10px', background: 'var(--bg-500)', borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--teal)' }}>{s}</span>)}
                                                </div>
                                            )
                                        }
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* JD SUMMARY tab */}
                        {tab === 'jd' && (
                            <motion.div key="jd"
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18 }}
                                style={{ padding: '20px 28px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Sparkles size={14} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>AI-Generated Summary</span>
                                </div>
                                <div style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14 }}>
                                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                                        {app.jdSummary}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* NOTES tab */}
                        {tab === 'notes' && (
                            <motion.div key="notes"
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18 }}
                                style={{ padding: '20px 28px' }}
                            >
                                <div className="input-label" style={{ marginBottom: 8 }}>Notes</div>
                                {editing
                                    ? <textarea className="input" value={form.notes} onChange={set('notes')} rows={6} style={{ resize: 'vertical' }} />
                                    : app.notes
                                        ? <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, padding: '14px 18px', background: 'var(--bg-600)', borderRadius: 12, whiteSpace: 'pre-wrap' }}>{app.notes}</p>
                                        : <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes yet. Click ✏️ to add some.</p>
                                }
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => confirmToast('Delete this application?', () => deleteMutation.mutate())}
                        className="btn-ghost"
                        style={{ color: 'var(--red)' }}
                    >
                        <Trash2 size={15} /> Delete
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} className="btn-secondary">Close</button>
                        {editing && (
                            <button onClick={save} className="btn-primary" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
