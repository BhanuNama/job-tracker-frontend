import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, AreaChart, Area } from 'recharts'
import api from '../lib/api'

const stageColors = ['#9095b0', '#60A5FA', '#A78BFA', '#FBBF24', '#FB923C', '#34D399', '#55596e']

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>{payload[0].value}</div>
        </div>
    )
}

export default function Analytics() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard').then(r => r.data),
    })

    if (isLoading) return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
        </div>
    )

    const funnelData = (stats?.funnel || []).map((f, i) => ({ ...f, fill: stageColors[i] }))
    const barData = (stats?.funnel || []).map((f, i) => ({
        stage: f.stage.replace(' ', '\n'),
        count: f.count,
        fill: stageColors[i],
    }))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Analytics</h1>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Pipeline performance & conversion rates</p>
            </motion.div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                    { label: 'Total Applied', value: stats?.applied || 0, color: 'var(--blue)' },
                    { label: 'Got Interviews', value: stats?.interviews || 0, color: 'var(--purple)' },
                    { label: 'Response Rate', value: `${stats?.responseRate || 0}%`, color: 'var(--teal)' },
                    { label: 'Offers', value: stats?.offers || 0, color: 'var(--green)' },
                ].map(({ label, value, color }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--bg-700)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color }}>{value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Stage bar chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>Applications by Stage</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} barSize={24}>
                            <XAxis dataKey="stage" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Weekly velocity */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>Weekly Application Velocity</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats?.weeklyVelocity || []}>
                            <defs>
                                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="applications" stroke="#A78BFA" strokeWidth={2} fill="url(#purpleGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Funnel conversion table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass" style={{ padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Funnel Conversion Rates</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {funnelData.map((f, i) => (
                        <div key={f.stage} style={{ textAlign: 'center' }}>
                            <div style={{ height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max((f.count / Math.max(...funnelData.map(d => d.count), 1)) * 100, 4)}%` }}
                                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                    style={{ width: 32, background: f.fill, borderRadius: '6px 6px 0 0', minHeight: 4 }}
                                />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: f.fill }}>{f.count}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{f.stage}</div>
                            {i > 0 && f.conversionFromPrev !== undefined && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {f.conversionFromPrev}% conv.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Ghosting radar */}
            {stats?.ghosting?.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div className="radar-ring" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--yellow)' }} />
                        <span style={{ fontWeight: 600 }}>Ghosting Radar™</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {stats.ghosting.map(g => {
                            const pct = Math.min((g.daysSince / 20) * 100, 100)
                            const color = g.daysSince > 10 ? 'var(--red)' : 'var(--yellow)'
                            return (
                                <div key={g._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 130, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{g.company}</div>
                                    <div style={{ flex: 1, height: 8, background: 'var(--bg-500)', borderRadius: 4, overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.6, duration: 0.6 }}
                                            style={{ height: '100%', background: color, borderRadius: 4 }} />
                                    </div>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color, width: 36, textAlign: 'right' }}>{g.daysSince}d</div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
