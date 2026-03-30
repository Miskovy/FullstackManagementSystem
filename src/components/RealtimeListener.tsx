"use client"

import { useEffect } from "react"
import { pulseRefresh } from "@/app/actions/assignments"

export default function RealtimeListener() {
    useEffect(() => {
        // Combined Polling Engine:
        // 1. Calls the schedule cron processor to auto-create assignments
        // 2. Forces a server-side cache bust to refresh the dashboard
        const interval = setInterval(async () => {
            try {
                // Fire the schedule engine (silently — errors are logged server-side)
                await fetch('/api/cron/process-schedules', { cache: 'no-store' })
            } catch (e) {
                // Network error — silently ignore, will retry next cycle
            }
            // Always refresh the dashboard regardless
            pulseRefresh()
        }, 30000) // Every 30 seconds

        // Also fire immediately on mount
        fetch('/api/cron/process-schedules', { cache: 'no-store' }).catch(() => {})
        pulseRefresh()

        return () => clearInterval(interval)
    }, [])

    return null
}
