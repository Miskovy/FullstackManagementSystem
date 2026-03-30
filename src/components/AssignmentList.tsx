"use client"

import { Assignment } from "@/types/database"
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react"
import { useState, useMemo } from "react"
import AssignmentModal from "./AssignmentModal"
import { Search, Filter } from "lucide-react"

export default function AssignmentList({ assignments, showHeader = false, userRole }: { assignments: Assignment[], showHeader?: boolean, userRole?: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

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

  const statusBadgeStyles: Record<string, string> = {
      pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      overdue: "bg-red-500/10 text-red-400 border-red-500/20"
  }

  const filteredAssignments = useMemo(() => {
      return assignments.filter(a => {
          const isOverdue = a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date();
          const displayStatus = isOverdue ? 'overdue' : a.status;

          if (statusFilter !== 'all' && displayStatus !== statusFilter) return false;
          if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
          
          if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const matchesTitle = a.title.toLowerCase().includes(q)
              const matchesAssignee = a.assignment_assignees?.some((aa: any) => 
                  (aa.profiles?.full_name?.toLowerCase() || '').includes(q) || 
                  (aa.profiles?.email?.toLowerCase() || '').includes(q)
              )
              const matchesTag = a.assignment_tags?.some((at: any) => 
                  (at.tags?.name?.toLowerCase() || '').includes(q)
              )
              if (!matchesTitle && !matchesAssignee && !matchesTag) return false;
          }
          
          return true;
      })
  }, [assignments, statusFilter, priorityFilter, searchQuery])

  return (
    <>
      {showHeader && (
        <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">All Assignments</h2>
              {userRole === 'admin' && (
                <button 
                   onClick={() => { setSelectedId(null); setModalOpen(true); }}
                   className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                   <Plus className="w-4 h-4" /> New Assignment
                </button>
              )}
            </div>
            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        placeholder="Search assignments, tags, or members..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100 placeholder:text-zinc-600"
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    <select 
                        value={priorityFilter} 
                        onChange={e => setPriorityFilter(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-300 min-w-32"
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-300 min-w-32"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="overdue">Overdue</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
        </div>
      )}

      {(!filteredAssignments || filteredAssignments.length === 0) ? (
        <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/50">No assignments found matching your criteria.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAssignments.map(a => {
                const isOverdue = a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date();
                const displayStatus = isOverdue ? 'overdue' : a.status;

                return (
                <div 
                    key={a.id} 
                    onClick={() => { setSelectedId(a.id); setModalOpen(true); }}
                    className={`p-5 border transition flex flex-col gap-4 group cursor-pointer ${isOverdue ? 'border-red-900/30 bg-red-950/10 hover:border-red-800/50 hover:bg-red-950/20' : 'border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700'}`}
                    style={{ borderRadius: '0.75rem' }}
                >
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-medium text-zinc-100 line-clamp-2 group-hover:text-blue-400 transition-colors">{a.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${priorityColors[a.priority]}`}>
                               {a.priority}
                            </span>
                        </div>
                        {a.assignment_tags && a.assignment_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {a.assignment_tags.map((at: any) => at.tags).filter(Boolean).map((t: any) => (
                                    <span key={t.id} className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {t.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {a.description && <p className="text-sm text-zinc-400 line-clamp-2">{a.description}</p>}
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-800/50" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4">
                            {/* Avatar Group */}
                            {a.assignment_assignees && a.assignment_assignees.length > 0 && (
                                <div className="flex -space-x-1.5">
                                    {(a.assignment_assignees || []).slice(0, 3).map((aa: any, i: number) => {
                                        const p = aa.profiles || aa.profile || aa;
                                        return (
                                            <div key={p.id || i} className="w-6 h-6 rounded-full bg-blue-600/20 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-medium text-blue-400" title={p.full_name || p.email} style={{ zIndex: 10 - i }}>
                                                {(p.full_name || p.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )
                                    })}
                                    {a.assignment_assignees.length > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[9px] font-medium text-zinc-400" style={{ zIndex: 0 }}>
                                            +{a.assignment_assignees.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                {a.due_date ? (
                                    <><Calendar className="w-3.5 h-3.5" /> {new Date(a.due_date).toLocaleDateString()}</>
                                ) : (
                                    <><Clock className="w-3.5 h-3.5" /> No date</>
                                )}
                            </div>
                        </div>
                        
                        <div className={`px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-md border capitalize ${statusBadgeStyles[displayStatus] || statusBadgeStyles.pending}`}>
                           {displayStatus.replace('_', ' ')}
                        </div>
                    </div>
                </div>
            )})}
        </div>
      )}

      <AssignmentModal 
          isOpen={modalOpen} 
          onClose={() => { setModalOpen(false); setSelectedId(null); }} 
          assignmentId={selectedId} 
          userRole={userRole}
      />
    </>
  )
}
