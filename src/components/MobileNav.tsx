"use client"

import { Sun, Moon, Menu, X } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { useState } from "react"
import Link from "next/link"

interface Props {
    currentTab: string
    isAdmin: boolean
}

export default function MobileNav({ currentTab, isAdmin }: Props) {
    const { theme, toggle } = useTheme()
    const [open, setOpen] = useState(false)

    const links = [
        { href: "/?tab=dashboard", label: "Dashboard" },
        { href: "/?tab=assignments", label: "Assignments" },
        { href: "/?tab=templates", label: "Templates" },
        { href: "/?tab=calendar", label: "Calendar" },
    ]
    if (isAdmin) {
        links.push({ href: "/?tab=schedules", label: "Schedules" })
        links.push({ href: "/?tab=settings", label: "Admin Settings" })
    }

    return (
        <>
            {/* Theme Toggle — shows everywhere */}
            <button
                onClick={toggle}
                className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                    <Moon className="w-4 h-4 text-blue-500" />
                )}
            </button>

            {/* Hamburger — mobile only */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
                <Menu className="w-4 h-4" />
            </button>

            {/* Mobile Overlay */}
            {open && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setOpen(false)} />
                    <div className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 z-[60] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold tracking-tight">Assignment<span className="text-blue-500">Hub</span></h2>
                            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors">
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
                            {links.map(l => (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className={`block rounded-lg px-3 py-2.5 transition-colors ${
                                        currentTab === l.href.split('tab=')[1]
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                                    }`}
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </>
            )}
        </>
    )
}
