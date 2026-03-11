import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Edit2, Trash2, FileText, MapPin, DollarSign } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { confirmToast } from '../lib/confirmToast.jsx'
import useUIStore from '../store/uiStore'
import { formatDistanceToNow } from 'date-fns'
import ApplicationFormModal from '../components/ApplicationFormModal'
import ApplicationDetailModal from './ApplicationDetailModal'

const STAGES = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Final Round', 'Offer', 'Closed']
const STAGE_COLORS = {
    Saved: '#9095b0', Applied: '#60A5FA', Screening: '#A78BFA',
    Interviewing: '#FBBF24', 'Final Round': '#FB923C', Offer: '#34D399', Closed: '#55596e',
}
const SOURCE_COLORS = {
    'LinkedIn': '#0A66C2',
    'Referral': '#34D399',
    'Company Website': '#6366F1',
    'Email Outreach': '#A78BFA',
    'Recruiter Reached Out': '#FBBF24',
}

function ghostingRing(lastContact) {
    if (!lastContact) return null
    const days = Math.floor((Date.now() - new Date(lastContact)) / 86400000)
    if (days <= 5) return { color: '#34D399', label: `${days}d`, pulse: false }
    if (days <= 10) return { color: '#FBBF24', label: `${days}d`, pulse: true }
    return { color: '#F87171', label: `${days}d`, pulse: true }
}

function AppCard({ app, index, onEdit, onDelete, onView }) {
    const ring = ghostingRing(app.lastContact)
    const sourceColor = SOURCE_COLORS[app.appliedThrough] || '#9095b0'

    return (
        <Draggable draggableId={app._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => { if (!snapshot.isDragging) onView(app) }}
                    style={{
                        ...provided.draggableProps.style,
                        background: snapshot.isDragging ? 'var(--bg-600)' : 'var(--bg-700)',
                        border: snapshot.isDragging ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '12px 13px',
                        marginBottom: 8,
                        cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                        boxShadow: snapshot.isDragging ? '0 16px 48px rgba(0,0,0,0.55)' : '0 1px 3px rgba(0,0,0,0.2)',
                        userSelect: 'none',
                    }}
                >
                    {/* 1. Company + edit/ghost row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {app.company}
                        </div>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                            {ring && (
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${ring.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: ring.color }}>
                                        {ring.label}
                                    </span>
                                </div>
                            )}
                            <button
                                onMouseDown={e => e.stopPropagation()}
                                onClick={e => { e.stopPropagation(); onEdit(app) }}
                                className="btn-ghost"
                                style={{ padding: 4, borderRadius: 6 }}
                                title="Edit"
                            >
                                <Edit2 size={11} />
                            </button>
                            <button
                                onMouseDown={e => e.stopPropagation()}
                                onClick={e => { e.stopPropagation(); confirmToast(`Delete ${app.company}?`, () => onDelete(app._id)) }}
                                className="btn-ghost"
                                style={{ padding: 4, borderRadius: 6, color: 'var(--red)' }}
                                title="Delete"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                    </div>

                    {/* 2. Role */}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                        {app.role}
                    </div>

                    {/* 3. Notes preview */}
                    {app.notes && (
                        <div style={{
                            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
                            marginBottom: 6, overflow: 'hidden',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                            {app.notes}
                        </div>
                    )}

                    {/* 4. Resume */}
                    {app.resumeUsed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, padding: '4px 8px', background: 'rgba(96,165,250,0.08)', borderRadius: 6, border: '1px solid rgba(96,165,250,0.15)' }}>
                            <FileText size={10} color="#60A5FA" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.resumeUsed}
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, padding: '4px 8px', background: 'rgba(144,149,176,0.06)', borderRadius: 6, border: '1px dashed rgba(144,149,176,0.2)' }}>
                            <FileText size={10} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>No resume linked</span>
                        </div>
                    )}

                    {/* 4. Applied via */}
                    {app.appliedThrough && (
                        <div style={{ marginBottom: 7 }}>
                            <span style={{
                                fontSize: 10, color: sourceColor,
                                background: `${sourceColor}12`, padding: '3px 7px',
                                borderRadius: 5, border: `1px solid ${sourceColor}25`,
                                display: 'inline-block',
                            }}>
                                via {app.appliedThrough}
                            </span>
                        </div>
                    )}

                    {/* 5. Skills — first 3 */}
                    {app.skills?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 7 }}>
                            {app.skills.slice(0, 3).map(s => (
                                <span key={s} style={{ fontSize: 10, color: 'var(--teal)', background: 'rgba(99,102,241,0.08)', padding: '2px 7px', borderRadius: 5, fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(99,102,241,0.15)', whiteSpace: 'nowrap' }}>
                                    {s}
                                </span>
                            ))}
                            {app.skills.length > 3 && (
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 4px' }}>+{app.skills.length - 3}</span>
                            )}
                        </div>
                    )}

                    {/* 6. Location + Salary */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {app.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)' }}>
                                <MapPin size={9} strokeWidth={2} />{app.location.split(',')[0]}
                            </span>
                        )}
                        {app.location && (app.expectedSalary || app.salary?.max) && (
                            <span style={{ fontSize: 10, color: 'var(--border)' }}>·</span>
                        )}
                        {(app.expectedSalary || app.salary?.max) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                <DollarSign size={9} strokeWidth={2} />{Math.round((app.expectedSalary || app.salary?.max) / 1000)}k
                            </span>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    )
}

