"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { ScheduleType, AssignmentPriority } from "@/types/database"

export async function createSchedule(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const recurrence_type = formData.get("recurrence_type") as ScheduleType
  const priority = formData.get("priority") as AssignmentPriority
  const default_assignee_id = formData.get("default_assignee_id") as string || null
  const trigger_time = formData.get("trigger_time") as string || "09:00:00"
  let configStr = formData.get("config") as string || "{}"
  
  let config = {}
  try {
      config = JSON.parse(configStr)
  } catch (e) {
      config = {}
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in" }

  const { error } = await supabase.from('schedules').insert({
    title,
    description,
    recurrence_type,
    priority,
    default_assignee_id,
    trigger_time,
    config,
    created_by: user.id,
    is_paused: false
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function toggleSchedule(id: string, is_paused: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('schedules')
        .update({ is_paused })
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath("/")
    return { success: true }
}

export async function deleteSchedule(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath("/")
    return { success: true }
}
