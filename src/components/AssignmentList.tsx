"use client"

import { Assignment } from "@/types/database"
import { Calendar, Clock, AlertCircle } from "lucide-react"
import { updateAssignmentStatus } from "@/app/actions/assignments"

export default function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  if (!assignments || assignments.length === 0) {
      return <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/50">No assignments found.</div>
  }

  const priorityColors: Record<string, string> = {
    low: "text-zinc-400 bg-zinc-800/50 border-zinc-700",
    medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    urgent: "text-red-400 bg-red-500/10 border-red-500/20"
  }

  const statusColors: Record<string, string> = {
      pending: "text-zinc-400",
      in_progress: "text-blue-400",
      completed: "text-emerald-400",
      overdue: "text-red-400"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assignments.map(a => (
            <div key={a.id} className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 transition flex flex-col gap-4">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-medium text-zinc-100 line-clamp-2">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[a.priority]}`}>
                       {a.priority}
                    </span>
                </div>
                {a.description && <p className="text-sm text-zinc-400 line-clamp-2">{a.description}</p>}
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {a.due_date ? (
                            <><Calendar className="w-3.5 h-3.5" /> {new Date(a.due_date).toLocaleDateString()}</>
                        ) : (
                            <><Clock className="w-3.5 h-3.5" /> No due date</>
                        )}
                    </div>
                    
                    <select 
                       className={`bg-zinc-950 border border-zinc-800 text-xs rounded-md px-2 py-1 outline-none ${statusColors[a.status]}`}
                       value={a.status}
                       onChange={async (e) => {
                           await updateAssignmentStatus(a.id, e.target.value)
                       }}
                    >
                        <option value="pending" className="text-zinc-400">Pending</option>
                        <option value="in_progress" className="text-blue-400">In Progress</option>
                        <option value="completed" className="text-emerald-400">Completed</option>
                        <option value="overdue" className="text-red-400">Overdue</option>
                    </select>
                </div>
            </div>
        ))}
    </div>
  )
}
