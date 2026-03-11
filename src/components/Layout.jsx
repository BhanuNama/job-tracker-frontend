import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, Kanban, BarChart3, FileText, Users,
    BookOpen, Scale, LogOut, Target, ChevronLeft, Plus, Search, Sun, Moon,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import ApplicationFormModal from './ApplicationFormModal'
import ConfettiComponent from './ConfettiComponent'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/board', icon: Kanban, label: 'Board' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/vault', icon: FileText, label: 'Resume Vault' },
    { to: '/resilience', icon: BookOpen, label: 'Diary' },
    { to: '/offers', icon: Scale, label: 'Offer Matrix' },
]

export default function Layout() {
    const { user, logout } = useAuthStore()
    const { sidebarCollapsed, toggleSidebar, addDrawerOpen, openAddDrawer, closeAddDrawer, searchQuery, setSearchQuery, theme, toggleTheme } = useUIStore()
    const navigate = useNavigate()

    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-900)' }}>
            {/* Sidebar (Hidden on mobile) */}
            <motion.aside
                className="sidebar-container"
                animate={{ width: sidebarCollapsed ? 64 : 220 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{
                    flexShrink: 0,
                    background: 'var(--bg-800)',
                    borderRight: '1px solid var(--border)',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 10,
                }}
            >
                {/* Logo */}
                <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', minHeight: 64 }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Target size={15} color="#0a0b0f" />
                            </div>
                            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                JobTrack <span style={{ color: 'var(--teal)' }}>Pro</span>
                            </span>
                        </div>
                    )}
                    <button onClick={toggleSidebar} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
                        <ChevronLeft size={15} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                    </button>
                </div>

                {/* Add button */}
                <div style={{ padding: '0 12px 16px' }}>
                    <button
                        onClick={() => openAddDrawer()}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '8px' : '8px 14px', borderRadius: 10 }}
                    >
                        <Plus size={16} />
                        {!sidebarCollapsed && <span>Add Application</span>}
                    </button>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navItems.map(({ to, icon: Icon, label, exact }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={exact}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                            title={sidebarCollapsed ? label : undefined}
                        >
                            <Icon size={17} />
                            {!sidebarCollapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border)' }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-700)', marginBottom: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0a0b0f', flexShrink: 0 }}>
                                {user?.name?.[0] || 'U'}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="nav-item" style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', color: 'var(--red)', width: '100%' }}>
                        <LogOut size={16} />
                        {!sidebarCollapsed && <span>Sign out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                {/* Mobile Header (Hidden on desktop) */}
                <header className="mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={14} color="#0a0b0f" />
                        </div>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700 }}>
                            JobTrack <span style={{ color: 'var(--teal)' }}>Pro</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openAddDrawer()} className="btn-primary" style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, height: 'auto', gap: 4 }}>
                            <Plus size={14} /> Add
                        </button>
                        <button onClick={toggleTheme} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
                            {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--yellow)' }} /> : <Moon size={15} style={{ color: 'var(--purple)' }} />}
                        </button>
                        <button onClick={handleLogout} className="btn-ghost" style={{ padding: 6, borderRadius: 8, color: 'var(--red)' }}>
                            <LogOut size={15} />
                        </button>
                    </div>
                </header>

                {/* Top bar (Hidden on mobile) */}
                <header className="desktop-header" style={{ height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, background: 'var(--bg-800)', flexShrink: 0 }}>
                    <div style={{ flex: 1, position: 'relative', maxWidth: 380 }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="input"
                            placeholder="Search applications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
                        />
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="btn-ghost"
                            style={{ padding: 7, borderRadius: 8, gap: 0 }}
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark'
                                ? <Sun size={16} style={{ color: 'var(--yellow)' }} />
                                : <Moon size={16} style={{ color: 'var(--purple)' }} />
                            }
                        </button>
                        <div className="badge badge-green" style={{ gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                            Live
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflow: 'auto', padding: '24px', paddingBottom: '80px' }}>
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {navItems.map(({ to, icon: Icon, label, exact }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                        style={{ minWidth: 70, flexShrink: 0 }}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Add Application Modal */}
            <AnimatePresence>
                {addDrawerOpen && <ApplicationFormModal onClose={closeAddDrawer} />}
            </AnimatePresence>

            <ConfettiComponent />
        </div>
    )
}
