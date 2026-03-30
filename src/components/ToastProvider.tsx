"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { CheckCircle2, X, AlertCircle, Info } from "lucide-react"

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: string; message: string; type: ToastType }

const ToastContext = createContext<{
    toast: (message: string, type?: ToastType) => void
}>({ toast: () => {} })

export function useToast() {
    return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const dismiss = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const icons = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
        error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
        info: <Info className="w-4 h-4 text-blue-400 shrink-0" />
    }

    const borders = {
        success: 'border-emerald-500/30 bg-emerald-500/10',
        error: 'border-red-500/30 bg-red-500/10',
        info: 'border-blue-500/30 bg-blue-500/10'
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div 
                        key={t.id} 
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border ${borders[t.type]} text-zinc-100 text-sm font-medium shadow-2xl backdrop-blur-sm animate-slide-up min-w-72`}
                    >
                        {icons[t.type]}
                        <span className="flex-1">{t.message}</span>
                        <button onClick={() => dismiss(t.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
