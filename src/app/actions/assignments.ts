"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { AssignmentWithDetails, Tag } from "@/types/database"

export async function pulseRefresh() {
    revalidatePath("/", "layout")
    revalidatePath("/", "page")
}

async function syncTags(supabase: any, assignmentId: string, tagsRaw: string[]) {
    // lowercase and trim
    const tags = tagsRaw.map(t => t.trim().toLowerCase()).filter(Boolean)
    if (tags.length === 0) return;

    // 1. Find or create tags in public.tags
    const tagIds: string[] = []
    for (const tagName of tags) {
        let { data: existingTag } = await supabase.from('tags').select('id').eq('name', tagName).single()
        if (!existingTag) {
            const { data: newTag } = await supabase.from('tags').insert({ name: tagName }).select('id').single()
            if (newTag) tagIds.push(newTag.id)
        } else {
            tagIds.push(existingTag.id)
        }
    }

    // 2. Clear old refs and insert new refs
    await supabase.from('assignment_tags').delete().eq('assignment_id', assignmentId)
    
    if (tagIds.length > 0) {
        const inserts = tagIds.map(tid => ({ assignment_id: assignmentId, tag_id: tid }))
        await supabase.from('assignment_tags').insert(inserts)
    }
}

async function syncAssignees(supabase: any, assignmentId: string, assigneesStr: string) {
    const assigneeIds = assigneesStr.split(",").map(id => id.trim()).filter(Boolean)
    
    await supabase.from('assignment_assignees').delete().eq('assignment_id', assignmentId)
    
    if (assigneeIds.length > 0) {
        const inserts = assigneeIds.map(aid => ({ assignment_id: assignmentId, assignee_id: aid }))
        await supabase.from('assignment_assignees').insert(inserts)
    }
}

export async function createAssignment(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const assigneesStr = formData.get("assignees") as string || ""
  const due_date = formData.get("due_date") as string || null
  
  const tagsStr = formData.get("tags") as string || ""

  // Validations
  if (!title || title.trim().length === 0) return { error: "Title is required." }
  if (title.length > 100) return { error: "Title cannot exceed 100 characters." }
  if (description && description.length > 2000) return { error: "Description is too long." }
  
  const validPriorities = ["low", "medium", "high", "urgent"]
  if (!validPriorities.includes(priority)) return { error: "Invalid priority selected." }

  if (due_date) {
      const parsedDate = new Date(due_date)
      if (isNaN(parsedDate.getTime())) return { error: "Invalid due date format." }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in" }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: "Unauthorized: Only Admins can create assignments." }

  const { data: inserted, error } = await supabase.from('assignments').insert({
    title,
    description,
    priority,
    due_date,
    created_by: user.id
  }).select('id').single()

  if (error) {
    return { error: error.message }
  }

  if (tagsStr) {
      await syncTags(supabase, inserted.id, tagsStr.split(","))
  }
  
  if (assigneesStr) {
      await syncAssignees(supabase, inserted.id, assigneesStr)
  }

  revalidatePath("/")
  return { success: true }
}

export async function updateAssignment(id: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const priority = formData.get("priority") as string
    const status = formData.get("status") as string
    const assigneesStr = formData.get("assignees") as string || ""
    const due_date = formData.get("due_date") as string || null
    
    const tagsStr = formData.get("tags") as string || ""

    // Validations
    if (!status) return { error: "Status is required." }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not logged in" }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    const validStatuses = ["pending", "in_progress", "completed", "overdue"]
    if (!validStatuses.includes(status)) return { error: "Invalid status selected." }

    // If Member, they can ONLY update the status.
    if (profile?.role !== 'admin') {
        const { error } = await supabase.from('assignments').update({ status }).eq('id', id)
        if (error) return { error: error.message }
        revalidatePath("/")
        return { success: true }
    }

    // Admin validation for other fields
    if (!title || title.trim().length === 0) return { error: "Title is required." }
    if (title.length > 100) return { error: "Title cannot exceed 100 characters." }
    if (description && description.length > 2000) return { error: "Description is too long." }
    if (!assigneesStr) return { error: "You must select at least one assignee." }
    
    const validPriorities = ["low", "medium", "high", "urgent"]
    if (!validPriorities.includes(priority)) return { error: "Invalid priority selected." }

    if (due_date) {
        const parsedDate = new Date(due_date)
        if (isNaN(parsedDate.getTime())) return { error: "Invalid due date format." }
    }

    const { error } = await supabase
        .from('assignments')
        .update({
            title, description, priority, status, due_date
        })
        .eq('id', id)

    if (error) return { error: error.message }

    await syncTags(supabase, id, tagsStr.split(","))
    await syncAssignees(supabase, id, assigneesStr)

    revalidatePath("/")
    return { success: true }
}

export async function updateAssignmentStatus(id: string, status: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('assignments').update({ status }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath("/")
    return { success: true }
}

export async function deleteAssignment(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath("/")
    return { success: true }
}

export async function getAssignmentDetails(id: string): Promise<AssignmentWithDetails | null> {
    const supabase = await createClient()

    const { data: assignment, error } = await supabase
        .from('assignments')
        .select(`
            *,
            assignees:assignment_assignees(profiles(*)),
            assignment_tags(tags(id, name, color))
        `)
        .eq('id', id)
        .single()

    if (error || !assignment) return null

    // Fetch history separately due to supabase join limits or complexity
    const { data: history } = await supabase
        .from('assignment_history')
        .select('*, profile:profiles!assignment_history_changed_by_fkey(id, email, full_name)')
        .eq('assignment_id', id)
        .order('created_at', { ascending: false })

    // flatten tags and assignees
    const tags = assignment.assignment_tags.map((at: any) => at.tags)
    const assignees = assignment.assignees.map((aa: any) => aa.profiles)

    return {
        ...assignment,
        tags,
        assignees,
        history: history || []
    }
}

export async function getAllTags(): Promise<Tag[]> {
    const supabase = await createClient()
    const { data } = await supabase.from('tags').select('*').order('name')
    return data || []
}

export async function getProfiles() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').eq('role', 'member').order('full_name')
    return data || []
}
