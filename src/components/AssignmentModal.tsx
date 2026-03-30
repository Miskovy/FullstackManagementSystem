"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle2, Clock, Trash, Plus, Tag as TagIcon, User, Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react"
import { AssignmentWithDetails, Profile, Tag } from "@/types/database"
import { getAssignmentDetails, getProfiles, createAssignment, updateAssignment, deleteAssignment, getAllTags } from "@/app/actions/assignments"
import { useRouter } from "next/navigation"
import { useToast } from "./ToastProvider"

interface Props {
  isOpen: boolean
  onClose: () => void
  assignmentId?: string | null
  userRole?: string
}

export default function AssignmentModal({ isOpen, onClose, assignmentId, userRole }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  const [profiles, setProfiles] = useState<Profile[]>([])
  
  const [tab, setTab] = useState<'details' | 'history'>('details')
  const [history, setHistory] = useState<any[]>([])

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("pending")
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  
  // Computed state for locking overdue tasks dynamically
  const isEffectivelyOverdue = status === "overdue" || (Boolean(dueDate) && new Date(dueDate) < new Date() && status !== "completed")
  
  // Tags State
  const [tags, setTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState("")
  const [showTagMenu, setShowTagMenu] = useState(false)

  useEffect(() => {
    if (isOpen) {
        setTab('details')
        setErrorMsg(null)
        loadData()
    } else {
        // reset form
        setTitle(""); setDescription(""); setPriority("medium"); setStatus("pending");
        setAssigneeIds([]); setDueDate(""); setTags([]); setHistory([]); setErrorMsg(null);
    }
  }, [isOpen, assignmentId])

  async function loadData() {
      setLoading(true)
      const [profs, sysTags] = await Promise.all([getProfiles(), getAllTags()])
      setProfiles(profs || [])
      setAllTags(sysTags || [])

      if (assignmentId) {
          const detail = await getAssignmentDetails(assignmentId)
          if (detail) {
              setTitle(detail.title || "")
              setDescription(detail.description || "")
              setPriority(detail.priority || "medium")
              setStatus(detail.status || "pending")
              setAssigneeIds(detail.assignees?.map(a => a.id) || [])
              if (detail.due_date) {
                  const d = new Date(detail.due_date)
                  // Offset the UTC date by local timezone offset before slicing to trick it into local time string
                  const localStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                  setDueDate(localStr)
              } else {
                  setDueDate("")
              }
              setTags(detail.tags || [])
              setHistory(detail.history || [])
          }
      }
      setLoading(false)
  }

  const selectTag = (tagName: string) => {
      const match = allTags.find(t => t.name === tagName)
      if (match) {
          if (!tags.find(t => t.id === match.id)) setTags([...tags, match])
      } else {
          // completely new tag
          setTags([...tags, { id: 'new-'+Date.now(), name: tagName, color: '#3b82f6' }])
      }
      setTagInput("")
      setShowTagMenu(false)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          e.preventDefault()
          selectTag(tagInput.trim().toLowerCase())
      }
  }

  const removeTag = (id: string) => {
      setTags(tags.filter(t => t.id !== id))
  }

  const toggleAssignee = (id: string) => {
      if (assigneeIds.includes(id)) {
          setAssigneeIds(assigneeIds.filter(aid => aid !== id))
      } else {
          setAssigneeIds([...assigneeIds, id])
      }
  }

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)
      setErrorMsg(null)

      const fd = new FormData()
      fd.append("title", title)
      fd.append("description", description)
      fd.append("priority", priority)
      fd.append("status", status)
      
      const assigneeString = assigneeIds.join(",")
      fd.append("assignees", assigneeString)
      
      if (dueDate) fd.append("due_date", new Date(dueDate).toISOString())
      
      const tagString = tags.map(t => t.name).join(",")
      fd.append("tags", tagString)

      try {
          let response;
          if (assignmentId) {
              response = await updateAssignment(assignmentId, fd)
          } else {
              response = await createAssignment(fd)
          }

          if (response?.error) {
              setErrorMsg(response.error)
              toast(response.error, 'error')
          } else {
              toast(assignmentId ? 'Assignment updated!' : 'Assignment created!')
              router.refresh()
              onClose()
          }
      } catch (err) {
          console.error(err)
          setErrorMsg("Failed to save assignment due to a network error.")
      }
      setSaving(false)
  }

  const handleDelete = async () => {
      if (confirm("Are you sure you want to delete this assignment permanently?")) {
          setSaving(true)
          if (assignmentId) await deleteAssignment(assignmentId)
          setSaving(false)
          onClose()
      }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
             <h2 className="text-lg font-semibold text-zinc-100">
                 {assignmentId ? 'Assignment Details' : 'Create Assignment'}
             </h2>
             <div className="flex gap-2">
                 {assignmentId && userRole === 'admin' && (
                     <button onClick={handleDelete} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors">
                         <Trash className="w-4 h-4" />
                     </button>
                 )}
                 <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors">
                    <X className="w-5 h-5" />
                 </button>
             </div>
          </div>

          <div className="flex border-b border-zinc-800">
             <button 
                onClick={() => setTab('details')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'details' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-400 hover:text-zinc-300'}`}
             >
                 Details
             </button>
             {assignmentId && (
                <button 
                    onClick={() => setTab('history')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'history' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-400 hover:text-zinc-300'}`}
                >
                    History
                </button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : tab === 'details' ? (
                <form id="assignment-form" onSubmit={handleSave} className="p-6 space-y-6">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm font-medium flex items-center gap-2">
                             <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200">Title</label>
                        <input disabled={userRole !== 'admin'} value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200">Description</label>
                        <textarea disabled={userRole !== 'admin'} value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>

                    <div className={assignmentId ? "grid grid-cols-2 gap-4" : "space-y-2"}>
                        {assignmentId && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-200">Status</label>
                                <select 
                                    disabled={userRole !== 'admin' && isEffectivelyOverdue} 
                                    value={isEffectivelyOverdue && status !== 'completed' ? 'overdue' : status} 
                                    onChange={e => setStatus(e.target.value)} 
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    {(isEffectivelyOverdue && status !== 'completed') && (
                                        <option value="overdue">Overdue</option>
                                    )}
                                </select>
                                {userRole !== 'admin' && isEffectivelyOverdue && status !== 'completed' && (
                                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Locked: The deadline has passed.</p>
                                )}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-200">Priority</label>
                            <select disabled={userRole !== 'admin'} value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-zinc-200">Assignees</label>
                            <div className="flex flex-wrap gap-2">
                                {profiles.length === 0 && <p className="text-xs text-zinc-500">No members available.</p>}
                                {profiles.map(p => {
                                    const isSelected = assigneeIds.includes(p.id)
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => toggleAssignee(p.id)}
                                            disabled={userRole !== 'admin'}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                                isSelected 
                                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                                        >
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${isSelected ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                                                {(p.full_name || p.email).charAt(0).toUpperCase()}
                                            </div>
                                            {p.full_name || p.email}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-zinc-200">Due Date</label>
                            <input disabled={userRole !== 'admin'} type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(t => (
                                <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    <TagIcon className="w-3 h-3" />
                                    {t.name}
                                    {userRole === 'admin' && (
                                        <button type="button" onClick={() => removeTag(t.id)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                                    )}
                                </span>
                            ))}
                        </div>
                        {userRole === 'admin' && (
                            <div className="relative">
                                <input 
                                    value={tagInput}
                                    onChange={e => {
                                        setTagInput(e.target.value);
                                        setShowTagMenu(true);
                                    }}
                                    onFocus={() => setShowTagMenu(true)}
                                    // delay hiding to allow clicking suggestions
                                    onBlur={() => setTimeout(() => setShowTagMenu(false), 200)}
                                    onKeyDown={handleAddTag}
                                    placeholder="Type a tag and press Enter..."
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                />

                                {showTagMenu && (
                                    <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                        {allTags
                                            .filter(t => t.name.includes(tagInput.toLowerCase().trim()) && !tags.some(st => st.id === t.id))
                                            .map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); selectTag(t.name) }}
                                                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                                                >
                                                    <TagIcon className="w-3.5 h-3.5 text-blue-500" />
                                                    {t.name}
                                                </button>
                                            ))}
                                        {tagInput.trim() !== "" && !allTags.some(t => t.name === tagInput.toLowerCase().trim()) && (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => { e.preventDefault(); selectTag(tagInput.trim().toLowerCase()) }}
                                                className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white italic flex items-center gap-2 border-t border-zinc-800/50"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Create "{tagInput.toLowerCase().trim()}"
                                            </button>
                                        )}
                                        {allTags.length === 0 && tagInput === "" && (
                                            <div className="px-3 py-2 text-sm text-zinc-500 text-center">No tags exist yet.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            ) : (
                <div className="p-6 space-y-6">
                    {history.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center mt-10">No history available.</p>
                    ) : (
                        <div className="relative border-l border-zinc-800 ml-4 space-y-8">
                            {history.map(h => (
                                <div key={h.id} className="pl-6 relative">
                                    <div className="absolute w-3 h-3 bg-zinc-800 border-2 border-zinc-950 rounded-full -left-[6.5px] top-1.5" />
                                    <div className="text-sm text-zinc-400 mb-1">
                                        <span className="text-zinc-100 font-medium">{h.profile?.full_name || h.profile?.email || 'System'}</span> made changes
                                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {new Date(h.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        {Object.entries(h.changes as Record<string, any>).map(([field, vals]) => (
                                            <div key={field} className="text-xs bg-zinc-900/50 border border-zinc-800/50 p-2 rounded-md font-mono">
                                                <span className="text-zinc-500 font-sans">{field}: </span>
                                                <span className="text-red-400 line-through mr-2">{String(vals.old || 'null')}</span>
                                                <span className="text-emerald-400">{String(vals.new || 'null')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
             <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                 Cancel
             </button>
             {tab === 'details' && (
                 <button type="submit" form="assignment-form" disabled={saving || loading} className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                     Save Assignment
                 </button>
             )}
          </div>
      </div>
    </>
  )
}
