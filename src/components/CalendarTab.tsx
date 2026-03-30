"use client"

import { useMemo } from "react"
import { Schedule, Assignment } from "@/types/database"
import { ChevronRight, Calendar as CalIcon, Bot, CheckCircle2 } from "lucide-react"

interface Props {
    assignments: Assignment[]
    schedules: Schedule[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarTab({ assignments, schedules }: Props) {
    const calendarDays = useMemo(() => {
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        
        // Let's build a rolling 30 day view, starting from the Sunday before today, or just a generic month view.
        // Actually, a simple 35-day rolling window starting from Today - "Days elapsed this week" looks great.
        
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay()) // Go back to Sunday
        startDate.setHours(0,0,0,0)

        const days = []
        for (let i = 0; i < 35; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)
            
            const dateStr = date.toISOString().split('T')[0]
            
            // Collect literal assignments for this day
            const dayAssignments = assignments.filter(a => a.due_date && a.due_date.startsWith(dateStr))
            
            // Collect simulated schedules for this day
            const simulatedSchedules: Schedule[] = []
            schedules.forEach(s => {
                if (s.is_paused) return;
                
                let matches = false;
                const config: any = s.config || {};
                
                if (s.recurrence_type === 'daily') matches = true;
                if (s.recurrence_type === 'weekly' && config.days && config.days.includes(date.getDay())) matches = true;
                if (s.recurrence_type === 'monthly' && config.dates && config.dates.includes(date.getDate())) matches = true;
                
                if (matches) simulatedSchedules.push(s)
            })

            days.push({
                date,
                dateStr,
                isToday: date.getTime() === new Date(new Date().setHours(0,0,0,0)).getTime(),
                isCurrentMonth: date.getMonth() === currentMonth,
                assignments: dayAssignments,
                schedules: simulatedSchedules
            })
        }
        return days
    }, [assignments, schedules])

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[700px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900 shrink-0">
                {WEEKDAYS.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-zinc-800 gap-[1px]">
                {calendarDays.map((d, i) => (
                    <div key={i} className={`bg-zinc-950 p-2 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 transition-colors hover:bg-zinc-900/80 ${!d.isCurrentMonth ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${d.isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500'}`}>
                                {d.date.getDate()}
                            </span>
                        </div>
                        
                        {/* Render Real Assignments */}
                        {d.assignments.map(a => (
                            <div key={a.id} className={`text-[10px] px-1.5 py-1 rounded border leading-tight ${
                                a.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                a.status === 'overdue' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-zinc-800 border-zinc-700 text-zinc-300'
                            }`}>
                                <div className="flex items-center gap-1 font-medium truncate">
                                    {a.status === 'completed' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                    <span className="truncate">{a.title}</span>
                                </div>
                            </div>
                        ))}

                        {/* Render Ghost Schedules */}
                        {d.date >= new Date(new Date().setHours(0,0,0,0)) && d.schedules.map(s => (
                            <div key={`ghost-${s.id}`} className="text-[10px] px-1.5 py-1 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 leading-tight border-dashed opacity-80" title={`Scheduled automated task at ${s.trigger_time}`}>
                                <div className="flex items-center gap-1 font-medium truncate">
                                    <Bot className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{s.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
