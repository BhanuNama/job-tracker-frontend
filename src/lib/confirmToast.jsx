import toast from 'react-hot-toast'

/**
 * Drop-in replacement for window.confirm() that shows a slick toast.
 * Usage: confirmToast('Delete this?', () => doDelete())
 */
export function confirmToast(message, onConfirm, { danger = true } = {}) {
    toast((t) => {
        const dismiss = () => toast.dismiss(t.id)
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {message}
                </span>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                        onClick={dismiss}
                        style={{
                            padding: '5px 14px', borderRadius: 8, border: '1px solid var(--border)',
                            background: 'var(--bg-600)', color: 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { dismiss(); onConfirm() }}
                        style={{
                            padding: '5px 14px', borderRadius: 8, border: 'none',
                            background: danger ? 'var(--red)' : 'var(--teal)',
                            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        }}
                    >
                        {danger ? 'Delete' : 'Confirm'}
                    </button>
                </div>
            </div>
        )
    }, {
        duration: 8000,
        style: {
            background: 'var(--bg-700)',
            border: '1px solid var(--border)',
            padding: '14px 16px',
            borderRadius: 12,
        },
    })
}
