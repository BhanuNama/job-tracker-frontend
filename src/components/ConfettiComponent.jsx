import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useUIStore from '../store/uiStore'
import confetti from 'canvas-confetti'

export default function ConfettiComponent() {
    const showConfetti = useUIStore((s) => s.showConfetti)

    useEffect(() => {
        if (!showConfetti) return

        // Intense center burst
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#00E5CC', '#A78BFA', '#34D399', '#FBBF24', '#60A5FA', '#FF6B6B', '#FFD93D'],
            zIndex: 9999
        })

        const end = Date.now() + 3500
        const colors = ['#00E5CC', '#A78BFA', '#34D399', '#FBBF24', '#60A5FA']

        const frame = () => {
            confetti({
                particleCount: 6,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors,
                zIndex: 9999
            })
            confetti({
                particleCount: 6,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors,
                zIndex: 9999
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            } else {
                // Final explosion
                confetti({
                    particleCount: 200,
                    spread: 160,
                    origin: { y: 0.5 },
                    colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF7F', '#1E90FF'],
                    zIndex: 9999
                })
            }
        }
        frame()
    }, [showConfetti])

    return (
        <AnimatePresence>
            {showConfetti && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(10, 11, 15, 0.4)',
                        backdropFilter: 'blur(4px)',
                        pointerEvents: 'none'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50, rotate: -5 }}
                        animate={{ scale: 1, y: 0, rotate: 0 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{
                            background: 'var(--bg-800)',
                            padding: '24px 48px',
                            borderRadius: '24px',
                            border: '2px solid var(--teal)',
                            boxShadow: '0 0 80px rgba(0, 229, 204, 0.4)',
                            textAlign: 'center'
                        }}
                    >
                        <motion.h1
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{
                                fontFamily: 'Playfair Display, serif',
                                fontSize: 'clamp(32px, 5vw, 48px)',
                                margin: 0,
                                color: '#FFF',
                                textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                        >
                            🎉 OFFER RECEIVED! 🎉
                        </motion.h1>
                        <p style={{ color: 'var(--teal)', fontSize: 18, marginTop: 12, fontWeight: 600, margin: '12px 0 0' }}>
                            Congratulations! You crushed it!
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
