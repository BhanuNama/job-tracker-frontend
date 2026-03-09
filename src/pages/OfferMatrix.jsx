import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Scale, Plus, X, Star, TrendingUp, DollarSign, Building2 } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const WEIGHTS_DEFAULT = { salary: 30, growth: 20, culture: 20, remote: 15, benefits: 15 }

const emptyOffer = { company: '', role: '', baseSalary: '', bonus: '', equity: '', pto: '', remote: 'hybrid', culture: 3, growth: 3, manager: 3, health: '', notes: '' }

function ScoreBar({ label, value, max = 5, color = 'var(--teal)' }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{value}/{max}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-500)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: color, borderRadius: 3 }} />
            </div>
        </div>
    )
}

function calcScore(offer, weights) {
    const salaryScore = Math.min((Number(offer.baseSalary) / 250000) * 5, 5)
    const weighted =
        (salaryScore * weights.salary / 100) +
        (offer.growth * weights.growth / 100) +
        (offer.culture * weights.culture / 100) +
        ((offer.remote === 'remote' ? 5 : offer.remote === 'hybrid' ? 3.5 : 2) * weights.remote / 100) +
        ((Number(offer.pto || 0) / 30 * 5) * weights.benefits / 100)
    return Math.min(weighted * 20, 100).toFixed(0)
}

