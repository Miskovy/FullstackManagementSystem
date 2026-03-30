"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams()
    const tab = searchParams.get('tab') || 'dashboard'
    const [visible, setVisible] = useState(true)
    const prevTab = useRef(tab)

    useEffect(() => {
        if (prevTab.current !== tab) {
            setVisible(false)
            const timer = setTimeout(() => {
                setVisible(true)
                prevTab.current = tab
            }, 80)
            return () => clearTimeout(timer)
        }
    }, [tab])

    return (
        <div
            className={`transition-all duration-300 ease-out ${
                visible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-2'
            }`}
        >
            {children}
        </div>
    )
}
