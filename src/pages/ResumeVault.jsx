import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Download, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import api from '../lib/api'
import toast from 'react-hot-toast'

function DocCard({ doc, onDelete }) {
    const handleDownload = async () => {
        try {
            const res = await api.get(`/documents/${doc._id}`)
            const { fileData, originalName, mimeType } = res.data
            const link = document.createElement('a')
            link.href = fileData
            link.download = originalName || doc.name
            link.click()
        } catch {
            toast.error('Download failed')
        }
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color="#60A5FA" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.originalName}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handleDownload} className="btn-ghost" style={{ padding: 6 }} title="Download"><Download size={14} /></button>
                    <button onClick={() => { if (window.confirm('Delete this file?')) onDelete(doc._id) }} className="btn-ghost" style={{ padding: 6, color: 'var(--red)' }} title="Delete"><Trash2 size={14} /></button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge badge-${doc.type === 'resume' ? 'blue' : 'purple'}`}>
                    {doc.type === 'resume' ? 'Resume' : doc.type === 'cover_letter' ? 'Cover Letter' : 'Other'}
                </span>
                <span className="badge badge-gray">{doc.version || 'v1'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {doc.createdAt ? format(new Date(doc.createdAt), 'MMM d, yyyy') : ''}
                </span>
            </div>
            {doc.size && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {(doc.size / 1024).toFixed(0)} KB
                </div>
            )}
        </motion.div>
    )
}

export default function ResumeVault() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [docLabel, setDocLabel] = useState('')
    const [docType, setDocType] = useState('resume')
    const [docVersion, setDocVersion] = useState('v1')
    const [pendingFile, setPendingFile] = useState(null)
    const [uploading, setUploading] = useState(false)

    const { data: docs = [], isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: () => api.get('/documents').then(r => r.data),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/documents/${id}`),
        onSuccess: () => { queryClient.invalidateQueries(['documents']); toast.success('Deleted') },
        onError: () => toast.error('Delete failed'),
    })

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
        maxSize: 10 * 1024 * 1024,
        onDrop: ([file]) => {
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
                setPendingFile({ file, dataUrl: reader.result })
                setShowForm(true)
                setDocLabel(file.name.replace(/\.[^.]+$/, ''))
            }
            reader.readAsDataURL(file)
        },
        onDropRejected: () => toast.error('File too large or unsupported format'),
    })

    const handleSave = async () => {
        if (!pendingFile || !docLabel) return toast.error('Please fill in all fields')
        setUploading(true)
        try {
            await api.post('/documents', {
                name: docLabel,
                type: docType,
                version: docVersion,
                originalName: pendingFile.file.name,
                mimeType: pendingFile.file.type,
                size: pendingFile.file.size,
                fileData: pendingFile.dataUrl,
            })
            queryClient.invalidateQueries(['documents'])
            toast.success('Saved to vault!')
            setShowForm(false); setPendingFile(null); setDocLabel(''); setDocVersion('v1'); setDocType('resume')
        } catch {
            toast.error('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const resumes = docs.filter(d => d.type === 'resume')
    const covers = docs.filter(d => d.type === 'cover_letter')
    const others = docs.filter(d => d.type === 'other')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: 0 }}>Resume Vault</h1>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                    {isLoading ? '…' : `${docs.length} documents stored in MongoDB`}
                </p>
            </motion.div>

            {/* Drop zone */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(0,200,178,0.05)' : 'var(--bg-700)', transition: 'all 0.2s' }}>
                    <input {...getInputProps()} />
                    <Upload size={36} style={{ color: isDragActive ? 'var(--teal)' : 'var(--text-muted)', marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                        {isDragActive ? 'Drop it here!' : 'Drop your resume or cover letter'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, DOC, DOCX up to 10MB — stored in MongoDB Atlas</div>
                </div>
            </motion.div>

            {/* Save modal */}
            {showForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <motion.div className="modal" style={{ maxWidth: 440 }}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 22 }}>Save Document</h2>
                            <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-600)', border: '1px solid var(--border)', fontSize: 13 }}>
                                {pendingFile?.file?.name} ({((pendingFile?.file?.size || 0) / 1024).toFixed(0)} KB)
                            </div>
                            <div><label className="input-label">Label / Name</label><input className="input" value={docLabel} onChange={e => setDocLabel(e.target.value)} placeholder="Engineering Resume v3" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div><label className="input-label">Type</label>
                                    <select className="select" value={docType} onChange={e => setDocType(e.target.value)}>
                                        <option value="resume">Resume</option>
                                        <option value="cover_letter">Cover Letter</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div><label className="input-label">Version</label><input className="input" value={docVersion} onChange={e => setDocVersion(e.target.value)} placeholder="v1" /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleSave} className="btn-primary" disabled={uploading}>
                                    <Upload size={14} /> {uploading ? 'Saving…' : 'Save to Vault'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Document sections */}
            {docs.length === 0 && !isLoading ? (
                <div className="empty-state glass">
                    <FileText size={40} style={{ opacity: 0.3 }} />
                    <h3>Your vault is empty</h3>
                    <p>Upload resumes and cover letters. They'll be stored securely in your database.</p>
                </div>
            ) : (
                <>
                    {resumes.length > 0 && (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={15} /> Resumes ({resumes.length})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {resumes.map(d => <DocCard key={d._id} doc={d} onDelete={id => deleteMutation.mutate(id)} />)}
                            </div>
                        </div>
                    )}
                    {covers.length > 0 && (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={15} /> Cover Letters ({covers.length})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {covers.map(d => <DocCard key={d._id} doc={d} onDelete={id => deleteMutation.mutate(id)} />)}
                            </div>
                        </div>
                    )}
                    {others.length > 0 && (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={15} /> Other ({others.length})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {others.map(d => <DocCard key={d._id} doc={d} onDelete={id => deleteMutation.mutate(id)} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