export default function OfferMatrix() {
    const queryClient = useQueryClient()
    const [weights, setWeights] = useState(WEIGHTS_DEFAULT)
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState(emptyOffer)

    const { data: savedOffers = [], isLoading } = useQuery({
        queryKey: ['offers'],
        queryFn: () => api.get('/offers').then(r => r.data),
    })

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/offers', data),
        onSuccess: () => { queryClient.invalidateQueries(['offers']); setShowAdd(false); setForm(emptyOffer); toast.success('Offer added!') },
        onError: () => toast.error('Failed to add offer'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/offers/${id}`),
        onSuccess: () => { queryClient.invalidateQueries(['offers']); toast.success('Removed') },
        onError: () => toast.error('Delete failed'),
    })

    const { data: applications = [] } = useQuery({
        queryKey: ['applications'],
        queryFn: () => api.get('/applications').then(r => r.data.filter(a => a.stage === 'Offer')),
    })

    const set = (f) => (e) => setForm(s => ({ ...s, [f]: e.target.value }))
    const addOffer = () => {
        if (!form.company) return toast.error('Company is required')
        addMutation.mutate(form)
    }

    const allOffers = [
        ...savedOffers,
        ...applications
            .filter(a => !savedOffers.find(o => o.company === a.company))
            .map(a => ({
                _id: a._id, company: a.company, role: a.role,
                baseSalary: a.salary?.max || 0, bonus: 0,
                equity: '', pto: 20, remote: a.remote,
                culture: 3, growth: 3, manager: 3, notes: a.notes || '',
            }))
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Offer Matrix</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Compare offers side-by-side with weighted scoring</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Offer</button>
            </motion.div>

            {/* Weights */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Priority Weights <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— adjust to match your values</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
                    {Object.entries(weights).map(([key, val]) => (
                        <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--teal)' }}>{val}%</span>
                            </div>
                            <input type="range" min={0} max={60} value={val}
                                onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: 'var(--teal)' }} />
                        </div>
                    ))}
                </div>
            </motion.div>

            {allOffers.length === 0 ? (
                <div className="empty-state glass">
                    <Scale size={40} style={{ opacity: 0.3 }} />
                    <h3>No offers to compare yet</h3>
                    <p>When you receive offers, add them here to compare objectively. Your dream job decision, made with data.</p>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add your first offer</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {[...allOffers].sort((a, b) => Number(calcScore(b, weights)) - Number(calcScore(a, weights))).map((offer, i) => {
                        const score = Number(calcScore(offer, weights))
                        const scoreColor = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--teal)' : score >= 40 ? 'var(--yellow)' : 'var(--red)'
                        return (
                            <motion.div key={offer._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass" style={{ padding: 20, position: 'relative' }}>
                                {i === 0 && <div style={{ position: 'absolute', top: -10, left: 16, padding: '3px 10px', background: 'var(--green)', color: '#0a0b0f', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>🏆 Top Pick</div>}
                                <button onClick={() => deleteMutation.mutate(offer._id)} className="btn-ghost" style={{ position: 'absolute', top: 12, right: 12, padding: 4, color: 'var(--text-muted)' }}>
                                    <X size={14} />
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #00E5CC22, #A78BFA22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                                        {offer.company[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{offer.company}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{offer.role}</div>
                                    </div>
                                </div>

                                {/* Score ring */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                    <div style={{ position: 'relative', width: 80, height: 80 }}>
                                        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-500)" strokeWidth="6" />
                                            <motion.circle cx="40" cy="40" r="34" fill="none" stroke={scoreColor} strokeWidth="6"
                                                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                                                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - score / 100) }}
                                                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.1 }} />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: scoreColor }}>{score}</span>
                                            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>score</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {offer.baseSalary && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Base Salary</span>
                                            <span style={{ fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>
                                                ${Number(offer.baseSalary).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {offer.equity && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>Equity</span><span style={{ fontWeight: 600 }}>{offer.equity}</span></div>}
                                    {offer.pto && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>PTO</span><span style={{ fontWeight: 600 }}>{offer.pto} days</span></div>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Work Style</span>
                                        <span className={`badge badge-${offer.remote === 'remote' ? 'teal' : offer.remote === 'hybrid' ? 'purple' : 'gray'}`}>{offer.remote}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <ScoreBar label="Culture Fit" value={offer.culture} color="var(--purple)" />
                                    <ScoreBar label="Growth Potential" value={offer.growth} color="var(--teal)" />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Add offer modal */}
            {showAdd && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                    <motion.div className="modal" style={{ maxWidth: 560 }}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 22 }}>Add Offer</h2>
                            <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: '70vh' }}>
                            <div className="form-grid-2">
                                <div><label className="input-label">Company *</label><input className="input" value={form.company} onChange={set('company')} placeholder="Stripe" /></div>
                                <div><label className="input-label">Role</label><input className="input" value={form.role} onChange={set('role')} placeholder="Senior Engineer" /></div>
                            </div>
                            <div className="form-grid-3">
                                <div><label className="input-label">Base Salary</label><input className="input" type="number" value={form.baseSalary} onChange={set('baseSalary')} placeholder="180000" /></div>
                                <div><label className="input-label">Bonus</label><input className="input" value={form.bonus} onChange={set('bonus')} placeholder="20000" /></div>
                                <div><label className="input-label">Equity</label><input className="input" value={form.equity} onChange={set('equity')} placeholder="0.5% over 4yr" /></div>
                            </div>
                            <div className="form-grid-2">
                                <div><label className="input-label">PTO Days</label><input className="input" type="number" value={form.pto} onChange={set('pto')} placeholder="20" /></div>
                                <div><label className="input-label">Work Style</label>
                                    <select className="select" value={form.remote} onChange={set('remote')}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select>
                                </div>
                            </div>
                            {[['culture', 'Culture Fit', 'var(--purple)'], ['growth', 'Growth Potential', 'var(--teal)'], ['manager', 'Manager Impression', 'var(--blue)']].map(([f, label, color]) => (
                                <div key={f}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <label className="input-label" style={{ marginBottom: 0 }}>{label}</label>
                                        <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color }}>{form[f]}/5</span>
                                    </div>
                                    <input type="range" min={1} max={5} value={form[f]} onChange={set(f)} style={{ width: '100%', accentColor: color }} />
                                </div>
                            ))}
                            <div><label className="input-label">Notes</label><textarea className="input" value={form.notes} onChange={set('notes')} rows={2} placeholder="Gut feelings, red flags, what excites you..." /></div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                                <button onClick={addOffer} className="btn-primary">Add to Matrix</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
