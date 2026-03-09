import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Briefcase, MessageSquare, Trophy, Zap, ArrowRight, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import api from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import useUIStore from '../store/uiStore'
import { useNavigate } from 'react-router-dom'

function CountUp({ end, duration = 1500 }) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        let start = 0
        const step = end / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= end) { setValue(end); clearInterval(timer) }
            else setValue(Math.floor(start))
        }, 16)
        return () => clearInterval(timer)
    }, [end, duration])
    return <>{value}</>
}

const ghostingColor = (days) => days > 10 ? 'var(--red)' : days > 5 ? 'var(--yellow)' : 'var(--green)'

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>{payload[0].value}</div>
        </div>
    )
}

export default function Dashboard() {
    const navigate = useNavigate()
    const openAddDrawer = useUIStore((s) => s.openAddDrawer)
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard').then(r => r.data),
        refetchInterval: 60000,
    })

    const statCards = stats ? [
        { label: 'Total Applications', value: stats.total, icon: Briefcase, color: '#60A5FA', accent: '#60A5FA' },
        { label: 'Interviews Booked', value: stats.interviews, icon: MessageSquare, color: '#A78BFA', accent: '#A78BFA' },
        { label: 'Response Rate', value: `${stats.responseRate}%`, icon: TrendingUp, color: '#00E5CC', accent: '#00E5CC' },
        { label: 'Offers Received', value: stats.offers, icon: Trophy, color: '#34D399', accent: '#34D399' },
    ] : []

    const stages = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed']
    const stageColors = { Saved: '#9095b0', Applied: '#60A5FA', Screening: '#A78BFA', Interviewing: '#FBBF24', 'Final Round': '#FB923C', Offer: '#34D399', Closed: '#55596e' }

    if (isLoading) return (
        <div className="dashboard-grid-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Dashboard</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Your job search at a glance</p>
                </div>
                <button className="btn-primary" onClick={() => openAddDrawer()}>
                    <Zap size={15} /> Add Application
                </button>
            </motion.div>

            {/* Stat cards */}
            <div className="dashboard-grid-4">
                {statCards.map(({ label, value, icon: Icon, color, accent }, i) => (
                    <motion.div
                        key={label}
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{ '--accent': accent }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color }}>
                                    {typeof value === 'string' ? value : <CountUp end={value} />}
                                </div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={20} color={color} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Middle row: Funnel + Velocity */}
            <div className="dashboard-grid-2">
                {/* Stage breakdown */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Pipeline Stages</span>
                        <button className="btn-ghost" onClick={() => navigate('/analytics')} style={{ fontSize: 12, gap: 4 }}>
                            Full analytics <ArrowRight size={13} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stages.map(stage => {
                            const count = stats?.byStage?.[stage] || 0
                            const max = Math.max(...Object.values(stats?.byStage || {}), 1)
                            const pct = (count / max) * 100
                            return (
                                <div key={stage}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{stage}</span>
                                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: stageColors[stage] }}>{count}</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-500)', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                                            style={{ height: '100%', background: stageColors[stage], borderRadius: 3 }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Weekly velocity */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>Application Velocity</div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={stats?.weeklyVelocity || []}>
                            <defs>
                                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00E5CC" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00E5CC" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="applications" stroke="#00E5CC" strokeWidth={2} fill="url(#tealGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Ghosting Radar */}
            {stats?.ghosting?.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div className="radar-ring" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--yellow)' }} />
                        <span style={{ fontWeight: 600 }}>Ghosting Radar™</span>
                        <span className="badge badge-yellow">{stats.ghosting.length} need follow-up</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                        {stats.ghosting.map((g) => (
                            <div key={g._id} className="glass-sm" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{g.company}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{g.role}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: ghostingColor(g.daysSince) }}>{g.daysSince}d</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>since contact</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Streaks */}
            {stats?.streaks && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>🔥 Your Streaks</div>
                    {[
                        { label: 'Days Applied', value: stats.streaks.daysApplied, color: 'var(--teal)' },
                        { label: 'Interviews', value: stats.streaks.interviewsBooked, color: 'var(--purple)' },
                        { label: 'Offers', value: stats.streaks.offersReceived, color: 'var(--green)' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color }}>
                                <CountUp end={value} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
