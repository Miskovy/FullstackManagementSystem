"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Assignment } from "@/types/database"

export default function AnalyticsChart({ assignments }: { assignments: Assignment[] }) {
    const data = useMemo(() => {
        // Build last 7 days array
        const days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return {
                dateStr: d.toISOString().split('T')[0],
                label: d.toLocaleDateString(undefined, { weekday: 'short' }),
                Completed: 0,
                New: 0,
                Overdue: 0
            }
        })

        // Populate counts
        assignments.forEach(a => {
            // For MVP, we'll use updated_at as a proxy for completed_at when status is 'completed'
            if (a.status === 'completed') {
               const dayMatch = days.find(d => a.updated_at.startsWith(d.dateStr))
               if (dayMatch) dayMatch.Completed++
            }
            
            const isTaskOverdue = a.status === 'overdue' || (a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date());
            const dueDateStr = a.due_date;
            if (isTaskOverdue && dueDateStr) {
                // Map the overdue moment to the day it was actually due
                const overdueMatch = days.find(d => dueDateStr.startsWith(d.dateStr))
                if (overdueMatch) overdueMatch.Overdue++
            }
            
            const createMatch = days.find(d => a.created_at.startsWith(d.dateStr))
            if (createMatch) createMatch.New++
        })

        return days
    }, [assignments])

    return (
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.5rem', color: '#e4e4e7' }}
                        itemStyle={{ color: '#e4e4e7', fontSize: '13px' }}
                        labelStyle={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '4px' }}
                        cursor={{ fill: '#27272a', opacity: 0.4 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '10px' }} />
                    <Bar dataKey="New" fill="#3f3f46" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Overdue" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
