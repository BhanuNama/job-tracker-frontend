import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, PenLine, Trash2, Check, X } from 'lucide-react'
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isToday, parseISO,
    addMonths, subMonths
} from 'date-fns'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { confirmToast } from '../lib/confirmToast.jsx'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const PROMPTS = [
    'What moved forward today?',
    'What did you learn about yourself?',
    'One small win, no matter how tiny?',
    'How are you feeling right now?',
    'What are you grateful for today?',
    'What challenge are you working through?',
]

export default function Diary() {
    const queryClient = useQueryClient()
    const [month, setMonth] = useState(new Date())
    const [selected, setSelected] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState('')
    const ref = useRef(null)
    const prompt = PROMPTS[new Date().getDate() % PROMPTS.length]

    const { data: entries = {} } = useQuery({
        queryKey: ['diary'],
        queryFn: () => api.get('/diary').then(r => r.data),
    })

    const saveMutation = useMutation({
        mutationFn: ({ date, text }) => api.put(`/diary/${date}`, { text }),
        onSuccess: () => { queryClient.invalidateQueries(['diary']); setEditing(false); toast.success('Saved') },
        onError: () => toast.error('Save failed'),
    })

    const delMutation = useMutation({
        mutationFn: (date) => api.delete(`/diary/${date}`),
        onSuccess: () => { queryClient.invalidateQueries(['diary']); toast.success('Deleted') },
        onError: () => toast.error('Delete failed'),
    })

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
    })

    const entry = entries[selected]

    const startEdit = () => {
        setDraft(entry?.text || '')
        setEditing(true)
        setTimeout(() => ref.current?.focus(), 60)
    }

    const handleSave = () => {
        if (!draft.trim()) return
        saveMutation.mutate({ date: selected, text: draft.trim() })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>

            {/* Page title */}
            <div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Diary</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                    {Object.keys(entries).length} entries written
                </p>
            </div>

            {/* Side-by-side layout */}
            <div className="diary-grid">

                {/* LEFT — Calendar */}
                <div style={{ background: 'var(--bg-700)', borderRadius: 18, border: '1px solid var(--border)', padding: '20px 16px' }}>

                    {/* Month nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <button onClick={() => setMonth(subMonths(month, 1))} className="btn-ghost" style={{ padding: 6 }}>
                            <ChevronLeft size={15} />
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>
                            {format(month, 'MMMM yyyy')}
                        </span>
                        <button onClick={() => setMonth(addMonths(month, 1))} className="btn-ghost" style={{ padding: 6 }}>
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    {/* Day labels */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
                        {WEEKDAYS.map((d, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', padding: '3px 0' }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                        {days.map(day => {
                            const key = format(day, 'yyyy-MM-dd')
                            const inMonth = isSameMonth(day, month)
                            const hasEntry = Boolean(entries[key])
                            const todayDay = isToday(day)
                            const isSelected = key === selected
                            const isPast = day < new Date() && !todayDay

                            return (
                                <button
                                    key={key}
                                    onClick={() => { setSelected(key); setEditing(false); setDraft('') }}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        justifyContent: 'center', gap: 2, padding: '7px 2px', borderRadius: 10,
                                        border: 'none', cursor: 'pointer',
                                        background: isSelected ? 'var(--teal)' : todayDay ? 'var(--bg-500)' : 'transparent',
                                        opacity: inMonth ? 1 : 0.18,
                                        transition: 'background 0.12s',
                                    }}
                                >
                                    <span style={{
                                        fontSize: 12, lineHeight: 1,
                                        fontWeight: isSelected || todayDay ? 700 : 400,
                                        color: isSelected ? '#0a0b0f' : 'var(--text-primary)',
                                        fontFamily: 'JetBrains Mono, monospace',
                                    }}>
                                        {format(day, 'd')}
                                    </span>
                                    {inMonth && (
                                        <div style={{
                                            width: 3.5, height: 3.5, borderRadius: '50%',
                                            background: hasEntry
                                                ? (isSelected ? 'rgba(10,11,15,0.45)' : 'var(--green)')
                                                : isPast
                                                    ? 'rgba(239,68,68,0.32)'
                                                    : 'transparent',
                                        }} />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Legend + today */}
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                            {[
                                { color: 'var(--green)', label: 'Entry' },
                                { color: 'rgba(239,68,68,0.4)', label: 'Missed' },
                            ].map(({ color, label }) => (
                                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                    {label}
                                </span>
                            ))}
                        </div>
                        {!isToday(parseISO(selected)) && (
                            <button onClick={() => { setMonth(new Date()); setSelected(format(new Date(), 'yyyy-MM-dd')); setEditing(false) }}
                                style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                                ← Go to today
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT — Entry panel */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selected}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        style={{ background: 'var(--bg-700)', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden' }}
                    >
                        {/* Panel header */}
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
                                    {format(parseISO(selected), 'EEEE, MMMM d')}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {format(parseISO(selected), 'yyyy')}
                                    {isToday(parseISO(selected)) && <span style={{ color: 'var(--teal)', marginLeft: 6 }}>· Today</span>}
                                    {entry?.updatedAt && <span style={{ marginLeft: 6 }}>· saved {format(new Date(entry.updatedAt), 'h:mm a')}</span>}
                                </div>
                            </div>
                            {!editing && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={startEdit} className="btn-secondary" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, gap: 6 }}>
                                        <PenLine size={13} /> {entry ? 'Edit' : 'Write'}
                                    </button>
                                    {entry && (
                                        <button onClick={() => confirmToast('Delete entry?', () => delMutation.mutate(selected))}
                                            className="btn-ghost" style={{ padding: '7px 10px', borderRadius: 10, color: 'var(--red)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div style={{ padding: '20px 24px 24px', minHeight: 260 }}>
                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {!entry && (
                                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            {prompt}
                                        </p>
                                    )}
                                    <textarea
                                        ref={ref}
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        placeholder="Write freely…"
                                        rows={9}
                                        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSave() } }}
                                        style={{
                                            width: '100%', background: 'transparent', border: 'none', outline: 'none',
                                            fontSize: 15, lineHeight: 1.85, color: 'var(--text-primary)',
                                            resize: 'none', fontFamily: 'Inter, sans-serif', padding: 0,
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⌘↵ to save</span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setEditing(false)} className="btn-ghost" style={{ padding: '6px 12px', borderRadius: 9, fontSize: 13, gap: 5 }}>
                                                <X size={13} /> Cancel
                                            </button>
                                            <button onClick={handleSave} className="btn-primary"
                                                disabled={saveMutation.isPending || !draft.trim()}
                                                style={{ padding: '6px 16px', borderRadius: 9, fontSize: 13, gap: 5 }}>
                                                <Check size={13} /> {saveMutation.isPending ? 'Saving…' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : entry ? (
                                <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {entry.text}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40, textAlign: 'center' }}>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        {isToday(parseISO(selected)) ? 'Nothing written yet today.' : 'No entry for this day.'}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{prompt}</div>
                                    <button onClick={startEdit} className="btn-primary" style={{ marginTop: 8, borderRadius: 10, gap: 7, fontSize: 13 }}>
                                        <PenLine size={13} /> Write Entry
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Recent entries */}
            {Object.keys(entries).length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Recent</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {Object.entries(entries)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 5)
                            .map(([dateKey, e]) => (
                                <button key={dateKey}
                                    onClick={() => { setSelected(dateKey); setMonth(parseISO(dateKey)); setEditing(false) }}
                                    style={{
                                        display: 'flex', gap: 16, alignItems: 'center', padding: '11px 16px',
                                        borderRadius: 12, background: 'var(--bg-700)',
                                        border: `1px solid ${dateKey === selected ? 'var(--teal)' : 'var(--border)'}`,
                                        cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.12s',
                                    }}
                                >
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--teal)', flexShrink: 0, minWidth: 42 }}>
                                        {format(parseISO(dateKey), 'MMM d')}
                                    </span>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {e.text}
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    )
}
