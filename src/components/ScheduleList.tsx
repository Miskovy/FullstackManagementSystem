"use client"

import { Schedule } from "@/types/database"
import { CalendarDays, Pause, Play, Trash, Plus } from "lucide-react"
import { toggleSchedule, deleteSchedule } from "@/app/actions/schedules"
import { useState } from "react"
import ScheduleModal from "./ScheduleModal"

export default function ScheduleList({ schedules, showHeader = false }: { schedules: Schedule[], showHeader?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  return (
    <>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">All Schedules</h2>
          <button 
             onClick={() => { setSelectedId(null); setModalOpen(true); }}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
             <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      )}
      
      {(!schedules || schedules.length === 0) ? (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/50">No schedules configured.</div>
      ) : (
          <div className="space-y-3">
              {schedules.map(s => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setModalOpen(true); }} className={`p-4 border ${s.is_paused ? 'border-zinc-800 bg-zinc-900/30 opacity-70' : 'border-zinc-800 bg-zinc-900/50'} rounded-xl flex items-center justify-between gap-4 transition-all hover:border-zinc-700 cursor-pointer`}>
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <CalendarDays className={`w-5 h-5 ${s.is_paused ? 'text-zinc-500' : 'text-blue-500'}`} />
                          </div>
                    <div>
                        <h4 className="font-medium text-zinc-100 flex items-center gap-2">
                           {s.title}
                           {s.is_paused && <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">Paused</span>}
                        </h4>
                        <div className="text-xs text-zinc-400 capitalize flex gap-2 items-center mt-1">
                            <span>{s.recurrence_type}</span>
                            <span>•</span>
                            <span>{s.trigger_time}</span>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{s.description || 'No description'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                       onClick={() => toggleSchedule(s.id, !s.is_paused)}
                       className="p-2 border border-zinc-800 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 transition"
                    >
                        {s.is_paused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button 
                       onClick={() => {
                           if (confirm("Delete this schedule?")) deleteSchedule(s.id)
                       }}
                       className="p-2 border border-red-500/20 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition"
                    >
                        <Trash className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          ))}
      </div>
      )}
      
      <ScheduleModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelectedId(null) }} scheduleId={selectedId} />
    </>
  )
}
