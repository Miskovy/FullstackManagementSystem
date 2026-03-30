import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Use the service role key so this bypasses RLS — the cron engine needs full table access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    try {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentDow = now.getDay()        // 0=Sunday (local)
        const currentDom = now.getDate()        // 1-31 (local)
        // Build today string in LOCAL time (YYYY-MM-DD)
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

        // 1. Fetch all active (non-paused) schedules
        const { data: schedules, error: schedErr } = await supabase
            .from('schedules')
            .select('*')
            .eq('is_paused', false)

        if (schedErr) {
            return NextResponse.json({ error: schedErr.message }, { status: 500 })
        }

        let created = 0

        for (const sch of (schedules || [])) {
            // 2. Parse trigger_time "HH:mm:ss" and check if we're within ±5 minutes of it
            const [trigH, trigM] = (sch.trigger_time || "09:00:00").split(':').map(Number)
            const trigMinutes = trigH * 60 + trigM
            const nowMinutes = currentHour * 60 + currentMinute
            
            // We only fire if we're within a 10-minute window of the trigger time.
            // This gives the polling mechanism a window to catch it.
            if (Math.abs(nowMinutes - trigMinutes) > 10 && Math.abs(nowMinutes - trigMinutes) < (24*60 - 10)) {
                continue
            }

            // 3. Check recurrence match
            const config = sch.config || {}
            let shouldFire = false

            if (sch.recurrence_type === 'daily') {
                shouldFire = true
            } else if (sch.recurrence_type === 'weekly') {
                shouldFire = Array.isArray(config.days) && config.days.includes(currentDow)
            } else if (sch.recurrence_type === 'monthly') {
                shouldFire = Array.isArray(config.dates) && config.dates.includes(currentDom)
            }

            if (!shouldFire) continue

            // 4. Check if already created today (avoid duplicates)
            // Use a 24-hour rolling window anchored to UTC midnight of the local day
            const startOfDay = new Date(now)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(now)
            endOfDay.setHours(23, 59, 59, 999)

            const { data: existing } = await supabase
                .from('assignments')
                .select('id')
                .eq('schedule_id', sch.id)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .limit(1)

            if (existing && existing.length > 0) continue  // Already fired today

            // 5. Create the assignment from the schedule blueprint
            const dueDate = new Date(now)
            dueDate.setDate(dueDate.getDate() + 1) // Due tomorrow by default

            const insertPayload: any = {
                title: sch.title,
                description: sch.description,
                priority: sch.priority,
                status: 'pending',
                schedule_id: sch.id,
                created_by: sch.created_by,
                due_date: dueDate.toISOString()
            }

            const { data: newAssignment, error: insertErr } = await supabase
                .from('assignments')
                .insert(insertPayload)
                .select('id')
                .single()

            if (insertErr) {
                console.error(`Failed to create assignment from schedule ${sch.id}:`, insertErr.message)
                continue
            }

            // 6. If the schedule has a default assignee, insert into assignment_assignees
            if (sch.default_assignee_id && newAssignment) {
                await supabase
                    .from('assignment_assignees')
                    .insert({
                        assignment_id: newAssignment.id,
                        assignee_id: sch.default_assignee_id
                    })
            }

            created++
        }

        return NextResponse.json({ 
            ok: true, 
            processed: schedules?.length || 0, 
            created,
            timestamp: now.toISOString()
        })
    } catch (err: any) {
        console.error('Schedule processing error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
