"use client"

import { useState, useEffect } from "react"
import { Template, Assignment } from "@/types/database"
import { createTemplate, deleteTemplate, getTemplates } from "@/app/actions/templates"
import { createAssignment } from "@/app/actions/assignments"
import { Plus, Trash2, FileText, Zap, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "./ToastProvider"
import { useRouter } from "next/navigation"

export default function TemplatesTab() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState("medium")
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        const result = await getTemplates()
        setTemplates(result || [])
        setLoading(false)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const fd = new FormData()
        fd.append("title", title)
        fd.append("description", description)
        fd.append("priority", priority)
        const result = await createTemplate(fd)
        if (result?.error) {
            toast(result.error, 'error')
        } else {
            toast("Template saved!")
            setTitle(""); setDescription(""); setPriority("medium"); setShowForm(false)
            await load()
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this template?")) return
        await deleteTemplate(id)
        toast("Template deleted!")
        await load()
    }

    async function handleQuickCreate(t: Template) {
        const fd = new FormData()
        fd.append("title", t.title)
        fd.append("description", t.description || "")
        fd.append("priority", t.priority)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        fd.append("due_date", tomorrow.toISOString())
        const result = await createAssignment(fd)
        if (result?.error) {
            toast(result.error, 'error')
        } else {
            toast(`Assignment "${t.title}" created from template!`)
            router.refresh()
        }
    }

    const priorityBadges: Record<string, string> = {
        low: "bg-zinc-800 text-zinc-400 border-zinc-700",
        medium: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        urgent: "bg-red-500/10 text-red-400 border-red-500/30"
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Assignment Templates</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="p-5 border border-zinc-800 bg-zinc-900/50 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <label className="text-sm font-medium text-zinc-200">Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <label className="text-sm font-medium text-zinc-200">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Template
                        </button>
                    </div>
                </form>
            )}

            {/* Templates Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
            ) : templates.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/50">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                    No templates yet. Create one to quickly spawn assignments!
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {templates.map(t => (
                        <div key={t.id} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:border-zinc-700 transition-colors group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                    <h3 className="font-medium text-zinc-100 truncate">{t.title}</h3>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${priorityBadges[t.priority] || priorityBadges.medium}`}>
                                    {t.priority}
                                </span>
                            </div>
                            {t.description && (
                                <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{t.description}</p>
                            )}
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => handleQuickCreate(t)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md py-1.5 text-xs font-medium transition-colors"
                                >
                                    <Zap className="w-3.5 h-3.5" /> Quick Create
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
