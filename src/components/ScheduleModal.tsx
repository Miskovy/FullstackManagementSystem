"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle2, Clock, Trash, AlertCircle, Loader2 } from "lucide-react"
import { Schedule, Profile } from "@/types/database"
import { getSchedule, createSchedule, updateSchedule, deleteSchedule } from "@/app/actions/schedules"
import { getProfiles } from "@/app/actions/assignments"
import { useRouter } from "next/navigation"
import { useToast } from "./ToastProvider"

interface Props {
  isOpen: boolean
  onClose: () => void
  scheduleId?: string | null
}

const WEEKDAYS = [
    { label: 'S', value: 0 },
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 },
]

export default function ScheduleModal({ isOpen, onClose, scheduleId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [profiles, setProfiles] = useState<Profile[]>([])

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [assigneeId, setAssigneeId] = useState<string>("")
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [triggerTime, setTriggerTime] = useState("09:00")
  
  // Config Arrays
  const [selectedDays, setSelectedDays] = useState<number[]>([1]) // Monday
  const [selectedDates, setSelectedDates] = useState<number[]>([1]) // 1st of month

  useEffect(() => {
    if (isOpen) {
        setErrorMsg(null)
        loadData()
    } else {
        // reset form
        setTitle(""); setDescription(""); setPriority("medium"); setAssigneeId("");
        setRecurrenceType("weekly"); setTriggerTime("09:00");
        setSelectedDays([1]); setSelectedDates([1]); setErrorMsg(null);
    }
  }, [isOpen, scheduleId])

  async function loadData() {
      setLoading(true)
      const profs = await getProfiles()
      setProfiles(profs || [])

      if (scheduleId) {
          const detail: Schedule = await getSchedule(scheduleId)
          if (detail) {
              setTitle(detail.title || "")
              setDescription(detail.description || "")
              setPriority(detail.priority || "medium")
              setAssigneeId(detail.default_assignee_id || "")
              setRecurrenceType(detail.recurrence_type || "weekly")
              
              // format time to HH:mm for HTML input
              if (detail.trigger_time) {
                  setTriggerTime(detail.trigger_time.slice(0, 5))
              }

              if (detail.config as any) {
                  const cfg = detail.config as any;
                  if (cfg.days) setSelectedDays(cfg.days)
                  if (cfg.dates) setSelectedDates(cfg.dates)
              }
          }
      }
      setLoading(false)
  }

  const toggleDay = (day: number) => {
      if (selectedDays.includes(day)) {
          setSelectedDays(selectedDays.filter(d => d !== day))
      } else {
          setSelectedDays([...selectedDays, day].sort())
      }
  }

  const toggleDate = (date: number) => {
      if (selectedDates.includes(date)) {
          setSelectedDates(selectedDates.filter(d => d !== date))
      } else {
          setSelectedDates([...selectedDates, date].sort((a,b)=>a-b))
      }
  }

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)
      setErrorMsg(null)

      if (recurrenceType === 'weekly' && selectedDays.length === 0) {
          setErrorMsg("Please select at least one day of the week.")
          setSaving(false)
          return;
      }
      if (recurrenceType === 'monthly' && selectedDates.length === 0) {
          setErrorMsg("Please select at least one date of the month.")
          setSaving(false)
          return;
      }

      const fd = new FormData()
      fd.append("title", title)
      fd.append("description", description)
      fd.append("priority", priority)
      fd.append("recurrence_type", recurrenceType)
      fd.append("trigger_time", triggerTime + ":00") // append seconds
      if (assigneeId) fd.append("default_assignee_id", assigneeId)
      
      const configObj: any = {}
      if (recurrenceType === 'weekly') configObj.days = selectedDays;
      if (recurrenceType === 'monthly') configObj.dates = selectedDates;
      fd.append("config", JSON.stringify(configObj))

      try {
          let response;
          if (scheduleId) {
              response = await updateSchedule(scheduleId, fd)
          } else {
              response = await createSchedule(fd)
          }

          if (response?.error) {
              setErrorMsg(response.error)
              toast(response.error, 'error')
          } else {
              toast(scheduleId ? 'Schedule updated!' : 'Schedule created!')
              router.refresh()
              onClose()
          }
      } catch (err) {
          console.error(err)
          setErrorMsg("Failed to save schedule due to a network error.")
      }
      setSaving(false)
  }

  const handleDelete = async () => {
      if (confirm("Are you sure you want to delete this schedule permanently?")) {
          setSaving(true)
          if (scheduleId) await deleteSchedule(scheduleId)
          setSaving(false)
          router.refresh()
          onClose()
      }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
             <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                 <Clock className="w-5 h-5 text-blue-500" />
                 {scheduleId ? 'Configure Schedule' : 'Create Schedule'}
             </h2>
             <div className="flex gap-2">
                 {scheduleId && (
                     <button onClick={handleDelete} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors">
                         <Trash className="w-4 h-4" />
                     </button>
                 )}
                 <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors">
                    <X className="w-5 h-5" />
                 </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <form id="schedule-form" onSubmit={handleSave} className="p-6 space-y-6">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm font-medium flex items-center gap-2">
                             <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                        </div>
                    )}
                    
                    <div className="space-y-4 pb-6 border-b border-zinc-800">
                        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Automated Payload</h3>
                        <p className="text-xs text-zinc-500 -mt-2 mb-4">What should the generated assignment look like?</p>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-200">Assignment Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-200">Assignment Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-200">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-200">Default Assignee</label>
                                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 text-zinc-100">
                                    <option value="">Unassigned</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Trigger Rules</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-200">Recurrence Interval</label>
                                <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:border-emerald-500 text-zinc-100">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-200">Trigger Time</label>
                                <input type="time" value={triggerTime} onChange={e => setTriggerTime(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-colors" />
                            </div>
                        </div>

                        {recurrenceType === 'weekly' && (
                            <div className="space-y-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                <label className="text-sm font-medium text-zinc-200">Active Days</label>
                                <div className="flex gap-2 justify-between">
                                    {WEEKDAYS.map(day => {
                                        const isSelected = selectedDays.includes(day.value)
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleDay(day.value)}
                                                className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-colors border ${
                                                    isSelected 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                                                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {recurrenceType === 'monthly' && (
                            <div className="space-y-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                <label className="text-sm font-medium text-zinc-200">Active Date(s)</label>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: 31 }).map((_, i) => {
                                        const date = i + 1;
                                        const isSelected = selectedDates.includes(date)
                                        return (
                                            <button
                                                key={date}
                                                type="button"
                                                onClick={() => toggleDate(date)}
                                                className={`w-8 h-8 rounded-md font-medium text-xs flex items-center justify-center transition-colors border ${
                                                    isSelected 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                                                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700'
                                                }`}
                                            >
                                                {date}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        
                    </div>
                </form>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
             <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                 Cancel
             </button>
             <button type="submit" form="schedule-form" disabled={saving || loading} className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                 Save Configuration
             </button>
          </div>
      </div>
    </>
  )
}