export default function KanbanBoard() {
    const queryClient = useQueryClient()
    const { openAddDrawer, searchQuery } = useUIStore()
    const fireConfetti = useUIStore(s => s.fireConfetti)
    const [editApp, setEditApp] = useState(null)
    const [selectedApp, setSelectedApp] = useState(null)

    const { data: applications = [], isLoading } = useQuery({
        queryKey: ['applications'],
        queryFn: () => api.get('/applications').then(r => r.data),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/applications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['applications'])
            queryClient.invalidateQueries(['dashboard'])
            toast.success('Deleted')
        },
        onError: () => toast.error('Delete failed'),
    })

    // Instant client-side filter — company, role, skills, notes, applied through
    const filtered = searchQuery
        ? applications.filter(a => {
            const q = searchQuery.toLowerCase()
            return (
                a.company?.toLowerCase().includes(q) ||
                a.role?.toLowerCase().includes(q) ||
                a.notes?.toLowerCase().includes(q) ||
                a.appliedThrough?.toLowerCase().includes(q) ||
                a.resumeUsed?.toLowerCase().includes(q) ||
                a.skills?.some(s => s.toLowerCase().includes(q))
            )
        })
        : applications

    const stageMutation = useMutation({
        mutationFn: ({ id, stage }) => api.patch(`/applications/${id}/stage`, { stage }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['applications'])
            queryClient.invalidateQueries(['dashboard'])
            if (res.data.stage === 'Offer') fireConfetti()
        },
        onError: () => toast.error('Failed to move card'),
    })

    const grouped = STAGES.reduce((acc, stage) => {
        acc[stage] = filtered.filter(a => a.stage === stage)
        return acc
    }, {})

    const onDragEnd = ({ source, destination, draggableId }) => {
        if (!destination) return
        if (source.droppableId === destination.droppableId && source.index === destination.index) return
        if (source.droppableId !== destination.droppableId) {
            stageMutation.mutate({ id: draggableId, stage: destination.droppableId })
        }
    }

    if (isLoading) return (
        <div style={{ display: 'flex', gap: 12 }}>
            {STAGES.map(s => <div key={s} className="skeleton" style={{ width: 224, height: 400, borderRadius: 16, flexShrink: 0 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Board</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                        {applications.length} applications{searchQuery ? ` · ${filtered.length} matching "${searchQuery}"` : ' · drag cards to advance stages'}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => openAddDrawer()}>
                    <Plus size={15} /> Add Application
                </button>
            </motion.div>

            {/* Board — single horizontal scroll wrapper (only scroll parent) */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
                    {STAGES.map((stage, colIdx) => {
                        const cards = grouped[stage] || []
                        const color = STAGE_COLORS[stage]
                        return (
                            <motion.div
                                key={stage}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: colIdx * 0.04 }}
                                style={{ width: 220, flexShrink: 0 }}
                            >
                                {/* Column header */}
                                <div style={{
                                    padding: '9px 12px',
                                    background: 'var(--bg-700)',
                                    borderTop: `2px solid ${color}`,
                                    borderRight: '1px solid var(--border)',
                                    borderLeft: '1px solid var(--border)',
                                    borderBottom: 'none',
                                    borderRadius: '10px 10px 0 0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>{stage}</span>
                                    </div>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color, fontWeight: 700 }}>{cards.length}</span>
                                </div>

                                {/* Droppable — NO overflow:auto to avoid nested scroll */}
                                <Droppable droppableId={stage}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{
                                                padding: '8px',
                                                background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.05)' : 'var(--bg-800)',
                                                borderRight: '1px solid var(--border)',
                                                borderBottom: '1px solid var(--border)',
                                                borderLeft: '1px solid var(--border)',
                                                borderRadius: '0 0 10px 10px',
                                                minHeight: 160,
                                            }}
                                        >
                                            {cards.map((app, i) => (
                                                <AppCard key={app._id} app={app} index={i} onEdit={setEditApp} onDelete={id => deleteMutation.mutate(id)} onView={setSelectedApp} />
                                            ))}
                                            {provided.placeholder}
                                            {cards.length === 0 && !snapshot.isDraggingOver && (
                                                <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, borderRadius: 8 }}>
                                                    Drop here
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </motion.div>
                        )
                    })}
                </div>
            </DragDropContext>

            {/* Detail view modal */}
            <AnimatePresence>
                {selectedApp && (
                    <ApplicationDetailModal
                        app={selectedApp}
                        onClose={() => setSelectedApp(null)}
                    />
                )}
            </AnimatePresence>

            {/* Edit modal */}
            <AnimatePresence>
                {editApp && (
                    <ApplicationFormModal
                        prefill={editApp}
                        onClose={() => setEditApp(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
