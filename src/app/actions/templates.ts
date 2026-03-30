"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTemplates() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })
    return data || []
}

export async function createTemplate(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string || 'medium'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in" }

  const { error } = await supabase.from('templates').insert({
    title,
    description,
    priority,
    created_by: user.id
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath("/")
    return { success: true }
}
