import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { signout } from "./login/actions"
import ChatbotPanel from "@/components/ChatbotPanel";
import AssignmentList from "@/components/AssignmentList";
import ScheduleList from "@/components/ScheduleList";

import ExportButton from "@/components/ExportButton";

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile to get the role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // Fetch assignments and schedules
  const { data: assignments } = await supabase
     .from('assignments')
     .select('*')
     .order('created_at', { ascending: false })
     .limit(50)

  const { data: schedules } = await supabase
     .from('schedules')
     .select('*')
     .order('created_at', { ascending: false })

  const completedCount = assignments?.filter(a => a.status === 'completed').length || 0
  const overdueCount = assignments?.filter(a => a.status === 'overdue').length || 0
  const total = assignments?.length || 0
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold tracking-tight">Assignment<span className="text-blue-500">Hub</span></h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
          <a href="#" className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2 text-zinc-100 transition-colors">
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            Assignments
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            Calendar
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            Schedules
          </a>
          {profile?.role === 'admin' && (
             <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors mt-auto">
               Admin Settings
             </a>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <form action={signout}>
            <button className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
               Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Overview</h1>
            <ExportButton assignments={assignments || []} />
          </div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-zinc-400">
               Welcome, <span className="text-zinc-100 font-medium">{profile?.full_name || user.email}</span>
               <span className="ml-2 inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/30">
                 {profile?.role}
               </span>
             </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 lg:p-10 space-y-10">
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-6">Today's snapshot</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-zinc-400">Total Assignments</span>
                <span className="text-3xl font-bold mt-2">{assignments?.length || 0}</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-zinc-400">Completed</span>
                <span className="text-3xl font-bold mt-2 text-emerald-400">{completedCount}</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-zinc-400">Overdue</span>
                <span className="text-3xl text-red-500 font-bold mt-2">{overdueCount}</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                <span className="text-sm font-medium text-zinc-400">Completion Rate</span>
                <span className="text-3xl font-bold mt-2 text-blue-400">{completionRate}%</span>
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Assignments View */}
            <section className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold tracking-tight">Recent Assignments</h2>
                </div>
                {/* Assignment List */}
                <AssignmentList assignments={assignments || []} />
            </section>

            {/* Schedules View */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold tracking-tight">Active Schedules</h2>
                {/* Schedule List */}
                <ScheduleList schedules={schedules || []} />
            </section>
          </div>
        </div>
      </main>

      {/* AI Chatbot Component */}
      <ChatbotPanel />
    </div>
  )
}
