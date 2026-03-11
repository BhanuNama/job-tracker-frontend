import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Smile, Frown, Meh, SmilePlus, Laugh, TrendingUp, Flame, Award, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

const MOODS = [
    { score: 1, icon: Frown, label: 'Tough day', color: '#F87171' },
    { score: 2, icon: Meh, label: 'Getting there', color: '#FB923C' },
    { score: 3, icon: Smile, label: 'Holding up', color: '#FBBF24' },
    { score: 4, icon: SmilePlus, label: 'Good vibes', color: '#34D399' },
    { score: 5, icon: Laugh, label: 'Crushing it!', color: '#6366F1' },
]

const PROMPTS = [
    "What's one small thing you accomplished today?",
    "What would you tell a friend going through this?",
    "Every no is one step closer to a yes. What did you learn?",
    "What skill did you demonstrate today, even if unnoticed?",
    "Name one reason you're a strong candidate.",
    "Progress is progress, no matter the pace. What moved forward?",
]

export default function RejectionLog() {
    const queryClient = useQueryClient()
    const { data: stats } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard').then(r => r.data),
    })
    const log = stats?.moodTrend || []

    const mutation = useMutation({
        mutationFn: (data) => api.post('/dashboard/mood', data),
        onSuccess: () => queryClient.invalidateQueries(['dashboard']),
    })

    const [selectedMood, setSelectedMood] = useState(null)
    const [note, setNote] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]

    const handleSubmit = () => {
        if (!selectedMood) return
        mutation.mutate({ score: selectedMood.score, note })
        setSubmitted(true)
        setTimeout(() => { setSubmitted(false); setSelectedMood(null); setNote('') }, 2000)
    }

    const chartData = log.slice(-14).map(e => ({
        date: format(new Date(e.date), 'MMM d'),
        score: e.score,
        fill: MOODS[e.score - 1]?.color,
    }))

    const avg = log.length > 0 ? (log.reduce((a, b) => a + b.score, 0) / log.length).toFixed(1) : 0
    const streak = log.reduce((acc, _, i, arr) => {
        if (i === 0) return 1
        const diff = (new Date(arr[i].date) - new Date(arr[i - 1].date)) / 86400000
        return diff <= 1.5 ? acc + 1 : 1
    }, 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Resilience Log</h1>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Private mood tracking for the long game</p>
            </motion.div>

            {/* Streak cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                    { icon: Flame, label: 'Check-in Streak', value: `${streak}d`, color: 'var(--yellow)' },
                    { icon: TrendingUp, label: 'Avg Mood Score', value: avg, color: 'var(--teal)' },
                    { icon: Award, label: 'Total Entries', value: log.length, color: 'var(--purple)' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="stat-card" style={{ '--accent': color }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color }}>{value}</div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={20} color={color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Log today's mood */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Heart size={18} color="var(--red)" />
                        <span style={{ fontWeight: 600 }}>How are you feeling today?</span>
                    </div>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
                            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--green)' }}>Logged!</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Keep going. You've got this.</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                                {MOODS.map(m => {
                                    const Icon = m.icon
                                    const selected = selectedMood?.score === m.score
                                    return (
                                        <button key={m.score} onClick={() => setSelectedMood(m)} style={{ border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 8px', borderRadius: 12, transition: 'all 0.15s', background: selected ? `${m.color}18` : 'transparent', outline: selected ? `1px solid ${m.color}40` : 'none' }}>
                                            <Icon size={28} color={selected ? m.color : 'var(--text-muted)'} />
                                            <span style={{ fontSize: 10, color: selected ? m.color : 'var(--text-muted)', fontWeight: selected ? 600 : 400 }}>{m.label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)', marginBottom: 16 }}>
                                <div style={{ fontSize: 12, color: 'var(--teal)', fontStyle: 'italic', marginBottom: 8 }}>💭 {prompt}</div>
                            </div>

                            <textarea
                                className="input"
                                placeholder="Reflect here (optional, private)..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={3}
                                style={{ marginBottom: 12, resize: 'vertical' }}
                            />

                            <button onClick={handleSubmit} disabled={!selectedMood} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <Heart size={14} /> Log Today's Mood
                            </button>
                        </>
                    )}
                </motion.div>

                {/* Mood trend chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>14-Day Mood Trend</div>
                    {chartData.length < 2 ? (
                        <div className="empty-state" style={{ padding: '40px 0' }}>
                            <Target size={32} style={{ opacity: 0.3 }} />
                            <p style={{ margin: 0 }}>Log at least 2 days to see your trend</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[1, 5]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                                    <div style={{ background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: MOODS[payload[0].value - 1]?.color }}>{MOODS[payload[0].value - 1]?.label}</div>
                                    </div>
                                ) : null} />
                                <Line type="monotone" dataKey="score" stroke="url(#moodGrad)" strokeWidth={2.5} dot={{ fill: '#A78BFA', strokeWidth: 0, r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>
            </div>

            {/* Recent log entries */}
            {log.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 14 }}>Recent Entries</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...log].reverse().slice(0, 8).map((entry, i) => {
                            const m = MOODS[entry.score - 1]
                            const Icon = m.icon
                            return (
                                <div key={entry.date || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)' }}>
                                    <Icon size={18} color={m.color} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: m.color }}>{m.label}</div>
                                        {entry.note && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{entry.note}</div>}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(entry.date), 'MMM d')}</div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
