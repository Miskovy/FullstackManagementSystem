export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { signout } from "./login/actions"
import Link from "next/link"
import ChatbotPanel from "@/components/ChatbotPanel";
import AssignmentList from "@/components/AssignmentList";
import ScheduleList from "@/components/ScheduleList";
import ExportButton from "@/components/ExportButton";
import AnalyticsChart from "@/components/AnalyticsChart";
import RealtimeListener from "@/components/RealtimeListener";
import CalendarTab from "@/components/CalendarTab";
import AdminSettingsTab from "@/components/AdminSettingsTab";
import TemplatesTab from "@/components/TemplatesTab";
import MobileNav from "@/components/MobileNav";
import PageTransition from "@/components/PageTransition";

type Props = { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }

export default async function Dashboard(props: Props) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams?.tab === 'string' ? searchParams.tab : 'dashboard';

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
  // Use left join so assignments without assignees still appear
  const assignmentSelect = profile?.role === 'member'
     ? `*, assignment_assignees!inner(assignee_id, profiles(id, full_name, email)), assignment_tags(tags(id, name, color))`
     : `*, assignment_assignees(assignee_id, profiles(id, full_name, email)), assignment_tags(tags(id, name, color))`

  let assignmentQuery = supabase
     .from('assignments')
     .select(assignmentSelect)
     .order('created_at', { ascending: false })
     .limit(50)
     
  if (profile?.role === 'member') {
      assignmentQuery = assignmentQuery.eq('assignment_assignees.assignee_id', user.id)
  }
  
  const { data: assignments } = await assignmentQuery

  const { data: schedules } = await supabase
     .from('schedules')
     .select('*')
     .order('created_at', { ascending: false })

  const completedCount = assignments?.filter(a => a.status === 'completed').length || 0
  const overdueCount = assignments?.filter(a => 
      a.status === 'overdue' || (a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date())
  ).length || 0
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
          <Link href="/?tab=dashboard" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${tab === 'dashboard' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
            Dashboard
          </Link>
          <Link href="/?tab=assignments" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${tab === 'assignments' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
            Assignments
          </Link>
          <Link href="/?tab=templates" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${tab === 'templates' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
            Templates
          </Link>
          <Link href="/?tab=calendar" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${tab === 'calendar' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
            Calendar
          </Link>
          {profile?.role === 'admin' && (
              <Link href="/?tab=schedules" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${tab === 'schedules' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
                Schedules
              </Link>
          )}
          {profile?.role === 'admin' && (
             <Link href="/?tab=settings" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors mt-auto ${tab === 'settings' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
               Admin Settings
             </Link>
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
          <div className="flex items-center gap-3">
             <div className="text-sm text-zinc-400">
               Welcome, <span className="text-zinc-100 font-medium">{profile?.full_name || user.email}</span>
               <span className="ml-2 inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/30">
                 {profile?.role}
               </span>
             </div>
             <MobileNav currentTab={tab} isAdmin={profile?.role === 'admin'} />
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 lg:p-10 space-y-10">
         <PageTransition>
          {tab === 'dashboard' && (
            <>
              <section>
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                    {profile?.role === 'admin' ? "Company Snapshot" : "My Productivity Snapshot"}
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                    <span className="text-sm font-medium text-zinc-400">
                        {profile?.role === 'admin' ? "Total Assignments" : "My Active Tasks"}
                    </span>
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

                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:p-8">
                    <h3 className="text-lg font-bold tracking-tight text-zinc-100">Velocity Trends</h3>
                    <p className="text-sm text-zinc-400 mb-2">Tasks created versus completed over the last 7 days.</p>
                    <AnalyticsChart assignments={assignments || []} />
                </div>
              </section>

              <div className={profile?.role === 'admin' ? "grid lg:grid-cols-3 gap-10" : "grid grid-cols-1 gap-10"}>
                {/* Assignments View Snapshot */}
                <section className={profile?.role === 'admin' ? "lg:col-span-2 space-y-6" : "space-y-6"}>
                    <div className="flex items-center justify-between">
                       <h2 className="text-xl font-bold tracking-tight">
                           {profile?.role === 'admin' ? "Recent Assignments" : "My Recent Tasks"}
                       </h2>
                    </div>
                    {/* First 6 or so assignments */}
                    <AssignmentList assignments={(assignments || []).slice(0, 6)} userRole={profile?.role} />
                </section>

                {/* Schedules View Snapshot */}
                {profile?.role === 'admin' && (
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold tracking-tight">Active Schedules</h2>
                        <ScheduleList schedules={(schedules || []).slice(0, 4)} />
                    </section>
                )}
              </div>
            </>
          )}

          {tab === 'assignments' && (
            <section className="space-y-6">
                <AssignmentList assignments={assignments || []} showHeader={true} userRole={profile?.role} />
            </section>
          )}

          {tab === 'templates' && (
            <section>
                <TemplatesTab />
            </section>
          )}

          {tab === 'schedules' && profile?.role === 'admin' && (
            <section className="space-y-6">
                <ScheduleList schedules={schedules || []} showHeader={true} />
            </section>
          )}

          {tab === 'calendar' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Schedule Forecast</h2>
                <div className="flex gap-4 text-sm font-medium">
                   <div className="flex items-center gap-2 text-zinc-400"><div className="w-3 h-3 rounded-full bg-zinc-800"></div> Assigned</div>
                   <div className="flex items-center gap-2 text-emerald-400"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div> Completed</div>
                   <div className="flex items-center gap-2 text-red-400"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div> Overdue</div>
                   <div className="flex items-center gap-2 text-blue-400"><div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/30 border-dashed"></div> Automated</div>
                </div>
              </div>
              <CalendarTab assignments={assignments || []} schedules={schedules || []} />
            </section>
          )}
          
          {tab === 'settings' && profile?.role === 'admin' && (
            <section>
                <AdminSettingsTab />
            </section>
          )}

         </PageTransition>
        </div>
      </main>

      {/* AI Chatbot Component */}
      <ChatbotPanel />
      <RealtimeListener />
    </div>
  )
}
