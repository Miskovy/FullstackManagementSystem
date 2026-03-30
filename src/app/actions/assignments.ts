"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function createAssignment(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const assignee_id = formData.get("assignee_id") as string || null
  const due_date = formData.get("due_date") as string || null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in" }

  const { error } = await supabase.from('assignments').insert({
    title,
    description,
    priority,
    assignee_id,
    due_date,
    created_by: user.id
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function updateAssignmentStatus(id: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('assignments')
        .update({ status })
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath("/")
    return { success: true }
}

export async function deleteAssignment(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath("/")
    return { success: true }
}
