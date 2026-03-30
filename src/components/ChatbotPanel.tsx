"use client"

import { useState } from "react"
import { Bot, User, Send, CheckCircle2, Loader2 } from "lucide-react"
import { createSchedule } from "@/app/actions/schedules"
import { createAssignment } from "@/app/actions/assignments"
import { createTemplate } from "@/app/actions/templates"

type Message = { id: string; role: 'user' | 'assistant'; content: string; extractedData?: any }

export default function ChatbotPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi! I can help you create or schedule assignments, or save templates. Try asking: 'Save this as a template: Weekly bug report'" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      })
      const data = await response.json()

      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.message || "Here is what I understood.",
        extractedData: data.data && data.intent !== 'unknown' ? { ...data.data, intent: data.intent } : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "Oops, something went wrong communicating with Gemini." }])
    } finally {
      setLoading(false)
    }
  }

  const confirmAction = async (msgId: string, extractedData: any) => {
     try {
       setLoading(true)
       // formData mock
       const fd = new FormData()
       if (extractedData.title) fd.append("title", extractedData.title)
       if (extractedData.description) fd.append("description", extractedData.description)
       if (extractedData.priority) fd.append("priority", extractedData.priority)

       if (extractedData.intent === 'create_schedule') {
           if (extractedData.recurrence_type) fd.append("recurrence_type", extractedData.recurrence_type)
           if (extractedData.trigger_time) fd.append("trigger_time", extractedData.trigger_time)
           if (extractedData.config) fd.append("config", JSON.stringify(extractedData.config))
           await createSchedule(fd)
       } else if (extractedData.intent === 'create_template') {
           await createTemplate(fd)
       } else {
           if (extractedData.due_date) fd.append("due_date", extractedData.due_date)
           await createAssignment(fd)
       }
       
       setMessages(prev => prev.map(m => m.id === msgId ? { ...m, extractedData: null, content: "Created successfully! ✅" } : m))
     } catch (err) {
       console.error(err)
       alert("Failed to create")
     } finally {
       setLoading(false)
     }
  }

  return (
    <aside className="w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col hidden xl:flex absolute right-0 top-0 bottom-0 h-screen">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          AI Assistant
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'assistant' ? (
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-emerald-500" />
              </div>
            )}
            
            <div className={`flex flex-col gap-2 max-w-[80%]`}>
                <div className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-300'}`}>
                    {m.content}
                </div>

                {/* Preview Card */}
                {m.extractedData && (
                    <div className="p-3 border border-zinc-700 bg-zinc-950 rounded-lg text-xs space-y-2">
                        <div className="font-semibold text-zinc-100 mb-1 border-b border-zinc-800 pb-1">Review {m.extractedData.intent === 'create_schedule' ? 'Schedule' : m.extractedData.intent === 'create_template' ? 'Template' : 'Assignment'}</div>
                        <div className="text-zinc-400">Title: <span className="text-zinc-100">{m.extractedData.title || 'N/A'}</span></div>
                        <div className="text-zinc-400">Priority: <span className="text-zinc-100">{m.extractedData.priority || 'medium'}</span></div>
                        {m.extractedData.intent === 'create_schedule' ? (
                            <>
                              <div className="text-zinc-400">Recurrence: <span className="text-zinc-100">{m.extractedData.recurrence_type || 'N/A'}</span></div>
                              <div className="text-zinc-400">Time: <span className="text-zinc-100">{m.extractedData.trigger_time || '09:00:00'}</span></div>
                            </>
                        ) : m.extractedData.intent === 'create_template' ? null : (
                              <div className="text-zinc-400">Due: <span className="text-zinc-100">{m.extractedData.due_date || 'N/A'}</span></div>
                        )}
                        <button 
                            disabled={loading}
                            onClick={() => confirmAction(m.id, m.extractedData)}
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md p-2 transition font-medium disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Confirm & Create
                        </button>
                    </div>
                )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="p-3 rounded-lg bg-zinc-800 text-zinc-300 flex items-center">
                 <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to create..."
          disabled={loading}
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 text-sm rounded-md transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  )
}
