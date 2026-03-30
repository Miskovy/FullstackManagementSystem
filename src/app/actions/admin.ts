"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllProfiles() {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not logged in", profiles: [] }

    const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (callerProfile?.role !== 'admin') {
        return { error: "Unauthorized", profiles: [] }
    }

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) return { error: error.message, profiles: [] }
    return { profiles: profiles || [] }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'member') {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not logged in" }

    const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (callerProfile?.role !== 'admin') {
        return { error: "Only admins can change user roles" }
    }

    // Prevent admin from demoting themselves
    if (userId === user.id) {
        return { error: "You cannot change your own role" }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath("/")
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not logged in" }

    const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (callerProfile?.role !== 'admin') {
        return { error: "Only admins can delete users" }
    }

    if (userId === user.id) {
        return { error: "You cannot delete your own account" }
    }

    // Delete from profiles (cascade will handle auth.users via RLS/trigger if set up)
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath("/")
    return { success: true }
}
