import { create } from 'zustand';

// Apply theme to DOM immediately (before React renders)
const savedTheme = localStorage.getItem('jt-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

const useUIStore = create((set) => ({
    // View
    activeView: 'kanban',
    setActiveView: (v) => set({ activeView: v }),

    // Sidebar
    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    // Modal
    modalOpen: false,
    modalData: null,
    openModal: (data = null) => set({ modalOpen: true, modalData: data }),
    closeModal: () => set({ modalOpen: false, modalData: null }),

    // Add application drawer
    addDrawerOpen: false,
    openAddDrawer: (prefill = null) => set({ addDrawerOpen: true, addDrawerPrefill: prefill }),
    closeAddDrawer: () => set({ addDrawerOpen: false, addDrawerPrefill: null }),
    addDrawerPrefill: null,

    // Search / filter
    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),
    stageFilter: '',
    setStageFilter: (s) => set({ stageFilter: s }),

    // Theme
    theme: savedTheme,
    toggleTheme: () => set((s) => {
        const next = s.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('jt-theme', next)
        return { theme: next }
    }),

    // Confetti
    showConfetti: false,
    fireConfetti: () => {
        set({ showConfetti: true });
        setTimeout(() => set({ showConfetti: false }), 4000);
    },
}));

export default useUIStore;
